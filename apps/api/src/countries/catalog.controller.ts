import { Controller, Get, Header } from "@nestjs/common";
import { CountriesService } from "./countries.service";
import { FxRatesService } from "./fx-rates.service";

@Controller()
export class CatalogController {
  constructor(
    private readonly countries: CountriesService,
    private readonly fxRates: FxRatesService,
  ) {}

  @Get("countries")
  @Header("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
  listCountries() {
    return this.countries.listActive();
  }

  @Get("fx/rates")
  @Header("Cache-Control", "public, max-age=900, stale-while-revalidate=3600")
  listFxRates() {
    return this.fxRates.listRates();
  }
}
