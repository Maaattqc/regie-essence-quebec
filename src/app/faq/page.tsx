import type { Metadata } from "next";
import FaqContent from "./FaqContent";

export const metadata: Metadata = {
  title: "FAQ — Prix de l'essence au Québec",
  description:
    "Réponses aux questions fréquentes sur la carte des prix de l'essence au Québec : mises à jour, gratuité, signalement de prix, géolocalisation.",
};

export default function FaqPage() {
  return <FaqContent />;
}
