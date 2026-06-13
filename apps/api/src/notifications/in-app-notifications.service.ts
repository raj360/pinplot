import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import type {
  CreateInAppNotificationInput,
  InAppNotificationRecord,
  InAppNotificationType,
} from "./in-app-notification.types";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  cta_url: string | null;
  payload: Record<string, unknown> | null;
  read_at: Date | null;
  dismissed_at: Date | null;
  created_at: Date;
};

@Injectable()
export class InAppNotificationsService {
  constructor(private readonly db: DatabaseService) {}

  /** Idempotent create — returns whether a new row was inserted. */
  async create(input: CreateInAppNotificationInput): Promise<{ created: boolean }> {
    const { rowCount } = await this.db.query(
      `INSERT INTO user_notifications
         (user_id, type, title, body, cta_url, payload, dedupe_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, type, dedupe_key) DO NOTHING`,
      [
        input.userId,
        input.type,
        input.title,
        input.body,
        input.ctaUrl ?? null,
        JSON.stringify(input.payload ?? {}),
        input.dedupeKey,
      ],
    );
    return { created: (rowCount ?? 0) > 0 };
  }

  async listMine(
    userId: string,
    options: {
      limit?: number;
      undismissedOnly?: boolean;
      unreadOnly?: boolean;
      types?: InAppNotificationType[];
    } = {},
  ): Promise<InAppNotificationRecord[]> {
    const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
    const params: unknown[] = [userId];
    const filters = ["user_id = $1"];

    if (options.undismissedOnly !== false) {
      filters.push("dismissed_at IS NULL");
    }
    if (options.unreadOnly) {
      filters.push("read_at IS NULL");
    }
    if (options.types?.length) {
      params.push(options.types);
      filters.push(`type = ANY($${params.length}::text[])`);
    }

    params.push(limit);
    const { rows } = await this.db.query<NotificationRow>(
      `SELECT id, type, title, body, cta_url, payload, read_at, dismissed_at, created_at
       FROM user_notifications
       WHERE ${filters.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return rows.map((row) => this.toRecord(row));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { rows } = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM user_notifications
       WHERE user_id = $1
         AND dismissed_at IS NULL
         AND read_at IS NULL`,
      [userId],
    );
    return Number(rows[0]?.count ?? 0);
  }

  async markRead(userId: string, notificationId: string): Promise<InAppNotificationRecord> {
    const { rows } = await this.db.query<NotificationRow>(
      `UPDATE user_notifications
       SET read_at = COALESCE(read_at, NOW())
       WHERE id = $1 AND user_id = $2
       RETURNING id, type, title, body, cta_url, payload, read_at, dismissed_at, created_at`,
      [notificationId, userId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException("Notification not found");
    return this.toRecord(row);
  }

  async dismiss(userId: string, notificationId: string): Promise<InAppNotificationRecord> {
    const { rows } = await this.db.query<NotificationRow>(
      `UPDATE user_notifications
       SET dismissed_at = COALESCE(dismissed_at, NOW()),
           read_at = COALESCE(read_at, NOW())
       WHERE id = $1 AND user_id = $2
       RETURNING id, type, title, body, cta_url, payload, read_at, dismissed_at, created_at`,
      [notificationId, userId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException("Notification not found");
    return this.toRecord(row);
  }

  async markAllRead(userId: string): Promise<number> {
    const { rowCount } = await this.db.query(
      `UPDATE user_notifications
       SET read_at = COALESCE(read_at, NOW())
       WHERE user_id = $1
         AND dismissed_at IS NULL
         AND read_at IS NULL`,
      [userId],
    );
    return rowCount ?? 0;
  }

  private toRecord(row: NotificationRow): InAppNotificationRecord {
    return {
      id: row.id,
      type: row.type as InAppNotificationType,
      title: row.title,
      body: row.body,
      ctaUrl: row.cta_url,
      payload: row.payload ?? {},
      readAt: row.read_at?.toISOString() ?? null,
      dismissedAt: row.dismissed_at?.toISOString() ?? null,
      createdAt: row.created_at.toISOString(),
    };
  }
}
