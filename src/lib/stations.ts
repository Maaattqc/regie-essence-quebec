export interface StationPrice {
  GasType: string;
  Price: string;
  IsAvailable: boolean;
}

export interface StationProperties {
  Name: string;
  brand: string;
  Address: string;
  PostalCode: string;
  Region: string;
  Prices: StationPrice[];
  _city?: string;
  _cityNorm?: string;
}

export const QUEBEC_CENTER: [number, number] = [52.0, -72.0];
export const QUEBEC_ZOOM = 5;
export const STATIONS_URL = "https://regieessencequebec.ca/stations.geojson.gz";

export const REGION_CENTERS: Record<string, [number, number]> = {
  "Abitibi-Témiscamingue": [48.1705, -78.5117],
  "Bas-Saint-Laurent": [48.2038, -68.6293],
  "Capitale-Nationale": [46.9028, -71.2655],
  "Centre-du-Québec": [46.0535, -72.2469],
  "Chaudière-Appalaches": [46.5273, -70.9849],
  "Côte-Nord": [49.5469, -67.3614],
  "Estrie": [45.3859, -72.1444],
  "Gaspésie-Îles-de-la-Madeleine": [48.3045, -64.9487],
  "Lanaudière": [45.9302, -73.5505],
  "Laurentides": [45.8279, -74.1920],
  "Laval": [45.5789, -73.7406],
  "Mauricie": [46.5544, -72.7076],
  "Montérégie": [45.4674, -73.4465],
  "Montréal": [45.5289, -73.6453],
  "Municipalités hors MRC \\ CMM": [45.5266, -73.6502],
  "Nord-du-Québec": [50.0194, -75.9221],
  "Outaouais": [45.6084, -75.6577],
  "Saguenay-Lac-Saint-Jean": [48.5114, -71.5597],
};

export const GAS_TYPES = [
  { key: "Régulier", label: "Régulier", color: "#d32f2f" },
  { key: "Super", label: "Super", color: "#f9a825" },
  { key: "Diesel", label: "Diesel", color: "#2e7d32" },
] as const;

export type GasTypeKey = (typeof GAS_TYPES)[number]["key"];

export const BRANDS = [
  "AMI", "Aucun", "Axco", "Beausoir", "Belzile", "Bélisle", "Canadian Tire",
  "Costco", "Couche-Tard", "Crevier", "Eko", "Esso", "Gaz-O-Bar", "Harnois",
  "Irving", "Le Relais", "Les Huiles Berthier Inc", "MacEwen", "Miraco",
  "Mobil", "Nutrinor Énergies", "Paddock", "Paquet", "Petro Abitemis",
  "Petro-Canada", "Petrol St-Félix", "Petroplus", "Pétro-T",
  "Pétroles Maurice", "Quickie", "R.L.", "SDBJ", "Shell", "Sonerco", "Sonic",
  "Stinson", "Ultramar",
];

export const REGIONS = [
  "Abitibi-Témiscamingue", "Bas-Saint-Laurent", "Capitale-Nationale",
  "Centre-du-Québec", "Chaudière-Appalaches", "Côte-Nord", "Estrie",
  "Gaspésie-Îles-de-la-Madeleine", "Lanaudière", "Laurentides", "Laval",
  "Mauricie", "Montréal", "Montérégie",
  "Municipalités hors MRC \\ CMM", "Nord-du-Québec", "Outaouais",
  "Saguenay-Lac-Saint-Jean",
];

export const PRICE_COLORS = ["#2d9a2d", "#6fbf3b", "#f0c808", "#ef8a17", "#e63946"];

/**
 * Corrections manuelles de coordonnées pour les stations mal positionnées
 * dans la source de données de la Régie de l'énergie.
 * Clé : "Name::Address" (même format que buildStationKey).
 * Valeur : [longitude, latitude].
 */
export const COORDINATE_OVERRIDES: Record<string, [number, number]> = {
  // Beauceville — 800m trop au nord (avant le pont)
  "9396-2041 QUEBEC INC::575 boul. Renault, BEAUCEVILLE": [-70.7747, 46.2106],
  // Lévis — coords dupliquées entre 2 stations
  "9470-3162 Québec Inc.::659 rte du Président-Kennedy, Lévis": [-71.1337, 46.7659],
  "Harnois Énergies Inc.::1785 rte des Rivières, Lévis": [-71.2911, 46.7112],
  // Granby — 30km trop à l'est (longitude erronée dans la source)
  "Couche-Tard Inc.::351 rue Saint-Charles sud, Granby": [-72.7354, 45.3888],
  // Sept-Îles — 25km d'écart
  "Dan Esso::200 rte Jacques-Cartier, Sept-Îles": [-66.2068, 50.2202],
  // Laval Sainte-Rose — 8.5km trop au sud
  "Couche-Tard Inc.::225 boul. Curé-Labelle, Laval": [-73.7899, 45.6019],
  // Sainte-Victoire-de-Sorel — 7.1km trop au nord
  "9198-7131 Québec inc.::1547 ch. des Patriotes, Sainte-Victoire-de-Sorel": [-73.1366, 45.9864],
  // Montréal Côte-Vertu — 6.9km d'écart
  "9475-0270 Quebec Inc::200 de la Côte-Vertu, MONTRÉAL": [-73.7235, 45.4793],
  // Saint-Dominique — 6.6km trop au nord
  "7766670 Canada inc.::1147 rue Principale, Saint-Dominique": [-72.8544, 45.5657],
  // Salaberry-de-Valleyfield — 6.5km d'écart
  "Les Gestions L.P.Fillion inc.::275 rue Jacques-Cartier, Salaberry-de-Valleyfield": [-74.1212, 45.2456],
  // Saint-Hyacinthe — 5.5km trop au nord
  "Harnois Énergies Inc.::17090 av. Saint-Louis, Saint-Hyacinthe": [-72.9274, 45.6202],
  // Saint-Paul d'Abbotsford — 5.3km trop au nord
  "Dépanneur PH Garneau inc.::2115 rue Principale, Saint-Paul d'Abbotsford": [-72.8392, 45.4304],
};

