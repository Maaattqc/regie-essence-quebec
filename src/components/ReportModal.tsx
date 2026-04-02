"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Flag, Send } from "lucide-react";
import { reportSchema } from "@/lib/schemas";

export default function ReportModal({
  stationName,
  address,
  onClose,
}: {
  stationName: string;
  address: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const payload = { station_name: stationName, address, ...form };
    const validation = reportSchema.safeParse(payload);
    if (!validation.success) {
      const errs: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    setSending(true);
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json();
      setError(data.error || "Erreur");
    }
    setSending(false);
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-4 text-destructive" />
            Signaler une inexactitude
          </DialogTitle>
          <DialogDescription>
            <strong>{stationName}</strong> — {address}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <motion.div
            className="text-center py-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-[15px] font-semibold">Merci pour votre signalement !</p>
            <p className="text-[13px] text-muted-foreground">Nous allons examiner votre demande.</p>
            <Button onClick={onClose} className="mt-3">Fermer</Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Prénom"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  aria-invalid={!!fieldErrors.first_name}
                />
                {fieldErrors.first_name && <p className="text-xs text-destructive mt-0.5">{fieldErrors.first_name}</p>}
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Nom"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  aria-invalid={!!fieldErrors.last_name}
                />
                {fieldErrors.last_name && <p className="text-xs text-destructive mt-0.5">{fieldErrors.last_name}</p>}
              </div>
            </div>
            <div>
              <Input
                type="email"
                placeholder="Courriel"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <p className="text-xs text-destructive mt-0.5">{fieldErrors.email}</p>}
            </div>
            <div>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-y"
                placeholder="Décrivez l'inexactitude..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                aria-invalid={!!fieldErrors.message}
                rows={4}
              />
              {fieldErrors.message && <p className="text-xs text-destructive mt-0.5">{fieldErrors.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={sending} variant="destructive">
              <Send className="size-3.5" />
              {sending ? "Envoi..." : "Envoyer le signalement"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
