import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, QueryResult, QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const connectionString = this.config.get<string>("DATABASE_URL");
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured");
    }

    const useSupabaseSsl =
      connectionString.includes("supabase.co") ||
      connectionString.includes("pooler.supabase.com");

    this.pool = new Pool({
      connectionString,
      ssl: useSupabaseSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
    });

    this.pool.on("error", (err) => {
      this.logger.error("Unexpected DB pool error", err);
    });
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }
}
