"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold text-muted-foreground">Erreur</h1>
      <p className="text-muted-foreground max-w-md">
        Une erreur inattendue s&apos;est produite. Veuillez réessayer.
      </p>
      <Button onClick={reset} variant="outline" className="mt-2 gap-2">
        <RotateCcw className="size-4" />
        Réessayer
      </Button>
    </main>
  );
}
