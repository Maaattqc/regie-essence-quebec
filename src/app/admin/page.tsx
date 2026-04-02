"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

interface Stats {
  totalStations: number;
  totalSnapshots: number;
  lastSnapshot: string;
  avgRegulier: number;
  avgSuper: number;
  avgDiesel: number;
}

export default function AdminPage() {
  const supabase = createBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [cronResult, setCronResult] = useState<string | null>(null);
  const [cronLoading, setCronLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setIsAdmin(data?.role === "admin");
      }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
    loadUsers();
    loadReports();
  }, [isAdmin]);

  async function loadStats() {
    const { count: totalSnapshots } = await supabase
      .from("price_snapshots")
      .select("*", { count: "exact", head: true });

    const { data: latest } = await supabase
      .from("price_snapshots")
      .select("snapshot_date")
      .order("snapshot_date", { ascending: false })
      .limit(1);

    let avgs = null;
    try { const res = await supabase.rpc("get_avg_prices"); avgs = res.data; } catch {}

    setStats({
      totalStations: 2288,
      totalSnapshots: totalSnapshots || 0,
      lastSnapshot: latest?.[0]?.snapshot_date || "Aucun",
      avgRegulier: avgs?.regulier || 0,
      avgSuper: avgs?.super || 0,
      avgDiesel: avgs?.diesel || 0,
    });
  }

  async function loadUsers() {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  }

  async function loadReports() {
    const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    setReports(data || []);
  }

  async function updateReportStatus(id: number, status: string) {
    await supabase.from("reports").update({ status }).eq("id", id);
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

  async function toggleRole(profile: Profile) {
    const newRole = profile.role === "admin" ? "user" : "admin";
    await supabase.from("profiles").update({ role: newRole }).eq("id", profile.id);
    loadUsers();
  }

  if (loading) return <div className="admin-center">Chargement...</div>;
  if (!user) return (
    <div className="admin-center">
      <h2>Acc&egrave;s refus&eacute;</h2>
      <p>Vous devez &ecirc;tre connect&eacute;.</p>
      <Button variant="default" render={<a href="/login" />} className="mt-3">
        <LogOut className="size-4" />
        Se connecter
      </Button>
    </div>
  );
  if (!isAdmin) return (
    <div className="admin-center">
      <AlertCircle className="mx-auto size-10 text-destructive mb-2" />
      <h2>Acc&egrave;s refus&eacute;</h2>
      <p>Vous n&apos;avez pas les droits administrateur.</p>
      <Button variant="link" render={<a href="/" />} className="mt-2">
        <ArrowLeft className="size-4" />
        Retour &agrave; la carte
      </Button>
    </div>
  );

  return (
    <div className="admin-page">
      <header className="gov-bar">
        <div className="gov-bar-title">
          <span className="gov-bar-fleur">⚜</span>
          <div>Administration<div className="gov-bar-subtitle">R&eacute;gie Essence Qu&eacute;bec</div></div>
        </div>
        <div className="gov-bar-right">
          <span>{user.email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { supabase.auth.signOut(); window.location.href = "/"; }}
          >
            <LogOut className="size-4" />
            D&eacute;connexion
          </Button>
        </div>
        <div className="gov-bar-accent" />
      </header>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList variant="line" className="w-full justify-start px-4 pt-2">
          <TabsTrigger value="stats">
            <BarChart3 className="size-4" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="cron">
            <Clock className="size-4" />
            Cron / Snapshots
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="size-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Flag className="size-4" />
            Signalements ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="size-4" />
            Donn&eacute;es
          </TabsTrigger>
        </TabsList>

        <Separator />

        <div className="admin-content">
          <TabsContent value="stats">
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
            </div>
          </TabsContent>

          <TabsContent value="cron">
            <div className="space-y-4">
              <p className="text-muted-foreground">D&eacute;clencher manuellement un snapshot des prix.</p>
              <Button onClick={triggerCron} disabled={cronLoading}>
                <Play className="size-4" />
                {cronLoading ? "En cours..." : "Lancer le cron maintenant"}
              </Button>
              {cronResult && (
                <pre className="admin-pre">{cronResult}</pre>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
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
                      >
                        <Shield className="size-3" />
                        {u.role === "admin" ? "Retirer admin" : "Rendre admin"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="reports">
            {reports.length === 0 ? (
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
                            <Button variant="outline" size="xs" onClick={() => updateReportStatus(r.id, "en traitement")}>
                              En traitement
                            </Button>
                          )}
                          {r.status !== "r\u00e9solu" && (
                            <Button variant="secondary" size="xs" onClick={() => updateReportStatus(r.id, "r\u00e9solu")}>
                              R&eacute;solu
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="data">
            <div className="space-y-2">
              <p>Gestion des donn&eacute;es de stations et de prix.</p>
              <p className="text-xs text-muted-foreground">Fonctionnalit&eacute; &agrave; venir &mdash; mod&eacute;ration des stations et correction de prix.</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
