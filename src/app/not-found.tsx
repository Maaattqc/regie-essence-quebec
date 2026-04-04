import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-lg text-muted-foreground">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Retour à la carte
      </Link>
    </main>
  );
}
