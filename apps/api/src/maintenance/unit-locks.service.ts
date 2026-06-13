import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class UnitLocksService {
  constructor(private readonly db: DatabaseService) {}

  /** Release all expired exclusive locks, primary path via hourly cron. */
  async releaseAllExpiredLocks(): Promise<number> {
    const { rowCount } = await this.db.query(
      `UPDATE units
       SET status = 'AVAILABLE',
           locked_by_tenant_id = NULL,
           locked_until = NULL,
           updated_at = NOW()
       WHERE status = 'LOCKED'
         AND locked_until IS NOT NULL
         AND locked_until <= NOW()`,
    );
    return rowCount ?? 0;
  }

  /** Safety net at unlock checkout, does not replace cron. */
  async releaseExpiredLockForUnit(unitId: string): Promise<void> {
    await this.db.query(
      `UPDATE units
       SET status = 'AVAILABLE',
           locked_by_tenant_id = NULL,
           locked_until = NULL,
           updated_at = NOW()
       WHERE id = $1
         AND status = 'LOCKED'
         AND locked_until IS NOT NULL
         AND locked_until <= NOW()`,
      [unitId],
    );
  }
}
