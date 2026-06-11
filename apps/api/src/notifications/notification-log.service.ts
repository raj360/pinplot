import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class NotificationLogService {
  constructor(private readonly db: DatabaseService) {}

  async wasSent(
    userId: string,
    template: string,
    dedupeKey: string,
  ): Promise<boolean> {
    const { rows } = await this.db.query<{ id: string }>(
      `SELECT id FROM notification_log
       WHERE user_id = $1 AND template = $2 AND dedupe_key = $3
       LIMIT 1`,
      [userId, template, dedupeKey],
    );
    return rows.length > 0;
  }

  async recordSent(params: {
    userId: string;
    template: string;
    dedupeKey: string;
    channel?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO notification_log (user_id, channel, template, dedupe_key, payload)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, template, dedupe_key) DO NOTHING`,
      [
        params.userId,
        params.channel ?? "email",
        params.template,
        params.dedupeKey,
        JSON.stringify(params.payload ?? {}),
      ],
    );
  }
}
