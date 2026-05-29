import {
  formatPhoneDisplay,
  isEmailContact,
  isPhoneContact,
  supportsWhatsApp,
  telHref,
  whatsAppHref,
} from "@plotpin/shared-types";

export function ContactActions({
  contact,
  secondaryContact,
  whatsAppMessage,
  compact = false,
}: {
  contact: string;
  secondaryContact?: string | null;
  whatsAppMessage?: string;
  compact?: boolean;
}) {
  if (isEmailContact(contact)) {
    return (
      <div className="space-y-1.5">
        <a
          href={`mailto:${contact}`}
          className="font-medium text-primary hover:underline"
        >
          {contact}
        </a>
        <p className="text-xs text-muted">
          Email only — the landlord has not added a phone number to their
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
}: {
  phone: string;
  label: string;
  whatsAppMessage?: string;
  compact?: boolean;
}) {
  const display = formatPhoneDisplay(phone);
  const wa = supportsWhatsApp(phone) ? whatsAppHref(phone, whatsAppMessage) : null;

  if (compact) {
    return (
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="font-medium">{display}</p>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={telHref(phone)}
            className="bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
          >
            Call
          </a>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="border border-[#25D366] bg-[#25D366]/10 px-3 py-2 text-center text-sm font-medium text-[#128C7E]"
            >
              WhatsApp
            </a>
          ) : (
            <span className="border border-border px-3 py-2 text-center text-xs text-muted">
              WhatsApp N/A
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="font-medium">{display}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={telHref(phone)}
          className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Call
        </a>
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="border border-[#25D366] bg-[#25D366]/10 px-4 py-2 text-sm font-medium text-[#128C7E]"
          >
            WhatsApp
          </a>
        ) : (
          <span className="px-4 py-2 text-sm text-muted">
            WhatsApp not available for this country code
          </span>
        )}
      </div>
    </div>
  );
}
