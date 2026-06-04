import { LegalDocument } from "@/components/legal/LegalDocument";
import {
  TERMS_DRAFT_NOTICE,
  TERMS_SECTIONS,
} from "@/content/legal/terms-sections";

export const metadata = {
  title: "Terms of Service — PlotPin",
  description: "PlotPin Terms of Service (draft for review).",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      draftNotice={TERMS_DRAFT_NOTICE}
      sections={TERMS_SECTIONS}
    />
  );
}
