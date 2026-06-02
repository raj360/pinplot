import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type FxRateEntry = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  updatedAt: string;
};

@Injectable()
export class FxRatesService {
  constructor(private readonly db: DatabaseService) {}

  async listRates(): Promise<FxRateEntry[]> {
    const { rows } = await this.db.query<{
      base_currency: string;
      quote_currency: string;
      rate: string;
      updated_at: Date;
    }>(
      `SELECT base_currency, quote_currency, rate, updated_at
       FROM fx_rates
       ORDER BY base_currency, quote_currency`,
    );

    return rows.map((row) => ({
      baseCurrency: row.base_currency,
      quoteCurrency: row.quote_currency,
      rate: Number(row.rate),
      updatedAt: row.updated_at.toISOString(),
    }));
  }
}
