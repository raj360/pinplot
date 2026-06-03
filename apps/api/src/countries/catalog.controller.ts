import { Controller, Get } from "@nestjs/common";
import { CountriesService } from "./countries.service";
import { FxRatesService } from "./fx-rates.service";

@Controller()
export class CatalogController {
  constructor(
    private readonly countries: CountriesService,
    private readonly fxRates: FxRatesService,
  ) {}

  @Get("countries")
  listCountries() {
    return this.countries.listActive();
  }

  @Get("fx/rates")
  listFxRates() {
    return this.fxRates.listRates();
  }
}
