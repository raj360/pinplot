"use client";

import { useState } from "react";
import {
  formatPhoneDisplay,
  isEmailContact,
  isPhoneContact,
  supportsWhatsApp,
  telHref,
  whatsAppHref,
} from "@plotpin/shared-types";
import { CopyTextButton } from "@/components/ui/copy-text-button";

export type ContactEngagementAction = "call" | "whatsapp" | "copy";

export function ContactActions({
  contact,
  secondaryContact,
  whatsAppMessage,
  compact = false,
  revealOnClick = true,
  onEngagement,
}: {
  contact: string;
  secondaryContact?: string | null;
  whatsAppMessage?: string;
  compact?: boolean;
  /** Hide phone numbers until the user taps Show contact (pre-purchase only). */
  revealOnClick?: boolean;
  onEngagement?: (action: ContactEngagementAction) => void;
}) {
  if (isEmailContact(contact)) {
    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`mailto:${contact}`}
            className="font-medium text-primary hover:underline"
          >
            {contact}
          </a>
          <CopyTextButton
            text={contact}
            onCopy={() => onEngagement?.("copy")}
          />
        </div>
        <p className="text-xs text-muted">
          Email only. The landlord has not added a phone number to their
          profile yet. Phone verification is not required for contact to appear.
        </p>
      </div>
    );
  }

  if (!isPhoneContact(contact)) return null;

  const phones = [contact, secondaryContact].filter(
    (value): value is string =>
      typeof value === "string" &&
      Boolean(value.trim()) &&
      isPhoneContact(value),
  );

  return (
    <div className="space-y-3">
      {phones.map((phone, index) => (
        <PhoneContactRow
          key={`${phone}-${index}`}
          phone={phone}
          label={index === 0 ? "Primary" : "Secondary"}
          whatsAppMessage={whatsAppMessage}
          compact={compact}
          revealOnClick={revealOnClick}
          onEngagement={onEngagement}
        />
      ))}
    </div>
  );
}

function PhoneContactRow({
  phone,
  label,
  whatsAppMessage,
  compact,
  revealOnClick,
  onEngagement,
}: {
  phone: string;
  label: string;
  whatsAppMessage?: string;
  compact?: boolean;
  revealOnClick: boolean;
  onEngagement?: (action: ContactEngagementAction) => void;
}) {
  const [revealed, setRevealed] = useState(!revealOnClick);
  const display = formatPhoneDisplay(phone);
  const wa = supportsWhatsApp(phone) ? whatsAppHref(phone, whatsAppMessage) : null;
  const actionClass = compact
    ? "min-h-11 px-3 py-2.5 text-center text-sm font-medium"
    : "min-h-11 px-4 py-2.5 text-sm font-medium";

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className={`w-full bg-[#25D366] text-center text-sm font-semibold text-white ${actionClass}`}
      >
        Show contact
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 text-base font-medium">{display}</p>
        <CopyTextButton
          text={phone}
          onCopy={() => onEngagement?.("copy")}
        />
      </div>
      <div className={compact ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"}>
        <a
          href={telHref(phone)}
          onClick={() => onEngagement?.("call")}
          className={`bg-primary text-primary-foreground ${actionClass} ${compact ? "text-center" : "inline-flex items-center justify-center"}`}
        >
          Call
        </a>
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            onClick={() => onEngagement?.("whatsapp")}
            className={`border border-[#25D366] bg-[#25D366]/10 text-[#128C7E] ${actionClass} ${compact ? "text-center" : "inline-flex items-center justify-center"}`}
          >
            WhatsApp
          </a>
        ) : (
          <span
            className={`border border-border text-muted ${actionClass} ${compact ? "text-center text-xs" : "inline-flex items-center px-4 text-sm"}`}
          >
            WhatsApp N/A
          </span>
        )}
      </div>
    </div>
  );
}
