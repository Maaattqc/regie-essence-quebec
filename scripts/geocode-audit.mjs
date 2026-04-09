/**
 * Audit complet des coordonnées de toutes les stations.
 * Géocode chaque adresse via Nominatim (1 req/s) et compare avec la position source.
 * Sauvegarde les résultats progressivement dans geocode-results.json.
 *
 * Usage: node scripts/geocode-audit.mjs [--resume]
 *   --resume : reprend là où le script s'est arrêté
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import https from "https";

const THRESHOLD_KM = 0.5;
const DELAY_MS = 1100; // Nominatim: max 1 req/s
const RESULTS_FILE = "geocode-results.json";
const STATIONS_FILE = "all_stations.json";

const stations = JSON.parse(readFileSync(STATIONS_FILE, "utf8"));
const resume = process.argv.includes("--resume");

let results = { checked: 0, errors: [], skipped: 0, lastIndex: -1 };
if (resume && existsSync(RESULTS_FILE)) {
  results = JSON.parse(readFileSync(RESULTS_FILE, "utf8"));
  console.log(`Reprise à l'index ${results.lastIndex + 1} (${results.checked} déjà vérifiées)`);
}

function geocode(address) {
  return new Promise((resolve) => {
    const q = encodeURIComponent(address + ", Quebec, Canada");
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ca`;
    https
      .get(url, { headers: { "User-Agent": "StationAudit/1.0 (regie-essence-quebec)" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const r = JSON.parse(data);
            if (r.length > 0) {
              resolve({ lat: parseFloat(r[0].lat), lon: parseFloat(r[0].lon), name: r[0].display_name });
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function save() {
  writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

const startIdx = resume ? results.lastIndex + 1 : 0;
const total = stations.length;

console.log(`Audit de ${total} stations (seuil: ${THRESHOLD_KM}km)...`);
console.log(`Estimation: ~${Math.round(((total - startIdx) * DELAY_MS) / 60000)} minutes\n`);

for (let i = startIdx; i < total; i++) {
  const s = stations[i];
  const geo = await geocode(s.address);

  if (geo) {
    const d = distKm(s.lat, s.lng, geo.lat, geo.lon);
    results.checked++;

    if (d > THRESHOLD_KM) {
      const entry = {
        distKm: Math.round(d * 10) / 10,
        name: s.name,
        address: s.address,
        brand: s.brand,
        region: s.region,
        source: { lat: s.lat, lng: s.lng },
        geocoded: { lat: geo.lat, lng: geo.lon },
        geocodedName: geo.name,
      };
      results.errors.push(entry);
      console.log(`  ⚠ ${d.toFixed(1)}km | ${s.name} | ${s.address}`);
    }
  } else {
    results.skipped++;
  }

  results.lastIndex = i;

  // Progress log tous les 100
  if ((i + 1) % 100 === 0) {
    const pct = (((i + 1) / total) * 100).toFixed(1);
    const eta = Math.round(((total - i - 1) * DELAY_MS) / 60000);
    console.log(`[${pct}%] ${i + 1}/${total} — ${results.errors.length} erreurs — ~${eta}min restantes`);
    save();
  }

  await new Promise((r) => setTimeout(r, DELAY_MS));
}

save();

console.log(`\n=== AUDIT TERMINÉ ===`);
console.log(`Vérifiées: ${results.checked}`);
console.log(`Non géocodées: ${results.skipped}`);
console.log(`Erreurs (>${THRESHOLD_KM}km): ${results.errors.length}`);
console.log(`\nRésultats sauvegardés dans ${RESULTS_FILE}`);

if (results.errors.length) {
  console.log(`\n=== STATIONS MAL POSITIONNÉES ===`);
  results.errors
    .sort((a, b) => b.distKm - a.distKm)
    .forEach((e) => {
      console.log(`${e.distKm}km | ${e.brand} | ${e.name} | ${e.address}`);
      console.log(`  Source: ${e.source.lat}, ${e.source.lng} → Géocodé: ${e.geocoded.lat}, ${e.geocoded.lng}`);
    });
}
