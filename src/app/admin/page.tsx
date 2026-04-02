"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

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
  const [tab, setTab] = useState<"stats" | "cron" | "users" | "reports" | "data">("stats");
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
      <h2>Accès refusé</h2>
      <p>Vous devez être connecté.</p>
      <a href="/login" className="login-btn" style={{ display: "inline-block", marginTop: 12 }}>Se connecter</a>
    </div>
  );
  if (!isAdmin) return (
    <div className="admin-center">
      <h2>Accès refusé</h2>
      <p>Vous n&apos;avez pas les droits administrateur.</p>
      <a href="/" style={{ color: "var(--qc-blue, #003DA5)" }}>&larr; Retour à la carte</a>
    </div>
  );

  return (
    <div className="admin-page">
      <header className="gov-bar">
        <div className="gov-bar-title">
          <span className="gov-bar-fleur">⚜</span>
          <div>Administration<div className="gov-bar-subtitle">Régie Essence Québec</div></div>
        </div>
        <div className="gov-bar-right">
          <span>{user.email}</span>
          <button
            onClick={() => { supabase.auth.signOut(); window.location.href = "/"; }}
            className="gov-bar-badge"
            style={{ cursor: "pointer", border: "none" }}
          >
            Déconnexion
          </button>
        </div>
        <div className="gov-bar-accent" />
      </header>

      <div className="admin-tabs">
        {(["stats", "cron", "users", "reports", "data"] as const).map((t) => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? "admin-tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "stats" ? "Statistiques" : t === "cron" ? "Cron / Snapshots" : t === "users" ? "Utilisateurs" : t === "reports" ? `Signalements (${reports.length})` : "Données"}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {tab === "stats" && (
          <div className="admin-grid">
            <div className="admin-card">
              <div className="admin-card-label">Stations actives</div>
              <div className="admin-card-value">{stats?.totalStations ?? "..."}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-label">Snapshots en DB</div>
              <div className="admin-card-value">{stats?.totalSnapshots?.toLocaleString() ?? "..."}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-label">Dernier snapshot</div>
              <div className="admin-card-value" style={{ fontSize: 18 }}>{stats?.lastSnapshot ?? "..."}</div>
            </div>
          </div>
        )}

        {tab === "cron" && (
          <div>
            <p style={{ marginBottom: 12 }}>Déclencher manuellement un snapshot des prix.</p>
            <button className="login-btn" onClick={triggerCron} disabled={cronLoading} style={{ width: "auto" }}>
              {cronLoading ? "En cours..." : "Lancer le cron maintenant"}
            </button>
            {cronResult && (
              <pre className="admin-pre">{cronResult}</pre>
            )}
          </div>
        )}

        {tab === "users" && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rôle</th>
                <th>Inscrit le</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    <span className={`admin-role ${u.role === "admin" ? "admin-role-admin" : ""}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString("fr-CA")}</td>
                  <td>
                    <button className="admin-action-btn" onClick={() => toggleRole(u)}>
                      {u.role === "admin" ? "Retirer admin" : "Rendre admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "reports" && (
          <div>
            {reports.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Aucun signalement.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>De</th>
                    <th>Message</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.station_name}</strong><br />
                        <small style={{ color: "var(--text-muted)" }}>{r.address}</small>
                      </td>
                      <td>
                        {r.first_name} {r.last_name}<br />
                        <small style={{ color: "var(--text-muted)" }}>{r.email}</small>
                      </td>
                      <td style={{ maxWidth: 200 }}>{r.message}</td>
                      <td>
                        <span className={`admin-role ${r.status === "nouveau" ? "admin-role-admin" : ""}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{new Date(r.created_at).toLocaleDateString("fr-CA")}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexDirection: "column" }}>
                          {r.status === "nouveau" && (
                            <button className="admin-action-btn" onClick={() => updateReportStatus(r.id, "en traitement")}>
                              En traitement
                            </button>
                          )}
                          {r.status !== "résolu" && (
                            <button className="admin-action-btn" onClick={() => updateReportStatus(r.id, "résolu")}>
                              Résolu
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "data" && (
          <div>
            <p>Gestion des données de stations et de prix.</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Fonctionnalité à venir — modération des stations et correction de prix.</p>
          </div>
        )}
      </div>
    </div>
  );
}