export function stationId(props: StationProperties): string {
  return `${props.Name}|${props.Address}`;
}

export function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace("\u00A2", ""));
}

export function getPriceColor(value: number, min: number, max: number): string {
  if (min === max) return PRICE_COLORS[2];
  const ratio = (value - min) / (max - min);
  const idx = Math.min(Math.floor(ratio * 5), 4);
  return PRICE_COLORS[idx];
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type RoadInfo = {
  distKm: number | null;
  durationMin: number | null;
};

export type RoadDistancesResult = {
  infos: RoadInfo[];
  serverCacheHit: boolean | null;
};

/**
 * Distances et durées routières via proxy serveur /api/mapbox (token jamais exposé côté client).
 */
export async function roadDistances(
  origin: [number, number],
  destinations: [number, number][],
): Promise<RoadDistancesResult> {
  const fallback: RoadDistancesResult = {
    infos: destinations.map(() => ({ distKm: null, durationMin: null })),
    serverCacheHit: null,
  };
  if (destinations.length === 0) return fallback;
  try {
    const coords = [
      `${origin[1]},${origin[0]}`,
      ...destinations.map(([lat, lng]) => `${lng},${lat}`),
    ].join(";");
    const res = await fetch("/api/mapbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "matrix", coords }),
    });
    if (!res.ok) return fallback;
    const serverCacheHit = res.headers.get("X-Mapbox-Cache") === "HIT";
    const data = await res.json();
    const distRow = data.distances?.[0];
    const durRow = data.durations?.[0];
    if (!distRow) return fallback;
    return {
      infos: distRow.slice(1).map((m: number | null, i: number) => ({
        distKm: m != null && m > 0 ? m / 1000 : null,
        durationMin: durRow?.[i + 1] != null && durRow[i + 1] > 0 ? durRow[i + 1] / 60 : null,
      })),
      serverCacheHit,
    };
  } catch {
    return fallback;
  }
}

export type RouteDetails = {
  path: [number, number][];
  distKm: number;
  durationMin: number;
};

/**
 * Tracé routier via proxy serveur /api/mapbox (token jamais exposé côté client).
 */
export async function roadRoute(
  origin: [number, number],
  destination: [number, number],
): Promise<RouteDetails | null> {
  try {
    const res = await fetch("/api/mapbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "directions", origin, destination }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route?.geometry?.coordinates) return null;
    return {
      path: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
      distKm: (route.distance ?? 0) / 1000,
      durationMin: (route.duration ?? 0) / 60,
    };
  } catch {
    return null;
  }
}

/** Prix effectif incluant le coût du trajet aller-retour. */
export function effectivePrice(price: number, distKm: number, consoLper100: number, tankVolume: number): number {
  return price * (1 + (2 * distKm * consoLper100) / (100 * tankVolume));
}

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function extractCity(address: string): string | null {
  const idx = address.lastIndexOf(",");
  if (idx === -1) return null;
  const city = address.slice(idx + 1).trim().toLowerCase();
  return city.replace(/(^|[-\s])(\S)/g, (_, sep, ch) => sep + ch.toUpperCase());
}

export function deduplicateCities(raw: Set<string>): string[] {
  const sorted = [...raw].sort((a, b) => a.length - b.length);
  const kept: string[] = [];
  const normalizedKept: string[] = [];

  for (const city of sorted) {
    const norm = normalize(city);
    const isDuplicate = normalizedKept.some(
      (existing) => norm === existing || (norm.startsWith(existing + "-") || norm.startsWith(existing + " "))
    );
    if (!isDuplicate) {
      kept.push(city);
      normalizedKept.push(norm);
    }
  }

  return kept.sort((a, b) => a.localeCompare(b, "fr"));
}

export function getFavorites(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));
  } catch { return new Set(); }
}

export function toggleFavorite(id: string): Set<string> {
  const favs = getFavorites();
  if (favs.has(id)) favs.delete(id); else favs.add(id);
  localStorage.setItem("favorites", JSON.stringify([...favs]));
  window.dispatchEvent(new Event("favorites-changed"));
  return favs;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      null
    );
  } catch {
    return null;
  }
}
