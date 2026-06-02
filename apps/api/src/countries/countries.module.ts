import { Module } from "@nestjs/common";
import { CatalogController } from "./catalog.controller";
import { CountriesService } from "./countries.service";
import { FxRatesService } from "./fx-rates.service";

@Module({
  controllers: [CatalogController],
  providers: [CountriesService, FxRatesService],
  exports: [CountriesService, FxRatesService],
})
export class CountriesModule {}
