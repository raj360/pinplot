const TRANSIENT_PG_CODES = new Set([
  "08000", // connection_exception
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08003", // connection_does_not_exist
  "08006", // connection_failure
  "08004", // sqlserver_rejected_establishment_of_sqlconnection
  "57P01", // admin_shutdown
  "53300", // too_many_connections
  "53200", // out_of_memory (pool pressure, retry may help)
  "40001", // serialization_failure
  "40P01", // deadlock_detected
]);

const TRANSIENT_MESSAGE =
  /connection terminated|ECONNRESET|ECONNREFUSED|timeout expired|Connection terminated unexpectedly|server closed the connection/i;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const code = (error as { code?: string }).code;
  if (code && TRANSIENT_PG_CODES.has(code)) return true;

  const message = String((error as Error).message ?? "");
  return TRANSIENT_MESSAGE.test(message);
}

/** Retry short-lived pool / network blips (auth guards, hot paths). */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === attempts - 1) {
        throw error;
      }
      await sleep(50 * (attempt + 1));
    }
  }

  throw lastError;
}
