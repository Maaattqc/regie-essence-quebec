import type { Metadata } from "next";
import ChangelogContent from "./ChangelogContent";

export const metadata: Metadata = {
  title: "Changelog — Essence Québec",
  description: "Historique des modifications et mises à jour d'Essence Québec.",
};

export default function ChangelogPage() {
  return <ChangelogContent />;
}
