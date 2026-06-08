import { Controller, Get, Header, Query } from "@nestjs/common";
import { GeoPlacesQueryDto } from "./dto/geo-places-query.dto";
import { GeoService } from "./geo.service";

@Controller("geo")
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  /** Cached search-area catalog for the explore Where picker (regions, cities, districts). */
  @Get("places")
  @Header("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
  listPlaces(@Query() query: GeoPlacesQueryDto) {
    return this.geo.listPlaces({
      countryCode: query.country,
      kind: query.kind,
      limit: query.limit,
    });
  }
}
