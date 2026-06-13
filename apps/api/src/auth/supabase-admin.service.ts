import {
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DatabaseService } from "../database/database.service";

const CODE_LENGTH = 6;
const DEFAULT_TTL_SECONDS = 600;

@Injectable()
export class SupabaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseAdminService.name);
  private adminClient: SupabaseClient | null = null;
  private anonClient: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>("NEXT_PUBLIC_SUPABASE_URL")?.trim();
    const serviceKey = this.config
      .get<string>("SUPABASE_SERVICE_ROLE_KEY")
      ?.trim();
    const anonKey = this.config
      .get<string>("NEXT_PUBLIC_SUPABASE_ANON_KEY")
      ?.trim();

    if (url && serviceKey) {
      this.adminClient = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } else {
      this.logger.warn(
        "SUPABASE_SERVICE_ROLE_KEY not set, OTP verify cannot create sessions",
      );
    }

    if (url && anonKey) {
      this.anonClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
  }

  get isConfigured(): boolean {
    return Boolean(this.adminClient && this.anonClient);
  }

  async createSessionForEmail(email: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  } | null> {
    if (!this.adminClient || !this.anonClient) return null;

    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    try {
      await this.adminClient.auth.admin.createUser({
        email: normalized,
        email_confirm: true,
        user_metadata: { role: "TENANT", country_code: "UG" },
      });
    } catch {
      /* user may already exist */
    }

    const { data: linkData, error } =
      await this.adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: normalized,
      });

    if (error || !linkData?.properties?.hashed_token) {
      this.logger.error(`generateLink failed: ${error?.message ?? "no token"}`);
      return null;
    }

    const { data: sessionData, error: verifyError } =
      await this.anonClient.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink",
      });

    if (verifyError || !sessionData.session) {
      this.logger.error(
        `verifyOtp failed: ${verifyError?.message ?? "no session"}`,
      );
      return null;
    }

    return {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in ?? 3600,
    };
  }

  async removeStorageObjects(
    bucket: string,
    paths: string[],
  ): Promise<void> {
    if (!this.adminClient || paths.length === 0) return;

    const { error } = await this.adminClient.storage.from(bucket).remove(paths);
    if (error) {
      this.logger.warn(
        `Storage remove failed (${bucket}, ${paths.length} objects): ${error.message}`,
      );
    }
  }
}

export { CODE_LENGTH, DEFAULT_TTL_SECONDS };
