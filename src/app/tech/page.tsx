import type { Metadata } from "next";
import TechContent from "./TechContent";

export const metadata: Metadata = {
  title: "Fiche technique — Essence Québec",
  description:
    "Architecture technique et fonctionnalités de la carte interactive des prix de l'essence au Québec — stack, sécurité, tests, DevOps.",
};

export default function TechPage() {
  return <TechContent />;
}
