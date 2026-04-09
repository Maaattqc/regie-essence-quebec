/**
 * Vérifie les stations suspectes en les géocodant par nom de commerce + ville,
 * puis compare les deux résultats pour identifier les vraies erreurs.
 */

import { readFileSync, writeFileSync } from "fs";
import https from "https";

const DELAY_MS = 1100;
const results = JSON.parse(readFileSync("geocode-results.json", "utf8"));

// Stations à vérifier: 5-50km d'écart
const suspects = results.errors
  .filter((e) => e.distKm >= 5 && e.distKm <= 50)
  .sort((a, b) => b.distKm - a.distKm);

console.log(`Vérification de ${suspects.length} stations suspectes...\n`);

function geocode(query) {
  return new Promise((resolve) => {
    const q = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ca`;
    https
      .get(url, { headers: { "User-Agent": "StationVerify/1.0" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const r = JSON.parse(data);
            resolve(r.length > 0 ? { lat: parseFloat(r[0].lat), lon: parseFloat(r[0].lon), name: r[0].display_name } : null);
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

const verified = [];

for (let i = 0; i < suspects.length; i++) {
  const s = suspects[i];
  const city = s.address.match(/,\s*(.+)$/)?.[1]?.trim() || "";

  // Recherche 1: par nom de commerce + ville
  const brandSearch = `${s.brand} ${city} Quebec Canada`;
  const byBrand = await geocode(brandSearch);
  await new Promise((r) => setTimeout(r, DELAY_MS));

  // Recherche 2: adresse complète avec ville
  const fullAddr = s.address + ", Quebec, Canada";
  const byAddr = await geocode(fullAddr);
  await new Promise((r) => setTimeout(r, DELAY_MS));

  // Recherche 3: nom du commerce exact + adresse
  const exactSearch = `${s.name} ${s.address}`;
  const byExact = await geocode(exactSearch);
  await new Promise((r) => setTimeout(r, DELAY_MS));

  // Analyser les résultats
  const sourceDists = [];
  const geocodedOptions = [];

  if (byBrand) {
    const d = distKm(s.source.lat, s.source.lng, byBrand.lat, byBrand.lon);
    sourceDists.push({ method: "brand+ville", dist: d, coords: byBrand, name: byBrand.name });
    geocodedOptions.push(byBrand);
  }
  if (byAddr) {
    const d = distKm(s.source.lat, s.source.lng, byAddr.lat, byAddr.lon);
    sourceDists.push({ method: "adresse", dist: d, coords: byAddr, name: byAddr.name });
    geocodedOptions.push(byAddr);
  }
  if (byExact) {
    const d = distKm(s.source.lat, s.source.lng, byExact.lat, byExact.lon);
    sourceDists.push({ method: "nom+adresse", dist: d, coords: byExact, name: byExact.name });
    geocodedOptions.push(byExact);
  }

  // Si au moins 2 géocodages concordent (< 2km entre eux) et sont loin de la source (>3km),
  // c'est probablement une vraie erreur
  let likelyError = false;
  let bestGeocode = null;
  let confidence = "faible";

  for (let a = 0; a < geocodedOptions.length; a++) {
    for (let b = a + 1; b < geocodedOptions.length; b++) {
      const inter = distKm(geocodedOptions[a].lat, geocodedOptions[a].lon, geocodedOptions[b].lat, geocodedOptions[b].lon);
      if (inter < 2) {
        // Deux géocodages concordent
        const avgLat = (geocodedOptions[a].lat + geocodedOptions[b].lat) / 2;
        const avgLon = (geocodedOptions[a].lon + geocodedOptions[b].lon) / 2;
        const distFromSource = distKm(s.source.lat, s.source.lng, avgLat, avgLon);
        if (distFromSource > 3) {
          likelyError = true;
          bestGeocode = { lat: avgLat, lng: avgLon };
          confidence = "forte";
        }
      }
    }
  }

  // Si un seul résultat mais trouvé le commerce exact
  if (!likelyError && sourceDists.length > 0) {
    const best = sourceDists.sort((a, b) => a.dist - b.dist)[0];
    if (best.dist > 3 && best.name.toLowerCase().includes(s.brand.toLowerCase())) {
      likelyError = true;
      bestGeocode = { lat: best.coords.lat, lng: best.coords.lon };
      confidence = "moyenne";
    }
  }

  const entry = {
    ...s,
    searches: sourceDists.map((d) => ({
      method: d.method,
      dist: Math.round(d.dist * 10) / 10,
      result: d.name,
    })),
    likelyError,
    confidence,
    suggestedCoords: bestGeocode,
  };
  verified.push(entry);

  const status = likelyError ? `ERREUR PROBABLE (${confidence})` : "OK / Incertain";
  const pct = (((i + 1) / suspects.length) * 100).toFixed(0);
  console.log(`[${pct}%] ${s.distKm}km | ${status} | ${s.brand} | ${s.address}`);
  sourceDists.forEach((d) => console.log(`  ${d.method}: ${d.dist.toFixed(1)}km - ${d.name.substring(0, 80)}`));
  console.log("");
}

writeFileSync("verified-suspects.json", JSON.stringify(verified, null, 2));

const errors = verified.filter((v) => v.likelyError);
console.log(`\n=== RÉSUMÉ ===`);
console.log(`Vérifiées: ${verified.length}`);
console.log(`Erreurs probables: ${errors.length}`);
console.log(`Incertaines: ${verified.length - errors.length}`);

if (errors.length) {
  console.log(`\n=== ERREURS PROBABLES ===`);
  errors.forEach((e) => {
    console.log(`${e.distKm}km [${e.confidence}] | ${e.brand} | ${e.name} | ${e.address}`);
    console.log(`  Source: ${e.source.lat}, ${e.source.lng}`);
    console.log(`  Suggéré: ${e.suggestedCoords.lat.toFixed(6)}, ${e.suggestedCoords.lng.toFixed(6)}`);
  });
}
