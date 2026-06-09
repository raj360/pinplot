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

export function FeaturedCompleteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const buildingId = searchParams.get("buildingId");
  const txRef = searchParams.get("tx_ref");
  const transactionId = searchParams.get("transaction_id");
  const status = searchParams.get("status");

  const flutterwaveOutcome = useMemo(() => {
    if (!status) return null;
    const normalized = status.toLowerCase();
    if (normalized === "successful") return null;
    if (normalized === "cancelled") {
      return "Payment was cancelled. No charge was made — you can try again when ready.";
    }
    return "Payment was not completed. Try again or choose a different payment method.";
  }, [status]);

  const configError = useMemo(() => {
    if (!paymentId || !buildingId) {
      return "Missing payment details. Return to your dashboard and try again.";
    }
    return null;
  }, [paymentId, buildingId]);

  const [message, setMessage] = useState("Confirming your payment…");
  const [flowError, setFlowError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const error = configError ?? flutterwaveOutcome ?? flowError;

  useEffect(() => {
    if (configError || flutterwaveOutcome || !paymentId || !buildingId) return;

    let cancelled = false;
    let attempts = 0;
    let interval: number | undefined;

    const poll = async (): Promise<boolean> => {
      const result = await fetchUnlockPaymentStatus(paymentId);
      return result.unlockState === "completed";
    };

    async function finalize() {
      try {
        if (txRef && transactionId && status) {
          const confirm = await confirmFlutterwaveReturn({
            txRef,
            transactionId,
            status,
          });
          if (
            confirm.settled === false &&
            status.toLowerCase() !== "successful"
          ) {
            if (!cancelled) {
              setFlowError(
                "Payment was not completed. Try again or choose a different payment method.",
              );
            }
            return;
          }
        } else {
          await confirmLemonSqueezyReturn(paymentId!);
        }

        if (await poll()) {
          if (!cancelled) {
            setDone(true);
            setMessage("Featured boost is active.");
          }
          return;
        }

        interval = window.setInterval(async () => {
          attempts += 1;
          if (cancelled || attempts > 15) {
            if (interval) window.clearInterval(interval);
            if (!cancelled && attempts > 15) {
              setFlowError(
                "Payment is taking longer than expected. Check your building in a minute.",
              );
            }
            return;
          }
          if (await poll()) {
            if (interval) window.clearInterval(interval);
            if (!cancelled) {
              setDone(true);
              setMessage("Featured boost is active.");
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
  }, [
    configError,
    flutterwaveOutcome,
    paymentId,
    buildingId,
    txRef,
    transactionId,
    status,
  ]);

  const backHref = buildingId
    ? `/landlord/buildings/${buildingId}`
    : "/landlord/dashboard";

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-900">
          <p>{error}</p>
          <Link href={backHref} className="mt-4 inline-block text-primary">
            Back to your building
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
          <p className="mt-1 text-green-900/90">
            Your listing now appears in featured placements on the homepage and
            ranks first on the map.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={() => router.push(backHref)}>
              Back to building
            </Button>
            <Link
              href="/"
              className="inline-flex items-center text-primary hover:underline"
            >
              View homepage
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
