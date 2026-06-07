import { LegalDocument } from "@/components/legal/LegalDocument";
import {
  PRIVACY_DRAFT_NOTICE,
  PRIVACY_SECTIONS,
} from "@/content/legal/privacy-sections";

export const metadata = {
  title: "Privacy Policy — PlotPin",
  description: "PlotPin Privacy Policy (draft for review).",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      draftNotice={PRIVACY_DRAFT_NOTICE}
      sections={PRIVACY_SECTIONS}
    />
  );
}
