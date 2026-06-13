import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  defaultRentPeriodForBuildingType,
  resolveUnlockPolicy,
} from "@plotpin/shared-types";
import { DatabaseService } from "../database/database.service";
import { PostmarkService } from "./postmark.service";
import { TransactionalEmailBuilder } from "./transactional-email-builder.service";
import { NotificationLogService } from "./notification-log.service";
import { InAppNotificationsService } from "./in-app-notifications.service";
import {
  IN_APP_NOTIFICATION_TYPES,
  type InAppNotificationType,
} from "./in-app-notification.types";

type UnlockRow = {
  unlock_id: string;
  unit_id: string;
  unit_number: string;
  building_id: string;
  building_name: string;
  building_type: string;
  rent_period: string | null;
  landlord_id: string;
  landlord_email: string | null;
  tenant_id: string;
  tenant_email: string | null;
  expires_at: Date;
};

@Injectable()
export class ScheduledNotificationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly postmark: PostmarkService,
    private readonly emails: TransactionalEmailBuilder,
    private readonly log: NotificationLogService,
    private readonly inApp: InAppNotificationsService,
    private readonly config: ConfigService,
  ) {}

  async runAll(): Promise<Record<string, number>> {
    const released = await this.runUnlockExpiringReminders();
    const expired = await this.runUnlockExpiredNotifications();
    const lockEnded = await this.runUnitLockEndedNotifications();
    const featured = await this.runFeaturedExpiringNotifications();
    const stale = await this.runStaleAvailableReminders();
    return {
      unlockExpiring: released,
      unlockExpired: expired,
      unitLockEnded: lockEnded,
      featuredExpiring: featured,
      staleAvailable: stale,
    };
  }

  async runUnlockExpiringReminders(): Promise<number> {
    let sent = 0;
    sent += await this.sendLandlordUnlockExpiring();
    sent += await this.sendTenantUnlockExpiring();
    return sent;
  }

  async runUnlockExpiredNotifications(): Promise<number> {
    const { rows } = await this.db.query<UnlockRow>(
      `SELECT uu.id AS unlock_id, uu.unit_id, uu.tenant_id, uu.expires_at,
              u.unit_number, u.rent_period, u.building_id,
              b.name AS building_name, b.building_type, b.landlord_id,
              landlord_au.email AS landlord_email,
              tenant_au.email AS tenant_email
       FROM unit_unlocks uu
       JOIN units u ON u.id = uu.unit_id
       JOIN buildings b ON b.id = u.building_id
       LEFT JOIN auth.users landlord_au ON landlord_au.id = b.landlord_id
       LEFT JOIN auth.users tenant_au ON tenant_au.id = uu.tenant_id
       WHERE uu.is_winner = TRUE
         AND uu.expires_at IS NOT NULL
         AND uu.expires_at <= NOW()
         AND uu.expires_at > NOW() - INTERVAL '1 hour'`,
    );

    let sent = 0;
    for (const row of rows) {
      const policy = resolveUnlockPolicy({
        buildingType: row.building_type,
        rentPeriod: row.rent_period,
      });
      const manageUrl = this.appUrl(`/landlord/buildings/${row.building_id}`);
      const exploreUrl = this.appUrl("/explore");

      if (
        await this.dispatch({
          userId: row.tenant_id,
          email: row.tenant_email,
          inAppType: IN_APP_NOTIFICATION_TYPES.UNLOCK_EXPIRED_TENANT,
          title: `Unlock ended for ${row.building_name}`,
          body: `Unit ${row.unit_number}. Contact details are no longer available from this unlock.`,
          ctaUrl: exploreUrl,
          payload: {
            buildingId: row.building_id,
            unitId: row.unit_id,
            unlockId: row.unlock_id,
          },
          dedupeKey: `unlock:${row.unlock_id}:expired`,
          emailTemplate: "tenant_unlock_expired",
          emailSubject: `PlotPin unlock ended: ${row.building_name}`,
          buildEmail: () =>
            this.emails.buildUnlockExpiredTenantEmail(
              row.building_name,
              row.unit_number,
              exploreUrl,
              !policy.locksUnit,
            ),
        })
      ) {
        sent += 1;
      }

      if (
        await this.dispatch({
          userId: row.landlord_id,
          email: row.landlord_email,
          inAppType: IN_APP_NOTIFICATION_TYPES.UNLOCK_EXPIRED_LANDLORD,
          title: `Unlock ended for Unit ${row.unit_number}`,
          body: `${row.building_name}. Update the unit if it is rented or still available.`,
          ctaUrl: manageUrl,
          payload: {
            buildingId: row.building_id,
            unitId: row.unit_id,
            unlockId: row.unlock_id,
          },
          dedupeKey: `unlock:${row.unlock_id}:expired`,
          emailTemplate: "landlord_unlock_expired",
          emailSubject: `PlotPin unlock ended for unit ${row.unit_number}`,
          buildEmail: () =>
            this.emails.buildUnlockExpiredLandlordEmail(
              row.building_name,
              row.unit_number,
              manageUrl,
              policy.locksUnit,
            ),
        })
      ) {
        sent += 1;
      }
    }
    return sent;
  }

  async runUnitLockEndedNotifications(): Promise<number> {
    const { rows } = await this.db.query<{
      unit_id: string;
      unit_number: string;
      building_id: string;
      building_name: string;
      landlord_id: string;
      landlord_email: string | null;
      locked_until: Date;
    }>(
      `SELECT u.id AS unit_id, u.unit_number, u.building_id, u.locked_until,
              b.name AS building_name, b.landlord_id,
              au.email AS landlord_email
       FROM units u
       JOIN buildings b ON b.id = u.building_id
       LEFT JOIN auth.users au ON au.id = b.landlord_id
       WHERE u.status = 'LOCKED'
         AND u.locked_until IS NOT NULL
         AND u.locked_until <= NOW()
         AND u.locked_until > NOW() - INTERVAL '1 hour'`,
    );

    let sent = 0;
    for (const row of rows) {
      const template = "landlord_unit_lock_ended";
      const dedupeKey = `unit:${row.unit_id}:lock_ended:${row.locked_until.toISOString()}`;
      const manageUrl = this.appUrl(`/landlord/buildings/${row.building_id}`);

      if (
        await this.dispatch({
          userId: row.landlord_id,
          email: row.landlord_email,
          inAppType: IN_APP_NOTIFICATION_TYPES.UNIT_LOCK_ENDED,
          title: `Exclusive lock ended for unit ${row.unit_number}`,
          body: `${row.building_name} is visible on the map again. Update the unit if it is rented or still available.`,
          ctaUrl: manageUrl,
          payload: {
            buildingId: row.building_id,
            unitId: row.unit_id,
            unitNumber: row.unit_number,
            buildingName: row.building_name,
          },
          dedupeKey,
          emailTemplate: template,
          emailSubject: `PlotPin exclusive lock ended for unit ${row.unit_number}`,
          buildEmail: () =>
            this.emails.buildUnitLockEndedEmail(
              row.building_name,
              row.unit_number,
              manageUrl,
            ),
        })
      ) {
        sent += 1;
      }
    }
    return sent;
  }

  async runFeaturedExpiringNotifications(): Promise<number> {
    const { rows } = await this.db.query<{
      id: string;
      name: string;
      landlord_id: string;
      landlord_email: string | null;
      featured_until: Date;
    }>(
      `SELECT b.id, b.name, b.landlord_id, b.featured_until, au.email AS landlord_email
       FROM buildings b
       LEFT JOIN auth.users au ON au.id = b.landlord_id
       WHERE b.is_verified = TRUE
         AND b.is_featured = TRUE
         AND b.featured_until IS NOT NULL
         AND b.featured_until > NOW() + INTERVAL '6 days 23 hours'
         AND b.featured_until <= NOW() + INTERVAL '7 days 1 hour'`,
    );

    let sent = 0;
    for (const row of rows) {
      const template = "landlord_featured_expiring";
      const dedupeKey = `building:${row.id}:featured_7d`;
      const manageUrl = this.appUrl(`/landlord/buildings/${row.id}`);

      if (
        await this.dispatch({
          userId: row.landlord_id,
          email: row.landlord_email,
          inAppType: IN_APP_NOTIFICATION_TYPES.FEATURED_EXPIRING,
          title: `Featured boost ending soon: ${row.name}`,
          body: "Your featured placement expires in about 7 days. Renew to stay at the top of Explore.",
          ctaUrl: manageUrl,
          payload: { buildingId: row.id, buildingName: row.name },
          dedupeKey,
          emailTemplate: template,
          emailSubject: `PlotPin featured boost ending soon for ${row.name}`,
          buildEmail: () =>
            this.emails.buildFeaturedExpiringEmail(row.name, 7, manageUrl),
        })
      ) {
        sent += 1;
      }
    }
    return sent;
  }

  async runStaleAvailableReminders(): Promise<number> {
    const { rows } = await this.db.query<{
      unit_id: string;
      unit_number: string;
      building_id: string;
      building_name: string;
      landlord_id: string;
      landlord_email: string | null;
    }>(
      `SELECT u.id AS unit_id, u.unit_number, u.building_id,
              b.name AS building_name, b.landlord_id, au.email AS landlord_email
       FROM units u
       JOIN buildings b ON b.id = u.building_id
       LEFT JOIN auth.users au ON au.id = b.landlord_id
       WHERE u.status = 'AVAILABLE'
         AND b.is_verified = TRUE
         AND u.updated_at <= NOW() - INTERVAL '30 days'`,
    );

    let sent = 0;
    for (const row of rows) {
      const template = "landlord_stale_available";
      const dedupeKey = `unit:${row.unit_id}:stale_30d`;
      const manageUrl = this.appUrl(`/landlord/buildings/${row.building_id}`);

      if (
        await this.dispatch({
          userId: row.landlord_id,
          email: row.landlord_email,
          inAppType: IN_APP_NOTIFICATION_TYPES.STALE_AVAILABLE,
          title: `Still available? Unit ${row.unit_number}`,
          body: `${row.building_name} has been listed as available for 30 days. Update the unit if it is rented.`,
          ctaUrl: manageUrl,
          payload: {
            buildingId: row.building_id,
            unitId: row.unit_id,
            unitNumber: row.unit_number,
          },
          dedupeKey,
          emailTemplate: template,
          emailSubject: `PlotPin still available? Unit ${row.unit_number}`,
          buildEmail: () =>
            this.emails.buildStaleAvailableEmail(
              row.building_name,
              row.unit_number,
              manageUrl,
            ),
        })
      ) {
        sent += 1;
      }
    }
    return sent;
  }

  private async sendLandlordUnlockExpiring(): Promise<number> {
    const { rows } = await this.db.query<UnlockRow>(
      `SELECT uu.id AS unlock_id, uu.unit_id, uu.tenant_id, uu.expires_at,
              u.unit_number, u.rent_period, u.building_id,
              b.name AS building_name, b.building_type, b.landlord_id,
              landlord_au.email AS landlord_email,
              tenant_au.email AS tenant_email
       FROM unit_unlocks uu
       JOIN units u ON u.id = uu.unit_id
       JOIN buildings b ON b.id = u.building_id
       LEFT JOIN auth.users landlord_au ON landlord_au.id = b.landlord_id
       LEFT JOIN auth.users tenant_au ON tenant_au.id = uu.tenant_id
       WHERE uu.is_winner = TRUE
         AND uu.expires_at IS NOT NULL
         AND uu.expires_at > NOW() + INTERVAL '11 hours'
         AND uu.expires_at <= NOW() + INTERVAL '13 hours'`,
    );

    let sent = 0;
    for (const row of rows) {
      const template = "landlord_unlock_expiring";
      const dedupeKey = `unlock:${row.unlock_id}:expiring_12h`;
      const manageUrl = this.appUrl(`/landlord/buildings/${row.building_id}`);

      if (
        await this.dispatch({
          userId: row.landlord_id,
          email: row.landlord_email,
          inAppType: IN_APP_NOTIFICATION_TYPES.UNLOCK_EXPIRING_LANDLORD,
          title: `Unlock ending soon for Unit ${row.unit_number}`,
          body: `${row.building_name}. About 12 hours left in the tenant's exclusive window.`,
          ctaUrl: manageUrl,
          payload: {
            buildingId: row.building_id,
            unitId: row.unit_id,
            unlockId: row.unlock_id,
          },
          dedupeKey,
          emailTemplate: template,
          emailSubject: `PlotPin unlock ending soon for unit ${row.unit_number}`,
          buildEmail: () =>
            this.emails.buildUnlockExpiringLandlordEmail(
              row.building_name,
              row.unit_number,
              12,
              manageUrl,
            ),
        })
      ) {
        sent += 1;
      }
    }
    return sent;
  }

  private async sendTenantUnlockExpiring(): Promise<number> {
    const { rows } = await this.db.query<UnlockRow>(
      `SELECT uu.id AS unlock_id, uu.unit_id, uu.tenant_id, uu.expires_at,
              u.unit_number, u.rent_period, u.building_id,
              b.name AS building_name, b.building_type, b.landlord_id,
              landlord_au.email AS landlord_email,
              tenant_au.email AS tenant_email
       FROM unit_unlocks uu
       JOIN units u ON u.id = uu.unit_id
       JOIN buildings b ON b.id = u.building_id
       LEFT JOIN auth.users landlord_au ON landlord_au.id = b.landlord_id
       LEFT JOIN auth.users tenant_au ON tenant_au.id = uu.tenant_id
       WHERE uu.is_winner = TRUE
         AND uu.expires_at IS NOT NULL
         AND uu.expires_at > NOW() + INTERVAL '23 hours'
         AND uu.expires_at <= NOW() + INTERVAL '25 hours'`,
    );

    let sent = 0;
    for (const row of rows) {
      const policy = resolveUnlockPolicy({
        buildingType: row.building_type,
        rentPeriod:
          row.rent_period ?? defaultRentPeriodForBuildingType(row.building_type),
      });
      const template = "tenant_unlock_expiring";
      const dedupeKey = `unlock:${row.unlock_id}:expiring_24h`;
      const unlocksUrl = this.appUrl(
        `/tenant/unlocks?unlock=${encodeURIComponent(row.unlock_id)}`,
      );

      if (
        await this.dispatch({
          userId: row.tenant_id,
          email: row.tenant_email,
          inAppType: IN_APP_NOTIFICATION_TYPES.UNLOCK_EXPIRING_TENANT,
          title: `Unlock ending soon for ${row.building_name}`,
          body: `Unit ${row.unit_number}. About 24 hours left to contact the landlord.`,
          ctaUrl: unlocksUrl,
          payload: {
            buildingId: row.building_id,
            unitId: row.unit_id,
            unlockId: row.unlock_id,
          },
          dedupeKey,
          emailTemplate: template,
          emailSubject: `PlotPin unlock ending soon for ${row.building_name}`,
          buildEmail: () =>
            this.emails.buildUnlockExpiringTenantEmail(
              row.building_name,
              row.unit_number,
              24,
              !policy.locksUnit,
              unlocksUrl,
            ),
        })
      ) {
        sent += 1;
      }
    }
    return sent;
  }

  /** In-app first; email is optional second channel (idempotent via notification_log). */
  private async dispatch(params: {
    userId: string;
    email: string | null;
    inAppType: InAppNotificationType;
    title: string;
    body: string;
    ctaUrl?: string;
    payload?: Record<string, unknown>;
    dedupeKey: string;
    emailTemplate: string;
    emailSubject: string;
    buildEmail: () => { html: string; text: string };
  }): Promise<boolean> {
    await this.inApp.create({
      userId: params.userId,
      type: params.inAppType,
      title: params.title,
      body: params.body,
      ctaUrl: params.ctaUrl,
      payload: params.payload,
      dedupeKey: params.dedupeKey,
    });

    const email = params.email?.trim();
    if (!email) return true;

    if (await this.log.wasSent(params.userId, params.emailTemplate, params.dedupeKey)) {
      return false;
    }

    const { html, text } = params.buildEmail();
    const result = await this.postmark.sendEmail({
      to: email,
      subject: params.emailSubject,
      htmlBody: html,
      textBody: text,
      tag: params.emailTemplate,
    });

    if (result.delivered) {
      await this.log.recordSent({
        userId: params.userId,
        template: params.emailTemplate,
        dedupeKey: params.dedupeKey,
        payload: params.payload,
      });
      return true;
    }

    return false;
  }

  private appUrl(path: string) {
    const base =
      this.config.get<string>("WEB_APP_URL")?.trim() ||
      this.config.get<string>("CORS_ORIGIN")?.split(",")[0]?.trim() ||
      "http://localhost:3000";
    return `${base.replace(/\/$/, "")}${path}`;
  }
}
