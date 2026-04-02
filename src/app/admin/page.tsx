"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { createBrowserClient } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

interface SnapshotSummary {
  date: string;
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

export default function AdminPage() {
  const supabase = createBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [cronResult, setCronResult] = useState<string | null>(null);
  const [cronLoading, setCronLoading] = useState(false);
  const [tab, setTab] = useState<"stats" | "cron" | "users" | "reports" | "data">("stats");
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [snapshotDetail, setSnapshotDetail] = useState<SnapshotRow[]>([]);
  const [snapshotDetailLoading, setSnapshotDetailLoading] = useState(false);
  const [detailGasFilter, setDetailGasFilter] = useState<string>("Tous");
  const [detailSort, setDetailSort] = useState<"price_asc" | "price_desc" | "name">("price_asc");

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

  useEffect(() => {
    if (!token) return;
    loadStats();
    loadUsers();
    loadReports();
    loadSnapshots();
  }, [token]);

  function authHeaders() {
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

  async function loadSnapshotDetail(date: string) {
    setSnapshotDetailLoading(true);
    setSnapshotDetail([]);
    const res = await fetch(`/api/admin?type=snapshot_detail&date=${date}`, { headers: authHeaders() });
    if (res.ok) setSnapshotDetail(await res.json());
    setSnapshotDetailLoading(false);
  }

  function handleSelectSnapshot(date: string) {
    if (selectedSnapshot === date) {
      setSelectedSnapshot(null);
      setSnapshotDetail([]);
    } else {
      setSelectedSnapshot(date);
      loadSnapshotDetail(date);
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

  if (loading) return <div className="admin-center">Chargement...</div>;
  if (!user) return (
    <div className="admin-center">
      <h2>Acc&egrave;s refus&eacute;</h2>
      <p>Vous devez &ecirc;tre connect&eacute;.</p>
      <a href="/login" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
        <LogOut className="size-4" />
        Se connecter
      </a>
    </div>
  );
  const readOnly = !isAdmin;

  return (
    <div className="admin-page">
      <header className="gov-bar" style={{ height: "auto", flexWrap: "wrap", padding: "0.5rem 1.25rem", gap: "0.5rem", overflow: "visible" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <a href="/" className="flex items-center justify-center size-7 rounded-lg text-white hover:bg-white/15 transition-colors">
            <ArrowLeft className="size-4" />
          </a>
          <div className="gov-bar-title">
            <span className="gov-bar-fleur">⚜</span>
            <div>Administration<div className="gov-bar-subtitle">Essence Qu&eacute;bec</div></div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
          {([
            { key: "stats", icon: <BarChart3 className="size-3.5" />, label: "Stats" },
            { key: "cron", icon: <Clock className="size-3.5" />, label: "Cron" },
            { key: "users", icon: <Users className="size-3.5" />, label: "Utilisateurs" },
            { key: "reports", icon: <Flag className="size-3.5" />, label: `Signalements (${reports.length})` },
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
          <AdminUserDropdown email={user.email!} onLogout={() => { supabase.auth.signOut(); window.location.href = "/"; }} />
        </div>
        <div className="gov-bar-accent" />
      </header>

        <div className="admin-content">
          {tab === "stats" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Database className="size-4" />
                    Stations actives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.totalStations ?? "..."}</p>
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
                  <p className="text-3xl font-bold">{stats?.totalSnapshots?.toLocaleString() ?? "..."}</p>
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
                  <p className="text-lg font-bold">{stats?.lastSnapshot ?? "..."}</p>
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
                  <p className="text-3xl font-bold">{stats?.totalUsers ?? "..."}</p>
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
                  <p className="text-3xl font-bold">{stats?.totalReports ?? "..."}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "cron" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">D&eacute;clencher manuellement un snapshot des prix.</p>
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
                          {r.status !== "r\u00e9solu" && (
                            <Button variant="secondary" size="xs" onClick={() => updateReportStatus(r.id, "r\u00e9solu")} disabled={readOnly}>
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

          {tab === "data" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} en base</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Stations</TableHead>
                    <TableHead className="text-right">Moy. Régulier</TableHead>
                    <TableHead className="text-right">Moy. Super</TableHead>
                    <TableHead className="text-right">Moy. Diesel</TableHead>
                    <TableHead className="text-right">Min / Max global</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((s) => {
                    const allPrices = Object.values(s.types).flatMap(t => [t.min, t.max]);
                    const globalMin = Math.min(...allPrices);
                    const globalMax = Math.max(...allPrices);
                    const isOpen = selectedSnapshot === s.date;
                    return [
                      <TableRow
                        key={s.date}
                        className="cursor-pointer hover:bg-muted/60"
                        onClick={() => handleSelectSnapshot(s.date)}
                      >
                        <TableCell className="font-medium flex items-center gap-2">
                          <ChevronDown className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          {s.date}
                        </TableCell>
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
                      </TableRow>,
                      isOpen && (
                        <TableRow key={`${s.date}-detail`}>
                          <TableCell colSpan={6} className="p-0 bg-muted/30">
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtrer :</span>
                                {["Tous", "Régulier", "Super", "Diesel"].map((g) => (
                                  <button
                                    key={g}
                                    onClick={(e) => { e.stopPropagation(); setDetailGasFilter(g); }}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${detailGasFilter === g ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                                  >
                                    {g}
                                  </button>
                                ))}
                                <span className="ml-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trier :</span>
                                {([["price_asc", "Prix ↑"], ["price_desc", "Prix ↓"], ["name", "Nom A→Z"]] as const).map(([val, label]) => (
                                  <button
                                    key={val}
                                    onClick={(e) => { e.stopPropagation(); setDetailSort(val); }}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${detailSort === val ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              {snapshotDetailLoading ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">Chargement...</p>
                              ) : (
                                <div className="max-h-[400px] overflow-y-auto rounded border">
                                  <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-background border-b">
                                      <tr>
                                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Station</th>
                                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Adresse</th>
                                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Prix</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {snapshotDetail
                                        .filter(r => detailGasFilter === "Tous" || r.gas_type === detailGasFilter)
                                        .sort((a, b) => {
                                          if (detailSort === "price_asc") return a.price - b.price;
                                          if (detailSort === "price_desc") return b.price - a.price;
                                          return a.station_name.localeCompare(b.station_name);
                                        })
                                        .map((r, i) => (
                                          <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                                            <td className="px-3 py-1.5 font-medium">{r.station_name}</td>
                                            <td className="px-3 py-1.5 text-muted-foreground text-xs">{r.address}</td>
                                            <td className="px-3 py-1.5">
                                              <Badge variant="outline" className="text-xs">{r.gas_type}</Badge>
                                            </td>
                                            <td className="px-3 py-1.5 text-right font-mono font-semibold">{r.price}¢</td>
                                          </tr>
                                        ))
                                      }
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    ];
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
    </div>
  );
}
