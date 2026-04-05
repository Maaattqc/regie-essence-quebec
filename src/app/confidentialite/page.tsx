import type { Metadata } from "next";
import ConfidentialiteContent from "./ConfidentialiteContent";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Essence Québec",
  description:
    "Politique de confidentialité conforme à la Loi 25 du Québec — données collectées, droits des utilisateurs, sous-traitants.",
};

export default function ConfidentialitePage() {
  return <ConfidentialiteContent />;
}
