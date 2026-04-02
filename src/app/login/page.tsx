"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#003DA5] via-[#0060C0] to-[#003DA5] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Essence Québec
          </CardTitle>
          <CardDescription>
            Connectez-vous avec votre adresse courriel
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle className="size-10 text-green-500" />
              <p>
                Un lien de connexion a été envoyé à{" "}
                <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Vérifiez votre boîte de réception et vos courriels indésirables.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="votre@courriel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full">
                <Mail className="size-4" />
                Envoyer le lien de connexion
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-4" />
              Retour à la carte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
