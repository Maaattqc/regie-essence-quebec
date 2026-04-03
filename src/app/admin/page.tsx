"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { createBrowserClient } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

// Tabs supprimé — non utilisé actuellement (navigation par boutons)
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Separator non utilisé actuellement
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  BarChart3,
  Clock,
  Database,
  Flag,
  Shield,
  LogOut,
  Play,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  Sun,
  Moon,
  Eye,
  TrendingUp,
  Calendar,
  Activity,
  Search,
  ExternalLink,
  Wifi,
  CircleCheck,
  CircleX,
  Loader2,
  RefreshCw,
  ScrollText,
  Download,
  AlertTriangle,
  FileBarChart,
  ShieldCheck,
  GitCommit,
  Lightbulb,
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface Report {
  id: number;
  station_name: string;
  address: string;
  first_name: string;
  last_name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

interface Suggestion {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

interface SnapshotSummary {
  date: string;
  snapshotAt: string;
  totalStations: number;
  types: Record<string, { nb: number; avg: number; min: number; max: number }>;
}

interface SnapshotRow {
  station_name: string;
  address: string;
  gas_type: string;
  price: number;
}

interface Stats {
  totalStations: number;
  totalSnapshots: number;
  lastSnapshot: string;
  totalReports: number;
  totalUsers: number;
  avgRegulier: number;
  avgSuper: number;
  avgDiesel: number;
  totalPageViews: number;
  todayPageViews: number;
  weekPageViews: number;
  monthPageViews: number;
}

function AdminUserDropdown({ email, onLogout }: { email: string; onLogout: () => void }) {
  const username = email.split("@")[0];
  const initial = username[0]?.toUpperCase() || "?";
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span className="flex items-center gap-1.5 bg-white/12 border border-white/25 rounded-full py-0.5 pr-2.5 pl-0.5 cursor-pointer text-white text-[0.8125rem] font-medium">
          <span className="size-6 rounded-full bg-white/25 flex items-center justify-center text-[0.7rem] font-bold">
            {initial}
          </span>
          {username}
          <ChevronDown className="size-3 transition-transform group-data-[popup-open]:rotate-180" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[16rem]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
          {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          {isDark ? "Mode clair" : "Mode sombre"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut className="size-3.5" /> Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggleBtn() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center size-7 rounded-lg hover:bg-white/15 transition-colors"
      style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}
      aria-label={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  );
}

const LOG_CATEGORIES: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "", label: "Tout", icon: <ScrollText className="size-3.5" /> },
  { key: "sync", label: "Sync", icon: <RefreshCw className="size-3.5" /> },
  { key: "cron", label: "Cron", icon: <Clock className="size-3.5" /> },
  { key: "auth", label: "Auth", icon: <Shield className="size-3.5" /> },
  { key: "report", label: "Signalements", icon: <Flag className="size-3.5" /> },
  { key: "admin", label: "Admin", icon: <Database className="size-3.5" /> },
  { key: "visite", label: "Visites", icon: <Eye className="size-3.5" /> },
  { key: "erreur", label: "Erreurs", icon: <AlertCircle className="size-3.5" /> },
  { key: "suggestion", label: "Suggestions", icon: <Lightbulb className="size-3.5" /> },
];

interface LogEntry {
  id: number;
  category: string;
  action: string;
  detail: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

function ActivityLogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  const loadLogs = useCallback(async (cat: string) => {
    setLoading(true);
    const params = new URLSearchParams({ type: "logs", limit: "200" });
    if (cat) params.set("category", cat);
    try {
      const res = await fetch(`/api/admin?${params}`);
      if (res.ok) setLogs(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadLogs(category); }, [category, loadLogs]);

  const catColor: Record<string, string> = {
    sync: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    cron: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    auth: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    report: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    admin: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    visite: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    erreur: "bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-300",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {LOG_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-md border transition-colors cursor-pointer"
            style={category === c.key
              ? { background: "var(--primary)", color: "var(--primary-foreground)", borderColor: "var(--primary)" }
              : { background: "transparent", borderColor: "var(--border)", color: "var(--foreground)" }
            }
          >
            {c.icon} {c.label}
          </button>
        ))}
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => loadLogs(category)} disabled={loading}>
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground text-[13px] text-center py-8">Aucune activité enregistrée.</p>
      ) : (
        <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 rounded-lg border p-2.5 text-[13px]">
              <span className={`shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${catColor[log.category] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                {log.category}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{log.action}</div>
                {log.detail && <div className="text-muted-foreground text-[11px] truncate">{log.detail}</div>}
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
                {new Date(log.created_at).toLocaleString("fr-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Alertes Panel ──
function AlertsPanel({ stats }: { stats: Stats | null }) {
  const [alerts, setAlerts] = useState<{ level: "error" | "warn" | "ok"; title: string; detail: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const results: typeof alerts = [];
      try {
        // Check dernière sync
        if (stats?.lastSnapshot) {
          const last = new Date(stats.lastSnapshot);
          const hoursAgo = (Date.now() - last.getTime()) / 3600000;
          const fmtDate = new Date(stats.lastSnapshot).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Montreal" });
          if (hoursAgo > 24) results.push({ level: "error", title: "Sync inactive depuis 24h+", detail: `Dernier snapshot : ${fmtDate}` });
          else if (hoursAgo > 6) results.push({ level: "warn", title: "Sync inactive depuis 6h+", detail: `Dernier snapshot : ${fmtDate}` });
          else results.push({ level: "ok", title: "Sync active", detail: `Dernier snapshot : ${fmtDate}` });
        }

        // Check prix anormaux via API
        const res = await fetch("/api/admin?type=alerts");
        if (res.ok) {
          const data = await res.json();
          if (data.highPrices > 0) results.push({ level: "warn", title: `${data.highPrices} prix anormalement hauts (>250¢)`, detail: "Vérifier les stations concernées" });
          if (data.lowPrices > 0) results.push({ level: "warn", title: `${data.lowPrices} prix anormalement bas (<80¢)`, detail: "Vérifier les stations concernées" });
          if (data.highPrices === 0 && data.lowPrices === 0) results.push({ level: "ok", title: "Aucun prix anormal détecté", detail: "Tous les prix sont dans la plage normale (80-250¢)" });
        }

        // Check signalements non traités
        if (stats && stats.totalReports > 0) {
          results.push({ level: "warn", title: `${stats.totalReports} signalement(s) en base`, detail: "Vérifier l'onglet Signalements" });
        } else {
          results.push({ level: "ok", title: "Aucun signalement en attente", detail: "" });
        }
      } catch {
        results.push({ level: "error", title: "Erreur lors de la vérification", detail: "Impossible de charger les alertes" });
      }
      setAlerts(results);
      setLoading(false);
    }
    check();
  }, [stats]);

  if (loading) return <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}</div>;

  const errors = alerts.filter((a) => a.level === "error").length;
  const warns = alerts.filter((a) => a.level === "warn").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {errors > 0 ? (
          <div className="flex items-center gap-2 text-red-500 font-semibold"><CircleX className="size-5" /> {errors} alerte(s) critique(s)</div>
        ) : warns > 0 ? (
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-semibold"><AlertTriangle className="size-5" /> {warns} avertissement(s)</div>
        ) : (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold"><CircleCheck className="size-5" /> Tout est normal</div>
        )}
      </div>
      <div className="space-y-2">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
            {a.level === "error" ? <CircleX className="size-4 text-red-500 shrink-0 mt-0.5" /> :
             a.level === "warn" ? <AlertTriangle className="size-4 text-yellow-500 shrink-0 mt-0.5" /> :
             <CircleCheck className="size-4 text-green-500 shrink-0 mt-0.5" />}
            <div>
              <div className="text-[13px] font-semibold">{a.title}</div>
              {a.detail && <div className="text-[11px] text-muted-foreground">{a.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Exports Panel ──
function ExportsPanel({ token }: { token: string | null }) {
  const [exporting, setExporting] = useState<string | null>(null);

  function authHeaders(): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function exportCSV(type: string, filename: string) {
    setExporting(type);
    try {
      const res = await fetch(`/api/admin?type=${type}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) { setExporting(null); return; }

      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map((row: Record<string, unknown>) =>
          headers.map((h) => {
            const v = row[h];
            const s = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
            return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
          }).join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting(null);
  }

  const exports = [
    { type: "users", label: "Utilisateurs", desc: "Liste des comptes inscrits", icon: <Users className="size-4" />, filename: "utilisateurs" },
    { type: "reports", label: "Signalements", desc: "Tous les signalements soumis", icon: <Flag className="size-4" />, filename: "signalements" },
    { type: "snapshots", label: "Snapshots (résumé)", desc: "Historique des captures de prix", icon: <Database className="size-4" />, filename: "snapshots" },
    { type: "logs", label: "Journal d'activité", desc: "Logs d'actions récentes", icon: <ScrollText className="size-4" />, filename: "journal" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-[13px]">Téléchargez les données au format CSV (compatible Excel).</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {exports.map((e) => (
          <div key={e.type} className="flex items-center gap-3 rounded-lg border p-4">
            <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0 text-blue-700 dark:text-blue-400">
              {e.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold">{e.label}</div>
              <div className="text-[11px] text-muted-foreground">{e.desc}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV(e.type, e.filename)} disabled={exporting === e.type}>
              {exporting === e.type ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              CSV
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rapports Panel ──
function RapportsPanel({ stats, token }: { stats: Stats | null; token: string | null }) {
  const [reportData, setReportData] = useState<{ regions: { region: string; count: number; avg: number; min: number; max: number }[]; topStations: { name: string; address: string; price: number; type: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/admin?type=snapshot_detail&latest=1", { headers });
        if (!res.ok) { setLoading(false); return; }
        const rows: { station_name: string; address: string; gas_type: string; price: number }[] = await res.json();

        // Par région (extraire de l'adresse)
        const regionMap: Record<string, { count: number; total: number; min: number; max: number }> = {};
        const regulierOnly = rows.filter((r) => r.gas_type === "Régulier");
        regulierOnly.forEach((r) => {
          const parts = r.address.split(",");
          const region = parts[parts.length - 1]?.trim() || "Inconnu";
          if (!regionMap[region]) regionMap[region] = { count: 0, total: 0, min: Infinity, max: -Infinity };
          regionMap[region].count++;
          regionMap[region].total += r.price;
          if (r.price < regionMap[region].min) regionMap[region].min = r.price;
          if (r.price > regionMap[region].max) regionMap[region].max = r.price;
        });
        const regions = Object.entries(regionMap)
          .map(([region, d]) => ({ region, count: d.count, avg: Math.round(d.total / d.count * 10) / 10, min: d.min, max: d.max }))
          .sort((a, b) => a.avg - b.avg);

        // Top 10 moins chers
        const topStations = [...regulierOnly].sort((a, b) => a.price - b.price).slice(0, 10)
          .map((r) => ({ name: r.station_name, address: r.address, price: r.price, type: r.gas_type }));

        setReportData({ regions, topStations });
      } catch {}
      setLoading(false);
    }
    load();
  }, [token]);

  function exportPDF() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const now = new Date().toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Rapport Essence Québec</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
      h1 { color: #003DA5; font-size: 22px; border-bottom: 3px solid #003DA5; padding-bottom: 8px; }
      h2 { color: #003DA5; font-size: 16px; margin-top: 30px; }
      .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0; }
      th { background: #003DA5; color: #fff; padding: 8px 10px; text-align: left; }
      td { padding: 6px 10px; border-bottom: 1px solid #ddd; }
      tr:nth-child(even) { background: #f9f9f9; }
      .summary { display: flex; gap: 20px; margin: 15px 0; }
      .summary-card { flex: 1; background: #f5f5f5; border-radius: 8px; padding: 15px; text-align: center; }
      .summary-card .value { font-size: 24px; font-weight: 800; color: #003DA5; }
      .summary-card .label { font-size: 11px; color: #666; margin-top: 4px; }
      .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <h1>Rapport — Essence Québec</h1>
    <div class="meta">Généré le ${now} · essence-quebec.ca</div>`);

    if (stats) {
      printWindow.document.write(`
      <div class="summary">
        <div class="summary-card"><div class="value">${stats.totalStations.toLocaleString()}</div><div class="label">Stations actives</div></div>
        <div class="summary-card"><div class="value">${stats.totalPageViews.toLocaleString()}</div><div class="label">Visites totales</div></div>
        <div class="summary-card"><div class="value">${stats.totalUsers.toLocaleString()}</div><div class="label">Utilisateurs</div></div>
        <div class="summary-card"><div class="value">${stats.totalReports.toLocaleString()}</div><div class="label">Signalements</div></div>
      </div>
      <h2>Prix moyens par carburant</h2>
      <table><tr><th>Type</th><th>Prix moyen</th></tr>
        <tr><td>Ordinaire</td><td>${stats.avgRegulier.toFixed(1)}¢/L</td></tr>
        <tr><td>Super</td><td>${stats.avgSuper.toFixed(1)}¢/L</td></tr>
        <tr><td>Diesel</td><td>${stats.avgDiesel.toFixed(1)}¢/L</td></tr>
      </table>`);
    }

    if (reportData) {
      printWindow.document.write(`<h2>Top 10 stations les moins chères (Ordinaire)</h2>
      <table><tr><th>#</th><th>Station</th><th>Adresse</th><th>Prix</th></tr>
        ${reportData.topStations.map((s, i) => `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.address}</td><td>${s.price.toFixed(1)}¢</td></tr>`).join("")}
      </table>`);

      if (reportData.regions.length > 0) {
        printWindow.document.write(`<h2>Prix par ville (Ordinaire)</h2>
        <table><tr><th>Ville</th><th>Stations</th><th>Moy.</th><th>Min</th><th>Max</th></tr>
          ${reportData.regions.slice(0, 30).map((r) => `<tr><td>${r.region}</td><td>${r.count}</td><td>${r.avg.toFixed(1)}¢</td><td>${r.min.toFixed(1)}¢</td><td>${r.max.toFixed(1)}¢</td></tr>`).join("")}
        </table>`);
      }
    }

    printWindow.document.write(`<div class="footer">Données officielles — Régie de l'énergie du Québec · Généré automatiquement par essence-quebec.ca</div></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  }

  if (loading) return <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-[13px]">Rapports détaillés basés sur le dernier snapshot de prix.</p>
        <Button variant="outline" size="sm" onClick={exportPDF}>
          <Download className="size-3.5" /> Exporter PDF
        </Button>
      </div>

      {/* Top 10 moins chers */}
      {reportData && reportData.topStations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[14px]"><TrendingUp className="size-4" /> Top 10 stations les moins chères (Ordinaire)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.topStations.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-bold">{i + 1}</TableCell>
                    <TableCell className="font-semibold">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">{s.address}</TableCell>
                    <TableCell className="text-right font-bold text-green-600 dark:text-green-400">{s.price.toFixed(1)}¢</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Prix par ville */}
      {reportData && reportData.regions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[14px]"><BarChart3 className="size-4" /> Prix moyen par ville (Ordinaire) — {reportData.regions.length} villes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ville</TableHead>
                  <TableHead className="text-right">Stations</TableHead>
                  <TableHead className="text-right">Moyenne</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead className="text-right">Écart</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.regions.map((r) => (
                  <TableRow key={r.region}>
                    <TableCell className="font-semibold">{r.region}</TableCell>
                    <TableCell className="text-right">{r.count}</TableCell>
                    <TableCell className="text-right font-bold">{r.avg.toFixed(1)}¢</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">{r.min.toFixed(1)}¢</TableCell>
                    <TableCell className="text-right text-red-500">{r.max.toFixed(1)}¢</TableCell>
                    <TableCell className="text-right text-muted-foreground">{(r.max - r.min).toFixed(1)}¢</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Résumé chiffres */}
      {stats && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[14px]"><FileBarChart className="size-4" /> Indicateurs clés</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { v: stats.totalStations.toLocaleString(), l: "Stations actives" },
                { v: stats.totalPageViews.toLocaleString(), l: "Visites totales" },
                { v: `${stats.avgRegulier.toFixed(1)}¢`, l: "Moy. Ordinaire" },
                { v: `${stats.avgDiesel.toFixed(1)}¢`, l: "Moy. Diesel" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-xl font-bold">{s.v}</div>
                  <div className="text-[11px] text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Conformité Panel (fusionné avec Moniteur) ──
function ConformitePanel({
  stats,
  checks,
  setChecks,
}: {
  stats: Stats | null;
  checks: Record<string, { status: "loading" | "ok" | "error"; ms: number; detail?: string }>;
  setChecks: React.Dispatch<React.SetStateAction<Record<string, { status: "loading" | "ok" | "error"; ms: number; detail?: string }>>>;
}) {
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    const init: Record<string, { status: "loading" | "ok" | "error"; ms: number }> = {};
    HEALTH_ENDPOINTS.forEach((ep) => { init[ep.key] = { status: "loading", ms: 0 }; });
    setChecks(init);
    await Promise.all(
      HEALTH_ENDPOINTS.map(async (ep) => {
        const start = performance.now();
        try {
          const res = await fetch(ep.url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(10000) }).catch(() =>
            fetch(ep.url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(10000) })
          );
          const ms = Math.round(performance.now() - start);
          setChecks((prev) => ({ ...prev, [ep.key]: { status: res.ok || res.status === 401 || res.status === 403 ? "ok" : "error", ms, detail: `HTTP ${res.status}` } }));
        } catch {
          const ms = Math.round(performance.now() - start);
          setChecks((prev) => ({ ...prev, [ep.key]: { status: "error", ms, detail: "Timeout ou réseau" } }));
        }
      })
    );
    setLastRun(new Date().toLocaleTimeString("fr-CA"));
  }, [setChecks]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Object.keys(checks).length === 0) runChecks();
  }, [checks, runChecks]);

  const allOk = Object.values(checks).every((c) => c.status === "ok");
  const anyLoading = Object.values(checks).some((c) => c.status === "loading");
  const servicesOk = Object.values(checks).filter((c) => c.status === "ok").length;
  const servicesTotal = Object.keys(checks).length;
  const avgMs = servicesTotal > 0 ? Math.round(Object.values(checks).reduce((s, c) => s + c.ms, 0) / servicesTotal) : 0;

  const securityItems = [
    { icon: <Clock className="size-4" />, label: "Dernier snapshot", value: stats?.lastSnapshot && stats.lastSnapshot !== "Aucun" ? new Date(stats.lastSnapshot).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Montreal" }) : (stats?.lastSnapshot ?? "...") },
    { icon: <Database className="size-4" />, label: "Snapshots en base", value: stats?.totalSnapshots?.toLocaleString() ?? "..." },
    { icon: <GitCommit className="size-4" />, label: "Version", value: "Production (Vercel)" },
    { icon: <Shield className="size-4" />, label: "Auth OTP", value: "Supabase (sans mot de passe)" },
    { icon: <ShieldCheck className="size-4" />, label: "Row Level Security", value: "Activé sur toutes les tables" },
    { icon: <Eye className="size-4" />, label: "Données personnelles", value: "Masquées pour les non-admins" },
    { icon: <RefreshCw className="size-4" />, label: "Fréquence de sync", value: "5 min (client) + 6h (cron)" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Services en temps réel ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold flex items-center gap-2">
            <Wifi className="size-4" /> État des services
          </h3>
          <div className="flex items-center gap-3">
            {lastRun && <span className="text-xs text-muted-foreground">Dernier test : {lastRun}</span>}
            <Button variant="outline" size="sm" onClick={runChecks} disabled={anyLoading}>
              {anyLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Wifi className="size-3.5" />} Tester
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-semibold mb-1">
          {anyLoading ? (
            <><Loader2 className="size-4 animate-spin text-muted-foreground" /> Test en cours...</>
          ) : allOk ? (
            <span className="text-green-600 dark:text-green-400 flex items-center gap-1.5"><CircleCheck className="size-4" /> Tous les services sont opérationnels</span>
          ) : (
            <span className="text-red-500 flex items-center gap-1.5"><CircleX className="size-4" /> Certains services sont en panne</span>
          )}
          {!anyLoading && servicesTotal > 0 && (
            <span className="text-muted-foreground font-normal ml-auto">{servicesOk}/{servicesTotal} OK · moy. {avgMs} ms</span>
          )}
        </div>
        <div className="space-y-1.5">
          {HEALTH_ENDPOINTS.map((ep) => {
            const check = checks[ep.key];
            const status = check?.status ?? "loading";
            return (
              <div key={ep.key} className="flex items-center gap-3 rounded-lg border p-2.5">
                {status === "loading" ? <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" /> :
                 status === "ok" ? <CircleCheck className="size-4 text-green-500 shrink-0" /> :
                 <CircleX className="size-4 text-red-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{ep.label}</div>
                  <div className="text-[10px] text-muted-foreground">{ep.desc}</div>
                </div>
                {check && status !== "loading" && (
                  <div className="flex items-center gap-2 shrink-0">
                    {check.detail && <span className="text-[11px] text-muted-foreground">{check.detail}</span>}
                    <span className={`text-[12px] font-mono font-semibold ${check.ms < 500 ? "text-green-600 dark:text-green-400" : check.ms < 2000 ? "text-yellow-600 dark:text-yellow-400" : "text-red-500"}`}>
                      {check.ms} ms
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sécurité & Conformité ── */}
      <div className="space-y-3">
        <h3 className="text-[14px] font-semibold flex items-center gap-2">
          <ShieldCheck className="size-4" /> Sécurité et conformité
        </h3>
        <div className="space-y-1.5">
          {securityItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-2.5">
              <div className="text-muted-foreground shrink-0">{item.icon}</div>
              <div className="flex-1 text-[13px] font-medium">{item.label}</div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold">{item.value}</span>
                <CircleCheck className="size-4 text-green-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const HEALTH_ENDPOINTS = [
  { key: "site", label: "Site web", url: "/", desc: "Page d'accueil essence-quebec.ca" },
  { key: "api-stations", label: "API Stations", url: "/api/stations", desc: "Endpoint GeoJSON des stations" },
  { key: "api-cron", label: "API Cron", url: "/api/cron", desc: "Endpoint de synchronisation" },
  { key: "api-admin", label: "API Admin", url: "/api/admin?type=stats", desc: "Endpoint statistiques" },
  { key: "supabase", label: "Supabase", url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, desc: "Base de données PostgreSQL" },
  { key: "source-req", label: "Source REQ", url: "https://regieessencequebec.ca/stations.geojson.gz", desc: "Données Régie de l'énergie" },
];

export default function AdminPage() {
  const supabase = createBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [cronResult, setCronResult] = useState<string | null>(null);
  const [cronLoading, setCronLoading] = useState(false);
  const [tab, setTab] = useState<"stats" | "logs" | "alerts" | "exports" | "rapports" | "conformite" | "cron" | "users" | "reports" | "suggestions" | "data">("stats");
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [snapshotDetail, setSnapshotDetail] = useState<SnapshotRow[]>([]);
  const [snapshotDetailLoading, setSnapshotDetailLoading] = useState(false);
  const [detailGasFilter, setDetailGasFilter] = useState<string>("Tous");
  const [detailSort, setDetailSort] = useState<"price_asc" | "price_desc" | "name">("price_asc");
  const [healthChecks, setHealthChecks] = useState<Record<string, { status: "loading" | "ok" | "error"; ms: number; detail?: string }>>({});

   
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      if (session?.user) {
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
        setIsAdmin(!!session.user.email && adminEmails.includes(session.user.email.toLowerCase()));
      }
      setLoading(false);
    }
    init();
  }, []);

  // L'effet de chargement est déclaré plus bas, après les fonctions qu'il appelle

  function authHeaders(): Record<string, string> {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  async function loadStats() {
    const res = await fetch("/api/admin?type=stats", { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    setStats({
      totalStations: 2288,
      totalSnapshots: data.totalSnapshots,
      lastSnapshot: data.lastSnapshot,
      totalReports: data.totalReports,
      totalUsers: data.totalUsers,
      avgRegulier: data.avgRegulier,
      avgSuper: data.avgSuper,
      avgDiesel: data.avgDiesel,
      totalPageViews: data.totalPageViews,
      todayPageViews: data.todayPageViews,
      weekPageViews: data.weekPageViews,
      monthPageViews: data.monthPageViews,
    });
  }

  async function loadUsers() {
    const res = await fetch("/api/admin?type=users", { headers: authHeaders() });
    if (!res.ok) return;
    setUsers(await res.json());
  }

  async function loadReports() {
    const res = await fetch("/api/admin?type=reports", { headers: authHeaders() });
    if (!res.ok) return;
    setReports(await res.json());
  }

  async function updateReportStatus(id: number, status: string) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "report_status", id, status }),
    });
    loadReports();
  }

  async function loadSuggestions() {
    const res = await fetch("/api/admin?type=suggestions", { headers: authHeaders() });
    if (!res.ok) return;
    setSuggestions(await res.json());
  }

  async function updateSuggestionStatus(id: number, status: string) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "suggestion_status", id, status }),
    });
    loadSuggestions();
  }

  async function triggerCron() {
    setCronLoading(true);
    setCronResult(null);
    const res = await fetch("/api/cron");
    const json = await res.json();
    setCronResult(JSON.stringify(json, null, 2));
    setCronLoading(false);
    loadStats();
  }

  async function loadSnapshots() {
    const res = await fetch("/api/admin?type=snapshots", { headers: authHeaders() });
    if (!res.ok) return;
    setSnapshots(await res.json());
  }

  async function loadSnapshotDetail(snapshotAt: string) {
    setSnapshotDetailLoading(true);
    setSnapshotDetail([]);
    const res = await fetch(`/api/admin?type=snapshot_detail&snapshotAt=${encodeURIComponent(snapshotAt)}`, { headers: authHeaders() });
    if (res.ok) setSnapshotDetail(await res.json());
    setSnapshotDetailLoading(false);
  }

  function handleSelectSnapshot(snapshotAt: string) {
    if (selectedSnapshot === snapshotAt) {
      setSelectedSnapshot(null);
      setSnapshotDetail([]);
    } else {
      setSelectedSnapshot(snapshotAt);
      loadSnapshotDetail(snapshotAt);
    }
  }

  async function toggleRole(profile: Profile) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_role", id: profile.id, currentRole: profile.role }),
    });
    loadUsers();
  }

  // Charger les données publiques même sans auth (déclaré après les fonctions appelées)
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadStats(); loadUsers(); loadReports(); loadSuggestions(); loadSnapshots(); }, [token]);

  if (loading) return (
    <div className="admin-page">
      {/* Navbar skeleton */}
      <div style={{ background: "#003DA5", height: "auto", padding: "0.5rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <Skeleton className="size-7 rounded-lg bg-white/20" />
        <Skeleton className="h-7 w-36 rounded-md bg-white/20" />
        <div style={{ display: "flex", gap: "0.25rem", marginLeft: "0.5rem" }}>
          {[80, 64, 100, 110, 80].map((w, i) => (
            <Skeleton key={i} className="h-7 rounded-md bg-white/20" style={{ width: w }} />
          ))}
        </div>
        <Skeleton className="h-7 w-24 rounded-full bg-white/20 ml-auto" />
      </div>
      {/* Content skeleton */}
      <div className="admin-content space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
  const readOnly = !isAdmin;

  return (
    <div className="admin-page">
      <header className="gov-bar" style={{ height: "auto", flexWrap: "wrap", padding: "0.5rem 1.25rem", gap: "0.5rem", overflow: "visible" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/" className="flex items-center justify-center size-7 rounded-lg text-white hover:bg-white/15 transition-colors">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="gov-bar-title">
            <span className="gov-bar-fleur">⚜</span>
            <div>Administration<div className="gov-bar-subtitle">Essence Qu&eacute;bec</div></div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
          {([
            { key: "stats", icon: <BarChart3 className="size-3.5" />, label: "Stats" },
            { key: "alerts", icon: <AlertTriangle className="size-3.5" />, label: "Alertes" },
            { key: "rapports", icon: <FileBarChart className="size-3.5" />, label: "Rapports" },
            { key: "exports", icon: <Download className="size-3.5" />, label: "Exports" },
            { key: "conformite", icon: <ShieldCheck className="size-3.5" />, label: "Conformité" },
            { key: "logs", icon: <ScrollText className="size-3.5" />, label: "Journal" },
            { key: "cron", icon: <Clock className="size-3.5" />, label: "Cron" },
            { key: "users", icon: <Users className="size-3.5" />, label: "Utilisateurs" },
            { key: "reports", icon: <Flag className="size-3.5" />, label: `Signalements (${reports.length})` },
            { key: "suggestions", icon: <Lightbulb className="size-3.5" />, label: `Suggestions (${suggestions.length})` },
            { key: "data", icon: <Database className="size-3.5" />, label: "Données" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                padding: "0.375rem 0.625rem", borderRadius: "0.375rem", border: "none", cursor: "pointer",
                fontSize: "0.8125rem", fontWeight: 600, transition: "background 0.15s",
                background: tab === t.key ? "rgba(255,255,255,0.25)" : "transparent",
                color: tab === t.key ? "#fff" : "rgba(255,255,255,0.7)",
              }}
              onMouseEnter={(e) => { if (tab !== t.key) e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
              onMouseLeave={(e) => { if (tab !== t.key) e.currentTarget.style.background = "transparent"; }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
          {readOnly && (
            <Badge variant="secondary" className="bg-white/15 text-white border-0 text-xs font-semibold">
              Lecture seule
            </Badge>
          )}
          {user ? (
            <AdminUserDropdown email={user.email!} onLogout={async () => { await supabase.auth.signOut(); setUser(null); setToken(null); setIsAdmin(false); }} />
          ) : (<>
            <ThemeToggleBtn />
            <a href="/login" className="flex items-center gap-1.5 text-white/80 hover:text-white text-[0.8125rem] font-medium no-underline">
              <Users className="size-3.5" /> Connexion
            </a>
          </>)}
        </div>
        <div className="gov-bar-accent" />
      </header>

        <div className="admin-content">
          {tab === "stats" && (<>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Database className="size-4" />
                    Stations actives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats ? stats.totalStations : <Skeleton className="h-9 w-20" />}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="size-4" />
                    Snapshots en DB
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats ? stats.totalSnapshots.toLocaleString() : <Skeleton className="h-9 w-20" />}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-4" />
                    Dernier snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{stats ? stats.lastSnapshot : <Skeleton className="h-7 w-36" />}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4" />
                    Utilisateurs inscrits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats ? stats.totalUsers : <Skeleton className="h-9 w-16" />}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Flag className="size-4" />
                    Signalements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats ? stats.totalReports : <Skeleton className="h-9 w-16" />}</div>
                </CardContent>
              </Card>
            </div>

            {/* Visitor Stats */}
            <h3 className="text-lg font-semibold mt-6 mb-3 flex items-center gap-2">
              <Eye className="size-5" /> Trafic du site
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="size-4" />
                    Visites totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats ? stats.totalPageViews.toLocaleString() : <Skeleton className="h-9 w-20" />}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="size-4" />
                    Aujourd{"'"}hui
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats ? stats.todayPageViews.toLocaleString() : <Skeleton className="h-9 w-16" />}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="size-4" />
                    7 derniers jours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats ? stats.weekPageViews.toLocaleString() : <Skeleton className="h-9 w-16" />}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-4" />
                    Ce mois-ci
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats ? stats.monthPageViews.toLocaleString() : <Skeleton className="h-9 w-16" />}</div>
                </CardContent>
              </Card>
            </div>

            {/* SEO Score — titre toujours visible, données après chargement */}
            <h3 className="text-lg font-semibold mt-6 mb-3 flex items-center gap-2">
              <Search className="size-5" /> Score SEO
              <a href="https://www.seobility.net/" target="_blank" rel="noopener noreferrer" className="text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
                Source : Seobility <ExternalLink className="size-3" />
              </a>
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { tag: "Site externe", label: "essence-quebec.ca", score: 92, color: "#22c55e", url: "https://www.seobility.net/en/seocheck/check/?url=https%3A%2F%2Fessence-quebec.ca%2F&mode=standard" },
                { tag: "Site gouvernemental", label: "regieessencequebec.ca", score: 42, color: "#ef4444", url: "https://www.seobility.net/en/seocheck/check/?url=https%3A%2F%2Fregieessencequebec.ca%2F&mode=standard" },
              ].map(({ tag, label, score, color, url }) => (
                <Card key={label}>
                  <CardContent className="pt-5">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{tag}</div>
                    <div className="flex items-center justify-between mb-3">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold hover:underline flex items-center gap-1">
                        {label} <ExternalLink className="size-3 opacity-50" />
                      </a>
                      {stats ? (
                        <span className="text-2xl font-black" style={{ color }}>{score}%</span>
                      ) : (
                        <Skeleton className="h-8 w-14" />
                      )}
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      {stats ? (
                        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
                      ) : (
                        <Skeleton className="h-full w-full rounded-full" />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-2">
                      {stats ? (<>{score >= 80 ? "Excellent" : score >= 60 ? "Correct" : "Faible"} — score global SEO</>) : <Skeleton className="h-3 w-32" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>)}

          {tab === "alerts" && <AlertsPanel stats={stats} />}

          {tab === "rapports" && <RapportsPanel stats={stats} token={token} />}

          {tab === "exports" && <ExportsPanel token={token} />}

          {tab === "conformite" && <ConformitePanel stats={stats} checks={healthChecks} setChecks={setHealthChecks} />}

          {tab === "logs" && <ActivityLogPanel />}

          {tab === "cron" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Le cron Vercel s{"'"}ex&eacute;cute automatiquement <strong>toutes les 6 heures</strong> (0h, 6h, 12h, 18h UTC).
                En plus, les prix sont v&eacute;rifi&eacute;s <strong>toutes les 5 minutes</strong> c&ocirc;t&eacute; client tant qu{"'"}un utilisateur est connect&eacute; au site.
                Vous pouvez aussi d&eacute;clencher manuellement un snapshot :
              </p>
              <Button onClick={triggerCron} disabled={cronLoading || readOnly}>
                <Play className="size-4" />
                {cronLoading ? "En cours..." : "Lancer le cron maintenant"}
              </Button>
              {cronResult && (
                <pre className="admin-pre">{cronResult}</pre>
              )}
            </div>
          )}

          {tab === "users" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>R&ocirc;le</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role === "admin" && <Shield className="size-3" />}
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString("fr-CA")}</TableCell>
                    <TableCell>
                      <Button
                        variant={u.role === "admin" ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleRole(u)}
                        disabled={readOnly}
                      >
                        <Shield className="size-3" />
                        {u.role === "admin" ? "Retirer admin" : "Rendre admin"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {tab === "reports" && (
            reports.length === 0 ? (
              <p className="text-muted-foreground">Aucun signalement.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Station</TableHead>
                    <TableHead>De</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.station_name}</div>
                        <div className="text-xs text-muted-foreground">{r.address}</div>
                      </TableCell>
                      <TableCell>
                        <div>{r.first_name} {r.last_name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px] whitespace-normal">{r.message}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "nouveau"
                              ? "destructive"
                              : r.status === "en traitement"
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {r.status === "nouveau" && <AlertCircle className="size-3" />}
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleDateString("fr-CA")}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {r.status === "nouveau" && (
                            <Button variant="outline" size="xs" onClick={() => updateReportStatus(r.id, "en traitement")} disabled={readOnly}>
                              En traitement
                            </Button>
                          )}
                          {r.status !== "résolu" && (
                            <Button variant="secondary" size="xs" onClick={() => updateReportStatus(r.id, "résolu")} disabled={readOnly}>
                              R&eacute;solu
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}

          {tab === "suggestions" && (
            suggestions.length === 0 ? (
              <p className="text-muted-foreground">Aucune suggestion.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>De</TableHead>
                    <TableHead>Suggestion</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div>{s.first_name} {s.last_name}</div>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                      </TableCell>
                      <TableCell className="max-w-[300px] whitespace-normal">{s.message}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "nouveau"
                              ? "destructive"
                              : s.status === "en traitement"
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {s.status === "nouveau" && <Lightbulb className="size-3" />}
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleDateString("fr-CA")}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {s.status === "nouveau" && (
                            <Button variant="outline" size="xs" onClick={() => updateSuggestionStatus(s.id, "en traitement")} disabled={readOnly}>
                              En traitement
                            </Button>
                          )}
                          {s.status !== "résolu" && (
                            <Button variant="secondary" size="xs" onClick={() => updateSuggestionStatus(s.id, "résolu")} disabled={readOnly}>
                              Résolu
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}

          {tab === "data" && !selectedSnapshot && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} en base · Cliquez une ligne pour voir le détail</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Heure (HNE)</TableHead>
                    <TableHead className="text-right">Stations</TableHead>
                    <TableHead className="text-right">Moy. Régulier</TableHead>
                    <TableHead className="text-right">Moy. Super</TableHead>
                    <TableHead className="text-right">Moy. Diesel</TableHead>
                    <TableHead className="text-right">Min / Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((s) => {
                    const allPrices = Object.values(s.types).flatMap(t => [t.min, t.max]);
                    const globalMin = Math.min(...allPrices);
                    const globalMax = Math.max(...allPrices);
                    const dt = new Date(s.snapshotAt);
                    const heure = dt.toLocaleTimeString("fr-CA", { timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    return (
                      <TableRow
                        key={s.snapshotAt}
                        className="cursor-pointer hover:bg-muted/60"
                        onClick={() => handleSelectSnapshot(s.snapshotAt)}
                      >
                        <TableCell className="font-medium">{s.date}</TableCell>
                        <TableCell className="font-mono text-sm">{heure}</TableCell>
                        <TableCell className="text-right">{s.totalStations.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-blue-600 dark:text-blue-400 font-mono">
                          {s.types["Régulier"] ? `${s.types["Régulier"].avg}¢` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-purple-600 dark:text-purple-400 font-mono">
                          {s.types["Super"] ? `${s.types["Super"].avg}¢` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-orange-600 dark:text-orange-400 font-mono">
                          {s.types["Diesel"] ? `${s.types["Diesel"].avg}¢` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {globalMin}¢ / {globalMax}¢
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {tab === "data" && selectedSnapshot && (() => {
            const s = snapshots.find(x => x.snapshotAt === selectedSnapshot);
            const dt = s ? new Date(s.snapshotAt) : null;
            const label = dt ? `${s!.date} à ${dt.toLocaleTimeString("fr-CA", { timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit" })} HNE` : selectedSnapshot;
            const rows = snapshotDetail
              .filter(r => detailGasFilter === "Tous" || r.gas_type === detailGasFilter)
              .sort((a, b) => {
                if (detailSort === "price_asc") return a.price - b.price;
                if (detailSort === "price_desc") return b.price - a.price;
                return a.station_name.localeCompare(b.station_name);
              });
            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => { setSelectedSnapshot(null); setSnapshotDetail([]); }}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="size-4" /> Retour
                  </button>
                  <div className="h-4 w-px bg-border" />
                  <span className="font-semibold text-sm">Snapshot du {label}</span>
                  <Badge variant="secondary">{snapshotDetail.length.toLocaleString()} entrées</Badge>
                </div>

                {/* Filtres + tri */}
                <div className="flex items-center gap-2 flex-wrap">
                  {["Tous", "Régulier", "Super", "Diesel"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setDetailGasFilter(g)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${detailGasFilter === g ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    >
                      {g}{g !== "Tous" && snapshotDetail.filter(r => r.gas_type === g).length > 0 ? ` (${snapshotDetail.filter(r => r.gas_type === g).length})` : ""}
                    </button>
                  ))}
                  <div className="ml-4 h-4 w-px bg-border" />
                  {([["price_asc", "Prix ↑"], ["price_desc", "Prix ↓"], ["name", "Nom A→Z"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setDetailSort(val)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${detailSort === val ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tableau pleine largeur */}
                {snapshotDetailLoading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Chargement...</p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b z-10">
                          <tr>
                            <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Station</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Adresse</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Type</th>
                            <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Prix</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {rows.map((r, i) => (
                            <tr key={i} className="hover:bg-muted/40 transition-colors">
                              <td className="px-4 py-2 font-medium">{r.station_name}</td>
                              <td className="px-4 py-2 text-muted-foreground text-xs">{r.address}</td>
                              <td className="px-4 py-2">
                                <Badge variant="outline" className="text-xs">{r.gas_type}</Badge>
                              </td>
                              <td className="px-4 py-2 text-right font-mono font-bold">{r.price}¢</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
    </div>
  );
}
