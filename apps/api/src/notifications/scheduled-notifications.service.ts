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

      if (row.tenant_email) {
        const template = "tenant_unlock_expired";
        const dedupeKey = `unlock:${row.unlock_id}:expired`;
        if (!(await this.log.wasSent(row.tenant_id, template, dedupeKey))) {
          const { html, text } = this.emails.buildUnlockExpiredTenantEmail(
            row.building_name,
            row.unit_number,
            exploreUrl,
            !policy.locksUnit,
          );
          const result = await this.postmark.sendEmail({
            to: row.tenant_email,
            subject: `PlotPin unlock ended — ${row.building_name}`,
            htmlBody: html,
            textBody: text,
            tag: template,
          });
          if (result.delivered) {
            await this.log.recordSent({
              userId: row.tenant_id,
              template,
              dedupeKey,
            });
            sent += 1;
          }
        }
      }

      if (row.landlord_email) {
        const template = "landlord_unlock_expired";
        const dedupeKey = `unlock:${row.unlock_id}:expired`;
        if (!(await this.log.wasSent(row.landlord_id, template, dedupeKey))) {
          const { html, text } = this.emails.buildUnlockExpiredLandlordEmail(
            row.building_name,
            row.unit_number,
            manageUrl,
            policy.locksUnit,
          );
          const result = await this.postmark.sendEmail({
            to: row.landlord_email,
            subject: `PlotPin: unlock ended — Unit ${row.unit_number}`,
            htmlBody: html,
            textBody: text,
            tag: template,
          });
          if (result.delivered) {
            await this.log.recordSent({
              userId: row.landlord_id,
              template,
              dedupeKey,
            });
            sent += 1;
          }
        }
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
      if (!row.landlord_email) continue;
      const template = "landlord_unit_lock_ended";
      const dedupeKey = `unit:${row.unit_id}:lock_ended:${row.locked_until.toISOString()}`;
      if (await this.log.wasSent(row.landlord_id, template, dedupeKey)) continue;

      const manageUrl = this.appUrl(`/landlord/buildings/${row.building_id}`);
      const { html, text } = this.emails.buildUnitLockEndedEmail(
        row.building_name,
        row.unit_number,
        manageUrl,
      );
      const result = await this.postmark.sendEmail({
        to: row.landlord_email,
        subject: `PlotPin: exclusive lock ended — Unit ${row.unit_number}`,
        htmlBody: html,
        textBody: text,
        tag: template,
      });
      if (result.delivered) {
        await this.log.recordSent({
          userId: row.landlord_id,
          template,
          dedupeKey,
        });
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
      if (!row.landlord_email) continue;
      const template = "landlord_featured_expiring";
      const dedupeKey = `building:${row.id}:featured_7d`;
      if (await this.log.wasSent(row.landlord_id, template, dedupeKey)) continue;

      const manageUrl = this.appUrl(`/landlord/buildings/${row.id}`);
      const { html, text } = this.emails.buildFeaturedExpiringEmail(
        row.name,
        7,
        manageUrl,
      );
      const result = await this.postmark.sendEmail({
        to: row.landlord_email,
        subject: `PlotPin: featured boost ending soon — ${row.name}`,
        htmlBody: html,
        textBody: text,
        tag: template,
      });
      if (result.delivered) {
        await this.log.recordSent({
          userId: row.landlord_id,
          template,
          dedupeKey,
        });
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
      if (!row.landlord_email) continue;
      const template = "landlord_stale_available";
      const dedupeKey = `unit:${row.unit_id}:stale_30d`;
      if (await this.log.wasSent(row.landlord_id, template, dedupeKey)) continue;

      const manageUrl = this.appUrl(`/landlord/buildings/${row.building_id}`);
      const { html, text } = this.emails.buildStaleAvailableEmail(
        row.building_name,
        row.unit_number,
        manageUrl,
      );
      const result = await this.postmark.sendEmail({
        to: row.landlord_email,
        subject: `PlotPin: still available? — Unit ${row.unit_number}`,
        htmlBody: html,
        textBody: text,
        tag: template,
      });
      if (result.delivered) {
        await this.log.recordSent({
          userId: row.landlord_id,
          template,
          dedupeKey,
        });
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
      if (!row.landlord_email) continue;
      const template = "landlord_unlock_expiring";
      const dedupeKey = `unlock:${row.unlock_id}:expiring_12h`;
      if (await this.log.wasSent(row.landlord_id, template, dedupeKey)) continue;

      const manageUrl = this.appUrl(`/landlord/buildings/${row.building_id}`);
      const { html, text } = this.emails.buildUnlockExpiringLandlordEmail(
        row.building_name,
        row.unit_number,
        12,
        manageUrl,
      );
      const result = await this.postmark.sendEmail({
        to: row.landlord_email,
        subject: `PlotPin: unlock ending soon — Unit ${row.unit_number}`,
        htmlBody: html,
        textBody: text,
        tag: template,
      });
      if (result.delivered) {
        await this.log.recordSent({
          userId: row.landlord_id,
          template,
          dedupeKey,
        });
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
      if (!row.tenant_email) continue;
      const policy = resolveUnlockPolicy({
        buildingType: row.building_type,
        rentPeriod: row.rent_period ?? defaultRentPeriodForBuildingType(row.building_type),
      });
      const template = "tenant_unlock_expiring";
      const dedupeKey = `unlock:${row.unlock_id}:expiring_24h`;
      if (await this.log.wasSent(row.tenant_id, template, dedupeKey)) continue;

      const unlocksUrl = this.appUrl("/tenant/unlocks");
      const { html, text } = this.emails.buildUnlockExpiringTenantEmail(
        row.building_name,
        row.unit_number,
        24,
        !policy.locksUnit,
        unlocksUrl,
      );
      const result = await this.postmark.sendEmail({
        to: row.tenant_email,
        subject: `PlotPin: unlock ending soon — ${row.building_name}`,
        htmlBody: html,
        textBody: text,
        tag: template,
      });
      if (result.delivered) {
        await this.log.recordSent({
          userId: row.tenant_id,
          template,
          dedupeKey,
        });
        sent += 1;
      }
    }
    return sent;
  }

  private appUrl(path: string) {
    const base =
      this.config.get<string>("WEB_APP_URL")?.trim() ||
      this.config.get<string>("CORS_ORIGIN")?.split(",")[0]?.trim() ||
      "http://localhost:3000";
    return `${base.replace(/\/$/, "")}${path}`;
  }
}
