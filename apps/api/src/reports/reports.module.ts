import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  AdminReportsController,
  ListingReportsController,
} from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [AuthModule],
  controllers: [ListingReportsController, AdminReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
