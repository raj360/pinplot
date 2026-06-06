"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import {
  confirmFlutterwaveReturn,
  confirmLemonSqueezyReturn,
  fetchUnlockPaymentStatus,
} from "@/lib/api/payments";
import { unlockUnit } from "@/lib/api/unlocks";

export function UnlockCompleteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const unitId = searchParams.get("unitId");
  const txRef = searchParams.get("tx_ref");
  const transactionId = searchParams.get("transaction_id");
  const status = searchParams.get("status");

  const configError = useMemo(() => {
    if (!paymentId || !unitId) {
      return "Missing payment details. Return to explore and try again.";
    }
    return null;
  }, [paymentId, unitId]);

  const [message, setMessage] = useState("Confirming your payment…");
  const [flowError, setFlowError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const error = configError ?? flowError;

  useEffect(() => {
    if (configError || !paymentId || !unitId) return;

    let cancelled = false;
    let attempts = 0;
    let interval: number | undefined;

    const poll = async (): Promise<boolean> => {
      const result = await fetchUnlockPaymentStatus(paymentId);
      if (result.unlockState === "completed") return true;
      if (result.status === "COMPLETED" && result.unitId === unitId) {
        try {
          await unlockUnit(unitId, { paymentId, acceptTerms: true });
          return true;
        } catch (err) {
          if (
            err instanceof Error &&
            err.message.includes("already used")
          ) {
            return true;
          }
          throw err;
        }
      }
      return false;
    };

    async function finalize() {
      try {
        if (txRef && transactionId && status) {
          await confirmFlutterwaveReturn({
            txRef,
            transactionId,
            status,
          });
        } else {
          await confirmLemonSqueezyReturn(paymentId);
        }

        if (await poll()) {
          if (!cancelled) {
            setDone(true);
            setMessage("Unlock active — landlord contact is ready.");
          }
          return;
        }

        interval = window.setInterval(async () => {
          attempts += 1;
          if (cancelled || attempts > 15) {
            if (interval) window.clearInterval(interval);
            if (!cancelled && attempts > 15) {
              setFlowError(
                "Payment is taking longer than expected. Check My unlocks in a minute.",
              );
            }
            return;
          }
          if (await poll()) {
            if (interval) window.clearInterval(interval);
            if (!cancelled) {
              setDone(true);
              setMessage("Unlock active — landlord contact is ready.");
            }
          }
        }, 2000);
      } catch (err) {
        if (!cancelled) {
          setFlowError(
            err instanceof Error ? err.message : "Could not confirm payment.",
          );
        }
      }
    }

    void finalize();

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [configError, paymentId, unitId, txRef, transactionId, status]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-900">
          <p>{error}</p>
          <Link href="/explore" className="mt-4 inline-block text-primary">
            Back to explore
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <div className="border border-green-200 bg-green-50 p-6 text-sm text-green-950">
          <p className="font-medium">{message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={() => router.push("/tenant/unlocks")}>
              View my unlocks
            </Button>
            <Link
              href="/explore"
              className="inline-flex items-center text-primary hover:underline"
            >
              Back to explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-12">
      <LoadingState label={message} />
    </div>
  );
}
