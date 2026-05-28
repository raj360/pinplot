import { Controller, Get } from "@nestjs/common";
import { APP_NAME, APP_VERSION } from "@plotpin/shared-types";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "ok",
      service: APP_NAME,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    };
  }
}
