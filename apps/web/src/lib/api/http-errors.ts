export class ApiHttpError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const msg = (body as { message?: string | string[] }).message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string" && msg.trim()) return msg;
  return fallback;
}

export async function readApiError(
  res: Response,
  fallbackMessage: string,
): Promise<ApiHttpError> {
  const retryAfterSeconds = parseRetryAfter(res.headers.get("Retry-After"));
  const text = await res.text();

  if (!text) {
    return new ApiHttpError(fallbackMessage, res.status, retryAfterSeconds);
  }

  try {
    const body = JSON.parse(text) as unknown;
    return new ApiHttpError(
      messageFromBody(body, fallbackMessage),
      res.status,
      retryAfterSeconds,
    );
  } catch {
    return new ApiHttpError(text || fallbackMessage, res.status, retryAfterSeconds);
  }
}

export type ExploreLoadErrorKind = "rate_limit" | "server" | "generic";

export function classifyExploreLoadError(error: unknown): {
  kind: ExploreLoadErrorKind;
  message: string;
} {
  if (error instanceof ApiHttpError) {
    if (error.status === 429) {
      const wait = error.retryAfterSeconds ?? 60;
      return {
        kind: "rate_limit",
        message: `You're searching the map quickly. Wait about ${wait} seconds, then try again.`,
      };
    }
    if (error.status >= 500) {
      return {
        kind: "server",
        message: "PlotPin is busy right now. Try again in a moment.",
      };
    }
    if (error.message) {
      return { kind: "generic", message: error.message };
    }
  }

  if (error instanceof Error && error.message) {
    return { kind: "generic", message: error.message };
  }

  return {
    kind: "generic",
    message: "Could not load buildings. Check your connection or try again soon.",
  };
}
