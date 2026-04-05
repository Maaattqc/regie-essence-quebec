import type { Metadata } from "next";
import ConditionsContent from "./ConditionsContent";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Essence Québec",
  description:
    "Conditions générales d'utilisation du site Essence Québec — carte interactive des prix de l'essence au Québec.",
};

export default function ConditionsPage() {
  return <ConditionsContent />;
}
