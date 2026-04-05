"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-CA", { year: "numeric", month: "short", day: "numeric", timeZone: "America/Montreal" })
      + " à " + d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit", timeZone: "America/Montreal" });
  } catch { return iso; }
}

function TruncatedText({ text, limit = 80 }: { text: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const { locale } = useLanguage();
  const a = adminUi[locale];
  if (text.length <= limit) return <span className="whitespace-normal">{text}</span>;
  return (
    <div className="whitespace-normal">
      {expanded ? text : `${text.slice(0, limit)}...`}
      <button
        className="ml-1 text-xs text-primary font-semibold hover:underline"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? a.collapse : a.readMore}
      </button>
    </div>
  );
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

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
  MessageSquare,
  Check,
  X as XIcon,
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
  admin_comment: string | null;
  created_at: string;
}

interface Suggestion {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  message: string;
  status: string;
  admin_comment: string | null;
  created_at: string;
}

interface TrafficPoint {
  label: string;
  count: number;
}

interface PageTraffic {
  page: string;
  count: number;
}

interface AuthLog {
  id: number;
  action: string;
  detail: string;
  metadata: Record<string, unknown>;
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

function formatSnapshot(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Montreal" });
    const time = d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit", timeZone: "America/Montreal" });
    return `${date} à ${time}`;
  } catch { return iso; }
}

function AdminUserDropdown({ email, onLogout }: { email: string; onLogout: () => void }) {
  const username = email.split("@")[0];
  const initial = username[0]?.toUpperCase() || "?";
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { locale } = useLanguage();
  const a = adminUi[locale];
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
          {isDark ? a.lightMode : a.darkMode}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut className="size-3.5" /> {a.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggleBtn() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { locale } = useLanguage();
  const a = adminUi[locale];
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center size-7 rounded-lg hover:bg-white/15 transition-colors"
      style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}
      aria-label={isDark ? a.lightMode : a.darkMode}
    >
      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  );
}

