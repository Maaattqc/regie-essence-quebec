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
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`
  );
  const data = await res.json();
  return (
    data.address?.city ||
    data.address?.town ||
    data.address?.village ||
    data.address?.municipality ||
    null
  );
}
