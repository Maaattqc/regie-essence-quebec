#!/usr/bin/env node
/**
 * Stress test des routes GET — aucune écriture en DB.
 *
 * Usage :
 *   Terminal 1 → npm run dev
 *   Terminal 2 → npm run test:load
 *
 * Chaque VU (virtual user) envoie un x-real-ip unique pour contourner
 * le rate-limiter par IP — on mesure ainsi la vraie capacité du serveur,
 * pas juste la limite d'un seul client.
 */

const BASE         = process.env.LOAD_TEST_URL ?? 'http://127.0.0.1:3000';
const CONCURRENCY  = Number(process.env.CONCURRENCY  ?? 20);   // VUs simultanés par batch
const DURATION_S   = Number(process.env.DURATION_S   ?? 15);   // secondes par endpoint
const BATCH_GAP_MS = 50;   // pause entre deux batches (ms)

const ENDPOINTS = [
  {
    name: 'GET /api/health',
    url: '/api/health',
  },
  {
    name: 'GET /api/stations',
    url: '/api/stations',
  },
  {
    name: 'GET /api/history (vide)',
    // Station inexistante → réponse rapide [], ne lit pas de grosses données
    url: '/api/history?station=LoadTest&address=LoadTestAddr&type=R%C3%A9gulier&days=7',
  },
  {
    name: 'GET /api/admin?type=me (auth check)',
    url: '/api/admin?type=me',
  },
];

// ── Utilitaires ──────────────────────────────────────────────────────────────

function pct(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * p / 100) - 1);
  return sorted[Math.max(0, idx)];
}

function fakeIP(vuIndex) {
  // Génère une IP routable unique par VU pour que chacun ait son propre bucket
  const a = 203;
  const b = 0;
  const c = Math.floor(vuIndex / 256) + 113;
  const d = vuIndex % 256;
  return `${a}.${b}.${c}.${d}`;
}

async function req(url, vuIndex) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      headers: { 'x-real-ip': fakeIP(vuIndex) },
      signal: AbortSignal.timeout(10_000),
    });
    return { status: res.status, ms: Math.round(performance.now() - start) };
  } catch (e) {
    return { status: 0, ms: Math.round(performance.now() - start), err: e.message };
  }
}

// ── Runner par endpoint ───────────────────────────────────────────────────────

async function runEndpoint({ name, url }) {
  const fullUrl = `${BASE}${url}`;

  console.log(`\n── ${name}`);
  console.log(`   URL : ${fullUrl}`);

  // Warmup séquentiel (vérifie que l'endpoint répond)
  process.stdout.write('   Warmup  : ');
  for (let i = 0; i < 3; i++) {
    const r = await req(fullUrl, i);
    process.stdout.write(`[${r.status}] `);
    await new Promise(r => setTimeout(r, 200));
  }
  process.stdout.write('\n');

  // Phase de charge
  const stats = { ok: 0, limited: 0, errors: 0, ms: [] };
  const endTs = Date.now() + DURATION_S * 1000;
  let batches = 0;

  while (Date.now() < endTs) {
    const results = await Promise.all(
      Array.from({ length: CONCURRENCY }, (_, i) => req(fullUrl, i))
    );
    batches++;
    for (const r of results) {
      stats.ms.push(r.ms);
      if (r.status === 200)      stats.ok++;
      else if (r.status === 429) stats.limited++;
      else                       stats.errors++;
    }
    await new Promise(r => setTimeout(r, BATCH_GAP_MS));
  }

  const total = stats.ms.length;
  stats.ms.sort((a, b) => a - b);

  const okPct  = Math.round(stats.ok      / total * 100);
  const limPct = Math.round(stats.limited / total * 100);
  const errPct = Math.round(stats.errors  / total * 100);

  console.log(`   Requêtes : ${total} (${batches} batches × ${CONCURRENCY} VUs)`);
  console.log(`   ✅ 200 OK     : ${stats.ok.toString().padStart(5)}  (${okPct}%)`);
  if (stats.limited > 0)
    console.log(`   🚫 429 Limite : ${stats.limited.toString().padStart(5)}  (${limPct}%)`);
  if (stats.errors > 0)
    console.log(`   ❌ Erreurs    : ${stats.errors.toString().padStart(5)}  (${errPct}%)`);

  console.log(`   Latence p50  : ${pct(stats.ms, 50)} ms`);
  console.log(`   Latence p95  : ${pct(stats.ms, 95)} ms`);
  console.log(`   Latence p99  : ${pct(stats.ms, 99)} ms`);
  console.log(`   Min / Max    : ${stats.ms[0]} ms / ${stats.ms[stats.ms.length - 1]} ms`);

  // Alerte si p95 > 2s ou erreurs > 0
  if (pct(stats.ms, 95) > 2000)
    console.log('   ⚠️  p95 > 2s — latence élevée, vérifier Supabase / cold starts');
  if (stats.errors > 0)
    console.log(`   ⚠️  ${stats.errors} erreur(s) non-HTTP — potentiel crash ou timeout`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n┌─────────────────────────────────────────────────┐');
  console.log('│  STRESS TEST — Régie Essence Québec             │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log(`   Serveur     : ${BASE}`);
  console.log(`   Concurrence : ${CONCURRENCY} VUs (IPs uniques simulées)`);
  console.log(`   Durée       : ${DURATION_S}s par endpoint`);

  // Vérification que le serveur répond
  try {
    const probe = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!probe.ok) throw new Error(`Status ${probe.status}`);
    console.log('   Serveur     : UP ✅\n');
  } catch {
    console.error(`\n❌  Serveur inaccessible (${BASE})`);
    console.error('    Lance "npm run dev" dans un autre terminal d\'abord.\n');
    process.exit(1);
  }

  for (const endpoint of ENDPOINTS) {
    await runEndpoint(endpoint);
  }

  console.log('\n─────────────────────────────────────────────────');
  console.log('✅  Stress test terminé');
  console.log('    Critères de succès :');
  console.log('    • p95 < 2s sur tous les endpoints');
  console.log('    • 0 erreur 5xx');
  console.log('    • 429 attendus si rate limiting déclenché\n');
}

main();