const LOG_CATEGORY_STATIC: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "cron", label: "Cron", icon: <Clock className="size-3.5" /> },
  { key: "auth", label: "Auth", icon: <Shield className="size-3.5" /> },
  { key: "admin", label: "Admin", icon: <Database className="size-3.5" /> },
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
  const { locale } = useLanguage();
  const a = adminUi[locale];

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
    erreur: "bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-300",
  };

  const logCategories = [
    { key: "", label: a.logAll, icon: <ScrollText className="size-3.5" /> },
    ...LOG_CATEGORY_STATIC,
    { key: "report", label: a.logReports, icon: <Flag className="size-3.5" /> },
    { key: "erreur", label: a.logErrors, icon: <AlertCircle className="size-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {logCategories.map((c) => (
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
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> {a.refresh}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground text-[13px] text-center py-8">{a.noActivity}</p>
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
  const { locale } = useLanguage();
  const a = adminUi[locale];

  useEffect(() => {
    async function check() {
      const results: { level: "error" | "warn" | "ok"; title: string; detail: string }[] = [];
      try {
        // Check dernière sync
        if (stats?.lastSnapshot) {
          const last = new Date(stats.lastSnapshot);
          const hoursAgo = (Date.now() - last.getTime()) / 3600000;
          const fmtDate = formatSnapshot(stats.lastSnapshot);
          if (hoursAgo > 24) results.push({ level: "error", title: a.syncInactive24h, detail: `${a.lastSnapshotDetail} ${fmtDate}` });
          else if (hoursAgo > 6) results.push({ level: "warn", title: a.syncInactive6h, detail: `${a.lastSnapshotDetail} ${fmtDate}` });
          else results.push({ level: "ok", title: a.syncActive, detail: `${a.lastSnapshotDetail} ${fmtDate}` });
        }

        // Check prix anormaux via API
        const res = await fetch("/api/admin?type=alerts");
        if (res.ok) {
          const data = await res.json();
          if (data.highPrices > 0) results.push({ level: "warn", title: `${data.highPrices} ${a.highPrices}`, detail: a.checkStations });
          if (data.lowPrices > 0) results.push({ level: "warn", title: `${data.lowPrices} ${a.lowPrices}`, detail: a.checkStations });
          if (data.highPrices === 0 && data.lowPrices === 0) results.push({ level: "ok", title: a.noPriceAnomaly, detail: a.normalPriceRange });
        }

        // Check signalements non traités
        if (stats && stats.totalReports > 0) {
          results.push({ level: "warn", title: `${stats.totalReports} ${a.reportsInDb}`, detail: a.checkReportsTab });
        } else {
          results.push({ level: "ok", title: a.noReportsPending, detail: "" });
        }
      } catch {
        results.push({ level: "error", title: a.alertsCheckError, detail: a.alertsLoadError });
      }
      setAlerts(results);
      setLoading(false);
    }
    check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, locale]);

  if (loading) return <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}</div>;

  const errors = alerts.filter((al) => al.level === "error").length;
  const warns = alerts.filter((al) => al.level === "warn").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {errors > 0 ? (
          <div className="flex items-center gap-2 text-red-500 font-semibold"><CircleX className="size-5" /> {errors} {a.alertsCritical}</div>
        ) : warns > 0 ? (
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-semibold"><AlertTriangle className="size-5" /> {warns} {a.alertsWarnings}</div>
        ) : (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold"><CircleCheck className="size-5" /> {a.alertsAllOk}</div>
        )}
      </div>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
            {alert.level === "error" ? <CircleX className="size-4 text-red-500 shrink-0 mt-0.5" /> :
             alert.level === "warn" ? <AlertTriangle className="size-4 text-yellow-500 shrink-0 mt-0.5" /> :
             <CircleCheck className="size-4 text-green-500 shrink-0 mt-0.5" />}
            <div>
              <div className="text-[13px] font-semibold">{alert.title}</div>
              {alert.detail && <div className="text-[11px] text-muted-foreground">{alert.detail}</div>}
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
  const { locale } = useLanguage();
  const a = adminUi[locale];

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
    { type: "users", label: a.exportUsers, desc: a.exportUsersDesc, icon: <Users className="size-4" />, filename: "utilisateurs" },
    { type: "reports", label: a.exportReports, desc: a.exportReportsDesc, icon: <Flag className="size-4" />, filename: "signalements" },
    { type: "snapshots", label: a.exportSnapshots, desc: a.exportSnapshotsDesc, icon: <Database className="size-4" />, filename: "snapshots" },
    { type: "logs", label: a.exportLogs, desc: a.exportLogsDesc, icon: <ScrollText className="size-4" />, filename: "journal" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-[13px]">{a.exportDesc}</p>
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
  const { locale } = useLanguage();
  const a = adminUi[locale];

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
          const region = parts[parts.length - 1]?.trim() || a.unknown;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, locale]);

  function exportPDF() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const pdfLocale = locale === "fr" ? "fr-CA" : "en-CA";
    const now = new Date().toLocaleDateString(pdfLocale, { year: "numeric", month: "long", day: "numeric" });
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${a.pdfTitle}</title>
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
    <h1>${a.pdfH1}</h1>
    <div class="meta">${a.pdfGeneratedOn} ${now} · essence-quebec.ca</div>`);

    if (stats) {
      printWindow.document.write(`
      <div class="summary">
        <div class="summary-card"><div class="value">${stats.totalStations.toLocaleString()}</div><div class="label">${a.pdfActiveStations}</div></div>
        <div class="summary-card"><div class="value">${stats.totalPageViews.toLocaleString()}</div><div class="label">${a.pdfTotalVisits}</div></div>
        <div class="summary-card"><div class="value">${stats.totalUsers.toLocaleString()}</div><div class="label">${a.pdfUsers}</div></div>
        <div class="summary-card"><div class="value">${stats.totalReports.toLocaleString()}</div><div class="label">${a.pdfReports}</div></div>
      </div>
      <h2>${a.pdfAvgFuelPrices}</h2>
      <table><tr><th>${a.pdfType}</th><th>${a.pdfAvgPrice}</th></tr>
        <tr><td>${a.pdfRegular}</td><td>${stats.avgRegulier.toFixed(1)}¢/L</td></tr>
        <tr><td>Super</td><td>${stats.avgSuper.toFixed(1)}¢/L</td></tr>
        <tr><td>Diesel</td><td>${stats.avgDiesel.toFixed(1)}¢/L</td></tr>
      </table>`);
    }

    if (reportData) {
      printWindow.document.write(`<h2>${a.pdfTop10}</h2>
      <table><tr><th>#</th><th>${a.station}</th><th>${a.pdfAddress}</th><th>${a.price}</th></tr>
        ${reportData.topStations.map((s, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.address)}</td><td>${s.price.toFixed(1)}¢</td></tr>`).join("")}
      </table>`);

      if (reportData.regions.length > 0) {
        printWindow.document.write(`<h2>${a.pdfPriceByCity}</h2>
        <table><tr><th>${a.city}</th><th>${a.stations}</th><th>${a.pdfAvg}</th><th>${a.min}</th><th>${a.max}</th></tr>
          ${reportData.regions.slice(0, 30).map((r) => `<tr><td>${escapeHtml(r.region)}</td><td>${r.count}</td><td>${r.avg.toFixed(1)}¢</td><td>${r.min.toFixed(1)}¢</td><td>${r.max.toFixed(1)}¢</td></tr>`).join("")}
        </table>`);
      }
    }

    printWindow.document.write(`<div class="footer">${a.pdfFooter}</div></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  }

  if (loading) return <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-[13px]">{a.rapportDesc}</p>
        <Button variant="outline" size="sm" onClick={exportPDF}>
          <Download className="size-3.5" /> {a.exportPdf}
        </Button>
      </div>

      {/* Top 10 moins chers */}
      {reportData && reportData.topStations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[14px]"><TrendingUp className="size-4" /> {a.top10Cheapest}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>{a.station}</TableHead>
                  <TableHead>{a.address}</TableHead>
                  <TableHead className="text-right">{a.price}</TableHead>
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
          <CardHeader><CardTitle className="flex items-center gap-2 text-[14px]"><BarChart3 className="size-4" /> {a.avgPriceByCity} — {reportData.regions.length} {a.citiesLabel}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{a.city}</TableHead>
                  <TableHead className="text-right">{a.stations}</TableHead>
                  <TableHead className="text-right">{a.average}</TableHead>
                  <TableHead className="text-right">{a.min}</TableHead>
                  <TableHead className="text-right">{a.max}</TableHead>
                  <TableHead className="text-right">{a.range}</TableHead>
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
          <CardHeader><CardTitle className="flex items-center gap-2 text-[14px]"><FileBarChart className="size-4" /> {a.keyMetrics}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { v: stats.totalStations.toLocaleString(), l: a.activeStations },
                { v: stats.totalPageViews.toLocaleString(), l: a.totalVisits },
                { v: `${stats.avgRegulier.toFixed(1)}¢`, l: a.avgRegular },
                { v: `${stats.avgDiesel.toFixed(1)}¢`, l: a.avgDiesel },
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
  const { locale } = useLanguage();
  const a = adminUi[locale];
  const timeLocale = locale === "fr" ? "fr-CA" : "en-CA";

  const healthEndpoints = [
    { key: "site", label: a.epSiteLabel, url: "/", desc: a.epSiteDesc },
    { key: "api-stations", label: "API Stations", url: "/api/stations", desc: a.epStationsDesc },
    { key: "api-health", label: "API Health", url: "/api/health", desc: a.epHealthDesc },
    { key: "api-admin", label: "API Admin", url: "/api/admin?type=stats", desc: a.epAdminDesc },
    { key: "supabase", label: "Supabase", url: HEALTH_ENDPOINT_URLS.find(e => e.key === "supabase")!.url, desc: a.epSupabaseDesc },
    { key: "source-req", label: "Source REQ", url: "https://regieessencequebec.ca/stations.geojson.gz", desc: a.epReqDesc },
  ];

  const runChecks = useCallback(async () => {
    const init: Record<string, { status: "loading" | "ok" | "error"; ms: number }> = {};
    HEALTH_ENDPOINT_URLS.forEach((ep) => { init[ep.key] = { status: "loading", ms: 0 }; });
    setChecks(init);
    await Promise.all(
      HEALTH_ENDPOINT_URLS.map(async (ep) => {
        const start = performance.now();
        try {
          const res = await fetch(ep.url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(10000) }).catch(() =>
            fetch(ep.url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(10000) })
          );
          const ms = Math.round(performance.now() - start);
          setChecks((prev) => ({ ...prev, [ep.key]: { status: res.ok || res.status === 401 || res.status === 403 ? "ok" : "error", ms, detail: `HTTP ${res.status}` } }));
        } catch {
          const ms = Math.round(performance.now() - start);
          setChecks((prev) => ({ ...prev, [ep.key]: { status: "error", ms, detail: a.timeoutError } }));
        }
      })
    );
    setLastRun(new Date().toLocaleTimeString(timeLocale));
  }, [setChecks, a, timeLocale]);

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
    { icon: <Clock className="size-4" />, label: a.lastSnapshotLabel, value: stats?.lastSnapshot && stats.lastSnapshot !== "Aucun" ? formatSnapshot(stats.lastSnapshot) : (stats?.lastSnapshot ?? "...") },
    { icon: <Database className="size-4" />, label: a.snapshotsInDb, value: stats?.totalSnapshots?.toLocaleString() ?? "..." },
    { icon: <GitCommit className="size-4" />, label: a.versionLabel, value: a.versionValue },
    { icon: <Shield className="size-4" />, label: a.authOtpLabel, value: a.authOtpValue },
    { icon: <ShieldCheck className="size-4" />, label: a.rlsLabel, value: a.rlsValue },
    { icon: <Eye className="size-4" />, label: a.personalDataLabel, value: a.personalDataValue },
    { icon: <RefreshCw className="size-4" />, label: a.syncFreqLabel, value: a.syncFreqValue },
  ];

  return (
    <div className="space-y-6">
      {/* ── Services en temps réel ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold flex items-center gap-2">
            <Wifi className="size-4" /> {a.servicesStatus}
          </h3>
          <div className="flex items-center gap-3">
            {lastRun && <span className="text-xs text-muted-foreground">{a.lastTest} {lastRun}</span>}
            <Button variant="outline" size="sm" onClick={runChecks} disabled={anyLoading}>
              {anyLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Wifi className="size-3.5" />} {a.test}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-semibold mb-1">
          {anyLoading ? (
            <><Loader2 className="size-4 animate-spin text-muted-foreground" /> {a.testing}</>
          ) : allOk ? (
            <span className="text-green-600 dark:text-green-400 flex items-center gap-1.5"><CircleCheck className="size-4" /> {a.allServicesOk}</span>
          ) : (
            <span className="text-red-500 flex items-center gap-1.5"><CircleX className="size-4" /> {a.someServicesDown}</span>
          )}
          {!anyLoading && servicesTotal > 0 && (
            <span className="text-muted-foreground font-normal ml-auto">{servicesOk}/{servicesTotal} OK · {a.avgLabel} {avgMs} ms</span>
          )}
        </div>
        <div className="space-y-1.5">
          {healthEndpoints.map((ep) => {
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
          <ShieldCheck className="size-4" /> {a.securityAndCompliance}
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

const adminUi = {
  fr: {
    // Tabs
    tabStats: "Stats",
    tabAlerts: "Alertes",
    tabRapports: "Rapports",
    tabExports: "Exports",
    tabConformite: "Conformité",
    tabLogs: "Journal",
    tabCron: "Cron",
    tabUsers: "Utilisateurs",
    tabData: "Données",
    // Card headers
    activeStations: "Stations actives",
    dbSnapshots: "Snapshots en DB",
    lastSnapshot: "Dernier snapshot",
    registeredUsers: "Utilisateurs inscrits",
    reports: "Signalements",
    suggestions: "Suggestions",
    siteTraffic: "Trafic du site",
    trafficByPage: "Trafic par page",
    seoScore: "Score SEO",
    // Time filters
    day: "Jour",
    week: "Semaine",
    month: "Mois",
    // Stats labels
    total: "Total",
    today: "Aujourd'hui",
    sevenDays: "7 jours",
    thisMonth: "Ce mois",
    totalVisits: "Visites totales",
    avgRegular: "Moy. Ordinaire",
    avgDiesel: "Moy. Diesel",
    // Table headers
    station: "Station",
    address: "Adresse",
    price: "Prix",
    city: "Ville",
    stations: "Stations",
    average: "Moyenne",
    min: "Min",
    max: "Max",
    range: "Écart",
    // Rapport
    exportPdf: "Exporter PDF",
    rapportDesc: "Rapports détaillés basés sur le dernier snapshot de prix.",
    top10Cheapest: "Top 10 stations les moins chères (Ordinaire)",
    avgPriceByCity: "Prix moyen par ville (Ordinaire)",
    keyMetrics: "Indicateurs clés",
    noData: "Aucune donnée",
    // Buttons / actions
    collapse: "Réduire",
    readMore: "Lire plus",
    running: "En cours...",
    runCron: "Lancer le cron maintenant",
    signIn: "Connexion",
    lightMode: "Mode clair",
    darkMode: "Mode sombre",
    none: "Aucun",
    unknown: "Inconnu",
    commentPlaceholder: "Commentaire...",
    reasonPlaceholder: "Raison (optionnel)...",
    // Station filters
    all: "Tous",
    sortPriceAsc: "Prix ↑",
    sortPriceDesc: "Prix ↓",
    sortNameAZ: "Nom A→Z",
    // Exports panel
    exportDesc: "Téléchargez les données au format CSV (compatible Excel).",
    // Misc
    refresh: "Rafraîchir",
    noActivity: "Aucune activité enregistrée.",
    // Navbar
    logout: "Déconnexion",
    readOnly: "Lecture seule",
    // Log categories
    logAll: "Tout",
    logReports: "Signalements",
    logErrors: "Erreurs",
    // Conformite panel
    servicesStatus: "État des services",
    lastTest: "Dernier test :",
    test: "Tester",
    testing: "Test en cours...",
    allServicesOk: "Tous les services sont opérationnels",
    someServicesDown: "Certains services sont en panne",
    securityAndCompliance: "Sécurité et conformité",
    lastSnapshotLabel: "Dernier snapshot",
    snapshotsInDb: "Snapshots en base",
    versionLabel: "Version",
    authOtpLabel: "Auth OTP",
    rlsLabel: "Row Level Security",
    personalDataLabel: "Données personnelles",
    syncFreqLabel: "Fréquence de sync",
    versionValue: "Production (Vercel)",
    authOtpValue: "Supabase (sans mot de passe)",
    rlsValue: "Activé sur toutes les tables",
    personalDataValue: "Masquées pour les non-admins",
    syncFreqValue: "5 min (client) + 6h (cron)",
    // Exports panel
    exportUsers: "Utilisateurs",
    exportUsersDesc: "Liste des comptes inscrits",
    exportReports: "Signalements",
    exportReportsDesc: "Tous les signalements soumis",
    exportSnapshots: "Snapshots (résumé)",
    exportSnapshotsDesc: "Historique des captures de prix",
    exportLogs: "Journal d'activité",
    exportLogsDesc: "Logs d'actions récentes",
    // Users panel
    emailHeader: "Email",
    roleHeader: "Rôle",
    registeredAt: "Inscrit le",
    action: "Action",
    removeAdmin: "Retirer admin",
    makeAdmin: "Rendre admin",
    recentLogins: "Connexions récentes",
    noLogins: "Aucune connexion enregistrée.",
    methodHeader: "Méthode",
    dateHeader: "Date",
    // Reports panel
    noReports: "Aucun signalement.",
    fromHeader: "De",
    messageHeader: "Message",
    statusHeader: "Statut",
    actionsHeader: "Actions",
    inProgress: "En traitement",
    resolved: "Résolu",
    reject: "Rejeter",
    editComment: "Modifier",
    addComment: "Commenter",
    // Suggestions panel
    noSuggestions: "Aucune suggestion.",
    accept: "Accepter",
    refuse: "Refuser",
    cancel: "Annuler",
    acceptOrRefuse: "Accepter / Refuser",
    // Data panel
    loadingSnapshots: "Chargement des snapshots...",
    snapshotsInBase: "snapshot(s) en base",
    clickRowDetail: "Cliquez une ligne pour voir le détail",
    timeHNE: "Heure (HNE)",
    avgRegulierHeader: "Moy. Régulier",
    avgSuperHeader: "Moy. Super",
    avgDieselHeader: "Moy. Diesel",
    minMax: "Min / Max",
    back: "Retour",
    snapshotOf: "Snapshot du",
    loading: "Chargement...",
    typeHeader: "Type",
    entriesCount: "entrées",
    // SEO panel
    seoExcellent: "Excellent",
    seoCorrect: "Correct",
    seoWeak: "Faible",
    seoGlobalScore: "score global SEO",
    seoSource: "Source :",
    // Cron panel
    cronDesc1: "Le cron Vercel s'exécute automatiquement",
    cronDesc2: "toutes les 6 heures",
    cronDesc3: "(0h, 6h, 12h, 18h UTC).",
    cronDesc4: "Les prix sont aussi vérifiés",
    cronDesc5: "toutes les 5 minutes",
    cronDesc6: "automatiquement. Vous pouvez aussi déclencher manuellement un snapshot :",
    timeoutError: "Timeout ou réseau",
    // Health endpoints
    epSiteLabel: "Site web",
    epSiteDesc: "Page d'accueil essence-quebec.ca",
    epStationsDesc: "Endpoint GeoJSON des stations",
    epHealthDesc: "Liveness probe (Supabase + Upstash)",
    epAdminDesc: "Endpoint statistiques",
    epSupabaseDesc: "Base de données PostgreSQL",
    epReqDesc: "Données Régie de l'énergie",
    // Services summary
    avgLabel: "moy.",
    // Alerts panel
    alertsCritical: "alerte(s) critique(s)",
    alertsWarnings: "avertissement(s)",
    alertsAllOk: "Tout est normal",
    syncInactive24h: "Sync inactive depuis 24h+",
    syncInactive6h: "Sync inactive depuis 6h+",
    syncActive: "Sync active",
    lastSnapshotDetail: "Dernier snapshot :",
    highPrices: "prix anormalement hauts (>250¢)",
    lowPrices: "prix anormalement bas (<80¢)",
    checkStations: "Vérifier les stations concernées",
    noPriceAnomaly: "Aucun prix anormal détecté",
    normalPriceRange: "Tous les prix sont dans la plage normale (80-250¢)",
    reportsInDb: "signalement(s) en base",
    checkReportsTab: "Vérifier l'onglet Signalements",
    noReportsPending: "Aucun signalement en attente",
    alertsCheckError: "Erreur lors de la vérification",
    alertsLoadError: "Impossible de charger les alertes",
    citiesLabel: "villes",
    // PDF export
    pdfTitle: "Rapport Essence Québec",
    pdfH1: "Rapport — Essence Québec",
    pdfGeneratedOn: "Généré le",
    pdfActiveStations: "Stations actives",
    pdfTotalVisits: "Visites totales",
    pdfUsers: "Utilisateurs",
    pdfReports: "Signalements",
    pdfAvgFuelPrices: "Prix moyens par carburant",
    pdfType: "Type",
    pdfAvgPrice: "Prix moyen",
    pdfRegular: "Ordinaire",
    pdfTop10: "Top 10 stations les moins chères (Ordinaire)",
    pdfAddress: "Adresse",
    pdfPriceByCity: "Prix par ville (Ordinaire)",
    pdfAvg: "Moy.",
    pdfFooter: "Données officielles — Régie de l'énergie du Québec · Généré automatiquement par essence-quebec.ca",
    seoMysite: "Mon site",
    seoGovSite: "Site gouvernemental",
    visits: "visites",
  },
  en: {
    // Tabs
    tabStats: "Stats",
    tabAlerts: "Alerts",
    tabRapports: "Reports",
    tabExports: "Exports",
    tabConformite: "Compliance",
    tabLogs: "Log",
    tabCron: "Cron",
    tabUsers: "Users",
    tabData: "Data",
    // Card headers
    activeStations: "Active stations",
    dbSnapshots: "DB snapshots",
    lastSnapshot: "Last snapshot",
    registeredUsers: "Registered users",
    reports: "Reports",
    suggestions: "Suggestions",
    siteTraffic: "Site traffic",
    trafficByPage: "Traffic by page",
    seoScore: "SEO Score",
    // Time filters
    day: "Day",
    week: "Week",
    month: "Month",
    // Stats labels
    total: "Total",
    today: "Today",
    sevenDays: "7 days",
    thisMonth: "This month",
    totalVisits: "Total visits",
    avgRegular: "Avg. Regular",
    avgDiesel: "Avg. Diesel",
    // Table headers
    station: "Station",
    address: "Address",
    price: "Price",
    city: "City",
    stations: "Stations",
    average: "Average",
    min: "Min",
    max: "Max",
    range: "Range",
    // Rapport
    exportPdf: "Export PDF",
    rapportDesc: "Detailed reports based on the latest price snapshot.",
    top10Cheapest: "Top 10 cheapest stations (Regular)",
    avgPriceByCity: "Average price by city (Regular)",
    keyMetrics: "Key metrics",
    noData: "No data",
    // Buttons / actions
    collapse: "Collapse",
    readMore: "Read more",
    running: "Running...",
    runCron: "Run cron now",
    signIn: "Sign in",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    none: "None",
    unknown: "Unknown",
    commentPlaceholder: "Comment...",
    reasonPlaceholder: "Reason (optional)...",
    // Station filters
    all: "All",
    sortPriceAsc: "Price ↑",
    sortPriceDesc: "Price ↓",
    sortNameAZ: "Name A→Z",
    // Exports panel
    exportDesc: "Download data in CSV format (Excel-compatible).",
    // Misc
    refresh: "Refresh",
    noActivity: "No activity recorded.",
    // Navbar
    logout: "Sign out",
    readOnly: "Read only",
    // Log categories
    logAll: "All",
    logReports: "Reports",
    logErrors: "Errors",
    // Conformite panel
    servicesStatus: "Services status",
    lastTest: "Last test:",
    test: "Test",
    testing: "Testing...",
    allServicesOk: "All services are operational",
    someServicesDown: "Some services are down",
    securityAndCompliance: "Security and compliance",
    lastSnapshotLabel: "Last snapshot",
    snapshotsInDb: "Snapshots in DB",
    versionLabel: "Version",
    authOtpLabel: "OTP Auth",
    rlsLabel: "Row Level Security",
    personalDataLabel: "Personal data",
    syncFreqLabel: "Sync frequency",
    versionValue: "Production (Vercel)",
    authOtpValue: "Supabase (passwordless)",
    rlsValue: "Enabled on all tables",
    personalDataValue: "Hidden from non-admins",
    syncFreqValue: "5 min (client) + 6h (cron)",
    // Exports panel
    exportUsers: "Users",
    exportUsersDesc: "List of registered accounts",
    exportReports: "Reports",
    exportReportsDesc: "All submitted reports",
    exportSnapshots: "Snapshots (summary)",
    exportSnapshotsDesc: "Price capture history",
    exportLogs: "Activity log",
    exportLogsDesc: "Recent action logs",
    // Users panel
    emailHeader: "Email",
    roleHeader: "Role",
    registeredAt: "Registered on",
    action: "Action",
    removeAdmin: "Remove admin",
    makeAdmin: "Make admin",
    recentLogins: "Recent logins",
    noLogins: "No logins recorded.",
    methodHeader: "Method",
    dateHeader: "Date",
    // Reports panel
    noReports: "No reports.",
    fromHeader: "From",
    messageHeader: "Message",
    statusHeader: "Status",
    actionsHeader: "Actions",
    inProgress: "In progress",
    resolved: "Resolved",
    reject: "Reject",
    editComment: "Edit",
    addComment: "Comment",
    // Suggestions panel
    noSuggestions: "No suggestions.",
    accept: "Accept",
    refuse: "Refuse",
    cancel: "Cancel",
    acceptOrRefuse: "Accept / Refuse",
    // Data panel
    loadingSnapshots: "Loading snapshots...",
    snapshotsInBase: "snapshot(s) in database",
    clickRowDetail: "Click a row to see details",
    timeHNE: "Time (EST)",
    avgRegulierHeader: "Avg. Regular",
    avgSuperHeader: "Avg. Super",
    avgDieselHeader: "Avg. Diesel",
    minMax: "Min / Max",
    back: "Back",
    snapshotOf: "Snapshot of",
    loading: "Loading...",
    typeHeader: "Type",
    entriesCount: "entries",
    // SEO panel
    seoExcellent: "Excellent",
    seoCorrect: "Good",
    seoWeak: "Poor",
    seoGlobalScore: "overall SEO score",
    seoSource: "Source:",
    // Cron panel
    cronDesc1: "The Vercel cron runs automatically",
    cronDesc2: "every 6 hours",
    cronDesc3: "(0h, 6h, 12h, 18h UTC).",
    cronDesc4: "Prices are also checked",
    cronDesc5: "every 5 minutes",
    cronDesc6: "automatically. You can also manually trigger a snapshot:",
    timeoutError: "Timeout or network error",
    // Health endpoints
    epSiteLabel: "Website",
    epSiteDesc: "Homepage essence-quebec.ca",
    epStationsDesc: "Stations GeoJSON endpoint",
    epHealthDesc: "Liveness probe (Supabase + Upstash)",
    epAdminDesc: "Statistics endpoint",
    epSupabaseDesc: "PostgreSQL database",
    epReqDesc: "REQ energy board data",
    // Services summary
    avgLabel: "avg.",
    // Alerts panel
    alertsCritical: "critical alert(s)",
    alertsWarnings: "warning(s)",
    alertsAllOk: "Everything is normal",
    syncInactive24h: "Sync inactive for 24h+",
    syncInactive6h: "Sync inactive for 6h+",
    syncActive: "Sync active",
    lastSnapshotDetail: "Last snapshot:",
    highPrices: "abnormally high prices (>250¢)",
    lowPrices: "abnormally low prices (<80¢)",
    checkStations: "Check the affected stations",
    noPriceAnomaly: "No abnormal prices detected",
    normalPriceRange: "All prices are within normal range (80-250¢)",
    reportsInDb: "report(s) in database",
    checkReportsTab: "Check the Reports tab",
    noReportsPending: "No pending reports",
    alertsCheckError: "Error during verification",
    alertsLoadError: "Unable to load alerts",
    citiesLabel: "cities",
    // PDF export
    pdfTitle: "Essence Quebec Report",
    pdfH1: "Report — Essence Québec",
    pdfGeneratedOn: "Generated on",
    pdfActiveStations: "Active stations",
    pdfTotalVisits: "Total visits",
    pdfUsers: "Users",
    pdfReports: "Reports",
    pdfAvgFuelPrices: "Average prices by fuel type",
    pdfType: "Type",
    pdfAvgPrice: "Avg. price",
    pdfRegular: "Regular",
    pdfTop10: "Top 10 cheapest stations (Regular)",
    pdfAddress: "Address",
    pdfPriceByCity: "Price by city (Regular)",
    pdfAvg: "Avg.",
    pdfFooter: "Official data — Régie de l'énergie du Québec · Auto-generated by essence-quebec.ca",
    seoMysite: "My site",
    seoGovSite: "Government site",
    visits: "visits",
  },
} as const;

const HEALTH_ENDPOINT_URLS: { key: string; url: string }[] = [
  { key: "site", url: "/" },
  { key: "api-stations", url: "/api/stations" },
  { key: "api-health", url: "/api/health" },
  { key: "api-admin", url: "/api/admin?type=stats" },
  { key: "supabase", url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/` },
  { key: "source-req", url: "https://regieessencequebec.ca/stations.geojson.gz" },
];

