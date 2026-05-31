import { Controller, Get, Query } from "@nestjs/common";
import { PricingService } from "./pricing.service";
import { QuoteQueryDto } from "./dto/quote-query.dto";
import type { BuildingType } from "@plotpin/shared-types";

@Controller("pricing")
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get("quote")
  quote(@Query() query: QuoteQueryDto) {
    return this.pricing.quote({
      buildingType: (query.buildingType as BuildingType | undefined) ?? null,
      bedrooms: query.bedrooms,
      purpose: query.purpose,
      countryCode: query.countryCode,
    });
  }
}
