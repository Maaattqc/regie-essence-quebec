import type { Metadata } from "next";
import AccessibiliteContent from "./AccessibiliteContent";

export const metadata: Metadata = {
  title: "Accessibilité — Essence Québec",
  description:
    "Déclaration d'accessibilité du site Essence Québec — conformité SGQRI 008, WCAG 2.1 niveau AA.",
};

export default function AccessibilitePage() {
  return <AccessibiliteContent />;
}
