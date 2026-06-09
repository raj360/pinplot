import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { createInMemoryCache } from "../common/in-memory-cache";

export type FxRateEntry = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  updatedAt: string;
};

@Injectable()
export class FxRatesService {
  private readonly cache = createInMemoryCache<FxRateEntry[]>(15 * 60 * 1000);

  constructor(private readonly db: DatabaseService) {}

  async listRates(): Promise<FxRateEntry[]> {
    const cached = this.cache.get();
    if (cached) return cached;

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

    const mapped = rows.map((row) => ({
      baseCurrency: row.base_currency,
      quoteCurrency: row.quote_currency,
      rate: Number(row.rate),
      updatedAt: row.updated_at.toISOString(),
    }));
    this.cache.set(mapped);
    return mapped;
  }
}
