import type { Metadata } from "next";
import AProposContent from "./AProposContent";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Essence Québec est une carte interactive gratuite des prix de l'essence au Québec, basée sur les données officielles de la Régie de l'énergie du Québec.",
};

export default function AProposPage() {
  return <AProposContent />;
}
