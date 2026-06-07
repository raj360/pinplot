import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateListingReportDto, ReviewListingReportDto } from "./dto/report.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async create(buildingId: string, reporterId: string, dto: CreateListingReportDto) {
    const hasUnlock = await this.tenantHasActiveUnlock(buildingId, reporterId);
    if (!hasUnlock) {
      throw new ForbiddenException(
        "You can report a listing only after unlocking contact for that property.",
      );
    }

    const reason = dto.reason.trim();
    const details = dto.details?.trim() || null;
    if (reason === "Other" && (!details || details.length < 10)) {
      throw new BadRequestException(
        "Please describe the issue when selecting Other (at least 10 characters).",
      );
    }

    const { rows } = await this.db.query(
      `INSERT INTO listing_reports (building_id, reporter_id, reason, details)
       VALUES ($1, $2, $3, $4)
       RETURNING id, building_id, reason, details, status, created_at`,
      [buildingId, reporterId, reason, details],
    );

    return {
      id: rows[0].id,
      buildingId: rows[0].building_id,
      reason: rows[0].reason,
      details: rows[0].details,
      status: rows[0].status,
      createdAt: rows[0].created_at,
    };
  }

  async listOpen() {
    const { rows } = await this.db.query(
      `SELECT r.id, r.building_id, r.reason, r.details, r.status, r.created_at,
              b.name AS building_name, b.city, b.district,
              p.first_name, p.last_name,
              au.email AS reporter_email
       FROM listing_reports r
       JOIN buildings b ON b.id = r.building_id
       JOIN profiles p ON p.id = r.reporter_id
       LEFT JOIN auth.users au ON au.id = r.reporter_id
       WHERE r.status = 'OPEN'
       ORDER BY r.created_at ASC`,
    );

    return rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      buildingId: row.building_id,
      buildingName: row.building_name,
      city: row.city,
      district: row.district,
      reason: row.reason,
      details: row.details,
      status: row.status,
      createdAt: row.created_at,
      reporter: {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.reporter_email,
      },
    }));
  }

  async review(reportId: string, adminId: string, dto: ReviewListingReportDto) {
    const { rows } = await this.db.query(
      `UPDATE listing_reports
       SET status = $2::listing_report_status,
           reviewed_at = NOW(),
           reviewed_by = $3,
           admin_notes = $4,
           created_at = created_at
       WHERE id = $1 AND status = 'OPEN'
       RETURNING id, status, reviewed_at`,
      [reportId, dto.status, adminId, dto.adminNotes?.trim() || null],
    );

    if (!rows[0]) {
      throw new NotFoundException("Report not found or already reviewed.");
    }

    return {
      id: rows[0].id,
      status: rows[0].status,
      reviewedAt: rows[0].reviewed_at,
    };
  }

  private async tenantHasActiveUnlock(buildingId: string, tenantId: string) {
    const { rows } = await this.db.query(
      `SELECT 1
       FROM unit_unlocks uu
       JOIN units u ON u.id = uu.unit_id
       WHERE u.building_id = $1
         AND uu.tenant_id = $2
         AND uu.is_winner = TRUE
         AND (uu.expires_at IS NULL OR uu.expires_at > NOW())
       LIMIT 1`,
      [buildingId, tenantId],
    );
    return Boolean(rows[0]);
  }
}