export default function AdminPage() {
  const { locale } = useLanguage();
  const a = adminUi[locale];
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
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [snapshotDetail, setSnapshotDetail] = useState<SnapshotRow[]>([]);
  const [snapshotDetailLoading, setSnapshotDetailLoading] = useState(false);
  const [detailGasFilter, setDetailGasFilter] = useState<string>("Tous");
  const [detailSort, setDetailSort] = useState<"price_asc" | "price_desc" | "name">("price_asc");
  const [healthChecks, setHealthChecks] = useState<Record<string, { status: "loading" | "ok" | "error"; ms: number; detail?: string }>>({});
  const [trafficData, setTrafficData] = useState<TrafficPoint[]>([]);
  const [trafficPages, setTrafficPages] = useState<PageTraffic[]>([]);
  const [trafficRange, setTrafficRange] = useState<"day" | "week" | "month">("day");
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [editingComment, setEditingComment] = useState<{ type: "report" | "suggestion"; id: number; value: string } | null>(null);

   
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      if (session?.access_token) {
        const res = await fetch("/api/admin?type=me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const { isAdmin: adminStatus } = await res.json();
          setIsAdmin(!!adminStatus);
        }
      }
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function updateSuggestionStatus(id: number, status: string, adminComment?: string) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "suggestion_status", id, status, admin_comment: adminComment }),
    });
    loadSuggestions();
  }

  async function loadTraffic(range: "day" | "week" | "month") {
    const res = await fetch(`/api/admin?type=traffic&range=${range}`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    setTrafficData(data.chart ?? []);
    setTrafficPages(data.pages ?? []);
  }

  async function loadAuthLogs() {
    const res = await fetch("/api/admin?type=auth_logs", { headers: authHeaders() });
    if (!res.ok) return;
    setAuthLogs(await res.json());
  }

  async function saveReportComment(id: number, comment: string) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "report_comment", id, admin_comment: comment }),
    });
    setEditingComment(null);
    loadReports();
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
    setSnapshotsLoading(true);
    const res = await fetch("/api/admin?type=snapshots", { headers: authHeaders() });
    if (res.ok) setSnapshots(await res.json());
    setSnapshotsLoading(false);
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
   
  async function loadAll() {
    const res = await fetch("/api/admin?type=init", { headers: authHeaders() });
    if (!res.ok) { loadStats(); loadUsers(); loadReports(); loadSuggestions(); return; }
    const data = await res.json();
    setStats({
      totalStations: 2288,
      totalSnapshots: data.stats.totalSnapshots,
      lastSnapshot: data.stats.lastSnapshot,
      totalReports: data.stats.totalReports,
      totalUsers: data.stats.totalUsers,
      avgRegulier: data.stats.avgRegulier,
      avgSuper: data.stats.avgSuper,
      avgDiesel: data.stats.avgDiesel,
      totalPageViews: data.stats.totalPageViews,
      todayPageViews: data.stats.todayPageViews,
      weekPageViews: data.stats.weekPageViews,
      monthPageViews: data.stats.monthPageViews,
    });
    setUsers(data.users);
    setReports(data.reports);
    setSuggestions(data.suggestions);
    loadTraffic("day");
    loadAuthLogs();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); loadSnapshots(); }, [token]);

  if (loading) return (
    <div className="admin-page overflow-x-hidden">
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
    <div className="admin-page overflow-x-hidden">
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
            { key: "stats", icon: <BarChart3 className="size-3.5" />, label: a.tabStats },
            { key: "alerts", icon: <AlertTriangle className="size-3.5" />, label: a.tabAlerts },
            { key: "rapports", icon: <FileBarChart className="size-3.5" />, label: a.tabRapports },
            { key: "exports", icon: <Download className="size-3.5" />, label: a.tabExports },
            { key: "conformite", icon: <ShieldCheck className="size-3.5" />, label: a.tabConformite },
            { key: "logs", icon: <ScrollText className="size-3.5" />, label: a.tabLogs },
            { key: "cron", icon: <Clock className="size-3.5" />, label: a.tabCron },
            { key: "users", icon: <Users className="size-3.5" />, label: a.tabUsers },
            { key: "reports", icon: <Flag className="size-3.5" />, label: `${a.reports} (${reports.length})` },
            { key: "suggestions", icon: <Lightbulb className="size-3.5" />, label: `${a.suggestions} (${suggestions.length})` },
            { key: "data", icon: <Database className="size-3.5" />, label: a.tabData },
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
              {a.readOnly}
            </Badge>
          )}
          {user ? (
            <AdminUserDropdown email={user.email!} onLogout={async () => {
              if (user?.email) {
                fetch("/api/auth/log", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: user.email, event: "SIGNED_OUT", token }),
                }).catch(() => {});
              }
              await supabase.auth.signOut(); setUser(null); setToken(null); setIsAdmin(false);
            }} />
          ) : (<>
            <ThemeToggleBtn />
            <a href="/login" className="flex items-center gap-1.5 text-white/80 hover:text-white text-[0.8125rem] font-medium no-underline">
              <Users className="size-3.5" /> {a.signIn}
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
                    {a.activeStations}
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
                    {a.dbSnapshots}
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
                    {a.lastSnapshot}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{stats ? (stats.lastSnapshot !== "Aucun" ? formatSnapshot(stats.lastSnapshot) : a.none) : <Skeleton className="h-7 w-36" />}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4" />
                    {a.registeredUsers}
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
                    {a.reports}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats ? stats.totalReports : <Skeleton className="h-9 w-16" />}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Lightbulb className="size-4" />
                    {a.suggestions}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{suggestions.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Trafic — stats compactes + graphique */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><Eye className="size-4" /> {a.siteTraffic}</span>
                  <div className="flex gap-1">
                    {(["day", "week", "month"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => { setTrafficRange(r); loadTraffic(r); }}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${trafficRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                      >
                        {r === "day" ? a.day : r === "week" ? a.week : a.month}
                      </button>
                    ))}
                  </div>
                </CardTitle>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { label: a.total, value: stats?.totalPageViews },
                    { label: a.today, value: stats?.todayPageViews },
                    { label: a.sevenDays, value: stats?.weekPageViews },
                    { label: a.thisMonth, value: stats?.monthPageViews },
                  ].map((s) => (
                    <div key={s.label} className="rounded-md border border-border p-2 text-center">
                      <div className="text-lg font-bold">{s.value != null ? s.value.toLocaleString() : "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {trafficData.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-4">{a.noData}</div>
                ) : (() => {
                  const max = Math.max(...trafficData.map((d) => d.count), 1);
                  return (
                    <div className="flex items-end gap-1" style={{ height: 180 }}>
                      {trafficData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.label}: ${d.count} ${a.visits}`}>
                          <span className="text-[10px] text-muted-foreground font-semibold">{d.count}</span>
                          <div
                            className="w-full rounded-t bg-primary/80 min-h-[2px] transition-all"
                            style={{ height: `${(d.count / max) * 90}px` }}
                          />
                          <span className="text-[9px] text-muted-foreground truncate w-full text-center">{d.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Trafic par page */}
            {trafficPages.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm">
                    <BarChart3 className="size-4" /> {a.trafficByPage}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1.5">
                    {trafficPages.map((p) => {
                      const pct = trafficPages[0].count > 0 ? (p.count / trafficPages[0].count) * 100 : 0;
                      return (
                        <div key={p.page} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground w-24 truncate shrink-0" title={p.page}>{p.page}</span>
                          <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                            <div className="h-full bg-primary/70 rounded" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold w-10 text-right shrink-0">{p.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SEO Score — titre toujours visible, données après chargement */}
            <h3 className="text-lg font-semibold mt-6 mb-3 flex items-center gap-2">
              <Search className="size-5" /> {a.seoScore}
              <a href="https://www.seobility.net/" target="_blank" rel="noopener noreferrer" className="text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
                {a.seoSource} Seobility <ExternalLink className="size-3" />
              </a>
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { tag: a.seoMysite, label: "essence-quebec.ca", score: 92, color: "#22c55e", url: "https://www.seobility.net/en/seocheck/check/?url=https%3A%2F%2Fessence-quebec.ca%2F&mode=standard", source: "Seobility" },
                { tag: a.seoMysite, label: "essence-quebec.ca", score: 97, color: "#22c55e", url: "https://tools.backlinko.com/seo-checker?q=essence-quebec.ca", source: "Backlinko" },
                { tag: a.seoMysite, label: "essence-quebec.ca", score: 88, color: "#22c55e", url: "https://socialtraffic.ca/free-seo-audit?scan=7defee94-0f54-4180-ad39-4ae400032ac5", source: "SocialTraffic" },
                { tag: a.seoGovSite, label: "regieessencequebec.ca", score: 42, color: "#ef4444", url: "https://www.seobility.net/en/seocheck/check/?url=https%3A%2F%2Fregieessencequebec.ca%2F&mode=standard", source: "Seobility" },
                { tag: a.seoGovSite, label: "regieessencequebec.ca", score: 75, color: "#f59e0b", url: "https://tools.backlinko.com/seo-checker?q=https%3A%2F%2Fregieessencequebec.ca%2F", source: "Backlinko" },
                { tag: a.seoGovSite, label: "regieessencequebec.ca", score: 67, color: "#f59e0b", url: "https://socialtraffic.ca/free-seo-audit?scan=8b643fa7-8d22-4599-b832-751959a95764", source: "SocialTraffic" },
              ].map(({ tag, label, score, color, url, source }) => (
                <Card key={`${source}-${label}`}>
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tag}</div>
                      <div className="text-[10px] text-muted-foreground">{source}</div>
                    </div>
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
                      {stats ? (<>{score >= 80 ? a.seoExcellent : score >= 60 ? a.seoCorrect : a.seoWeak} — {a.seoGlobalScore}</>) : <Skeleton className="h-3 w-32" />}
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
                {a.cronDesc1} <strong>{a.cronDesc2}</strong> {a.cronDesc3}{" "}
                {a.cronDesc4} <strong>{a.cronDesc5}</strong> {a.cronDesc6}
              </p>
              <Button onClick={triggerCron} disabled={cronLoading || readOnly}>
                <Play className="size-4" />
                {cronLoading ? a.running : a.runCron}
              </Button>
              {cronResult && (
                <pre className="admin-pre">{cronResult}</pre>
              )}
            </div>
          )}

          {tab === "users" && (<>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{a.emailHeader}</TableHead>
                  <TableHead>{a.roleHeader}</TableHead>
                  <TableHead>{a.registeredAt}</TableHead>
                  <TableHead>{a.action}</TableHead>
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
                    <TableCell>{formatDate(u.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant={u.role === "admin" ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleRole(u)}
                        disabled={readOnly}
                      >
                        <Shield className="size-3" />
                        {u.role === "admin" ? a.removeAdmin : a.makeAdmin}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <h3 className="text-lg font-semibold mt-6 mb-3 flex items-center gap-2">
              <Shield className="size-5" /> {a.recentLogins}
            </h3>
            {authLogs.length === 0 ? (
              <div className="text-muted-foreground text-sm">{a.noLogins}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{a.emailHeader}</TableHead>
                    <TableHead>{a.methodHeader}</TableHead>
                    <TableHead>{a.dateHeader}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.detail}</TableCell>
                      <TableCell><Badge variant="secondary">{(log.metadata as Record<string, string>)?.method ?? "—"}</Badge></TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>)}

          {tab === "reports" && (
            reports.length === 0 ? (
              <p className="text-muted-foreground">{a.noReports}</p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{a.station}</TableHead>
                    <TableHead>{a.fromHeader}</TableHead>
                    <TableHead>{a.messageHeader}</TableHead>
                    <TableHead>{a.statusHeader}</TableHead>
                    <TableHead>{a.dateHeader}</TableHead>
                    <TableHead>{a.actionsHeader}</TableHead>
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
                      <TableCell className="max-w-[200px]">
                        <TruncatedText text={r.message} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "nouveau"
                              ? "destructive"
                              : r.status === "en traitement"
                                ? "outline"
                                : r.status === "rejeté"
                                  ? "secondary"
                                  : "default"
                          }
                        >
                          {r.status === "nouveau" && <AlertCircle className="size-3" />}
                          {r.status === "résolu" && <Check className="size-3" />}
                          {r.status === "rejeté" && <XIcon className="size-3" />}
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(r.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {r.status === "nouveau" && (
                            <Button variant="outline" size="xs" onClick={() => updateReportStatus(r.id, "en traitement")} disabled={readOnly}>
                              {a.inProgress}
                            </Button>
                          )}
                          {r.status !== "résolu" && r.status !== "rejeté" && (
                            <Button variant="secondary" size="xs" onClick={() => updateReportStatus(r.id, "résolu")} disabled={readOnly}>
                              <Check className="size-3" /> {a.resolved}
                            </Button>
                          )}
                          {r.status !== "rejeté" && r.status !== "résolu" && (
                            <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => updateReportStatus(r.id, "rejeté")} disabled={readOnly}>
                              <XIcon className="size-3" /> {a.reject}
                            </Button>
                          )}
                          {editingComment?.type === "report" && editingComment.id === r.id ? (
                            <div className="flex gap-1 mt-1">
                              <input
                                className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs"
                                value={editingComment.value}
                                onChange={(e) => setEditingComment({ ...editingComment, value: e.target.value })}
                                placeholder={a.commentPlaceholder}
                                autoFocus
                              />
                              <Button variant="outline" size="xs" onClick={() => saveReportComment(r.id, editingComment.value)}>
                                <Check className="size-3" />
                              </Button>
                              <Button variant="ghost" size="xs" onClick={() => setEditingComment(null)}>
                                <XIcon className="size-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="xs" onClick={() => setEditingComment({ type: "report", id: r.id, value: r.admin_comment ?? "" })} disabled={readOnly}>
                              <MessageSquare className="size-3" />
                              {r.admin_comment ? a.editComment : a.addComment}
                            </Button>
                          )}
                          {r.admin_comment && editingComment?.id !== r.id && (
                            <div className="text-xs text-muted-foreground mt-1 italic">{r.admin_comment}</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )
          )}

          {tab === "suggestions" && (
            suggestions.length === 0 ? (
              <p className="text-muted-foreground">{a.noSuggestions}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {suggestions.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="font-medium text-sm">{s.first_name} {s.last_name}</div>
                          <div className="text-xs text-muted-foreground">{s.email} · {formatDate(s.created_at)}</div>
                        </div>
                        <Badge
                          variant={
                            s.status === "nouveau"
                              ? "destructive"
                              : s.status === "en traitement"
                                ? "outline"
                                : s.status === "accepté"
                                  ? "default"
                                  : "secondary"
                          }
                        >
                          {s.status === "nouveau" && <Lightbulb className="size-3" />}
                          {s.status === "accepté" && <Check className="size-3" />}
                          {s.status === "refusé" && <XIcon className="size-3" />}
                          {s.status}
                        </Badge>
                      </div>
                      <div className="text-sm mb-2 whitespace-pre-wrap">{s.message}</div>
                      {s.admin_comment && (
                        <div className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 mb-2">{s.admin_comment}</div>
                      )}
                      <div className="flex gap-1.5 flex-wrap">
                        {s.status === "nouveau" && (
                          <Button variant="outline" size="xs" onClick={() => updateSuggestionStatus(s.id, "en traitement")} disabled={readOnly}>
                            {a.inProgress}
                          </Button>
                        )}
                        {s.status !== "accepté" && s.status !== "refusé" && (
                          editingComment?.type === "suggestion" && editingComment.id === s.id ? (
                            <div className="flex flex-col gap-1.5 w-full mt-1">
                              <input
                                className="rounded border border-input bg-background px-2 py-1.5 text-sm w-full"
                                value={editingComment.value}
                                onChange={(e) => setEditingComment({ ...editingComment, value: e.target.value })}
                                placeholder={a.reasonPlaceholder}
                                autoFocus
                              />
                              <div className="flex gap-1.5">
                                <Button variant="default" size="sm" className="flex-1" onClick={() => { updateSuggestionStatus(s.id, "accepté", editingComment.value); setEditingComment(null); }}>
                                  <Check className="size-3" /> {a.accept}
                                </Button>
                                <Button variant="destructive" size="sm" className="flex-1" onClick={() => { updateSuggestionStatus(s.id, "refusé", editingComment.value); setEditingComment(null); }}>
                                  <XIcon className="size-3" /> {a.refuse}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setEditingComment(null)}>{a.cancel}</Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="outline" size="xs" onClick={() => setEditingComment({ type: "suggestion", id: s.id, value: s.admin_comment ?? "" })} disabled={readOnly}>
                              {a.acceptOrRefuse}
                            </Button>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}

          {tab === "data" && !selectedSnapshot && snapshotsLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span>{a.loadingSnapshots}</span>
            </div>
          )}

          {tab === "data" && !selectedSnapshot && !snapshotsLoading && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{snapshots.length} {a.snapshotsInBase} · {a.clickRowDetail}</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{a.dateHeader}</TableHead>
                    <TableHead>{a.timeHNE}</TableHead>
                    <TableHead className="text-right">{a.stations}</TableHead>
                    <TableHead className="text-right">{a.avgRegulierHeader}</TableHead>
                    <TableHead className="text-right">{a.avgSuperHeader}</TableHead>
                    <TableHead className="text-right">{a.avgDieselHeader}</TableHead>
                    <TableHead className="text-right">{a.minMax}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((s) => {
                    const allPrices = Object.values(s.types).flatMap(t => [t.min, t.max]);
                    const globalMin = Math.min(...allPrices);
                    const globalMax = Math.max(...allPrices);
                    const dt = new Date(s.snapshotAt);
                    const heure = dt.toLocaleTimeString("fr-CA", { timeZone: "America/Montreal", hour: "2-digit", minute: "2-digit", second: "2-digit" });
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
            const label = dt ? `${s!.date} à ${dt.toLocaleTimeString("fr-CA", { timeZone: "America/Montreal", hour: "2-digit", minute: "2-digit" })} HNE` : selectedSnapshot;
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
                    <ArrowLeft className="size-4" /> {a.back}
                  </button>
                  <div className="h-4 w-px bg-border" />
                  <span className="font-semibold text-sm">{a.snapshotOf} {label}</span>
                  <Badge variant="secondary">{snapshotDetail.length.toLocaleString()} {a.entriesCount}</Badge>
                </div>

                {/* Filtres + tri */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { key: "Tous", display: a.all },
                    { key: "Régulier", display: "Régulier" },
                    { key: "Super", display: "Super" },
                    { key: "Diesel", display: "Diesel" },
                  ].map(({ key: g, display }) => (
                    <button
                      key={g}
                      onClick={() => setDetailGasFilter(g)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${detailGasFilter === g ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    >
                      {display}{g !== "Tous" && snapshotDetail.filter(r => r.gas_type === g).length > 0 ? ` (${snapshotDetail.filter(r => r.gas_type === g).length})` : ""}
                    </button>
                  ))}
                  <div className="ml-4 h-4 w-px bg-border" />
                  {([ ["price_asc", a.sortPriceAsc], ["price_desc", a.sortPriceDesc], ["name", a.sortNameAZ] ] as ["price_asc" | "price_desc" | "name", string][]).map(([val, label]) => (
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
                  <p className="text-sm text-muted-foreground py-8 text-center">{a.loading}</p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b z-10">
                          <tr>
                            <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">{a.station}</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">{a.address}</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">{a.typeHeader}</th>
                            <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">{a.price}</th>
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
