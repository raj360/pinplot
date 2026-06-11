import { Module } from "@nestjs/common";
import { UnitLocksService } from "./unit-locks.service";

@Module({
  providers: [UnitLocksService],
  exports: [UnitLocksService],
})
export class MaintenanceModule {}
