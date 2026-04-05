import { type StationProperties, stationId, getFavorites } from "@/lib/stations";
import type { Translations } from "@/lib/i18n/fr";

export const SVG = {
  navigation: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starEmpty: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  barChart: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  messageCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
  flag: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
};

export function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function formatPopup(props: StationProperties, lat: number, lng: number, p: Translations["popup"], gasTypes?: Translations["gasTypes"]) {
  const priceChips = props.Prices.filter((p) => p.IsAvailable)
    .map((p) => `
      <div style="display:flex;justify-content:space-between;align-items:center;background:#f5f5f5;border-radius:6px;padding:5px 9px;font-size:12.5px">
        <span style="color:#555;font-weight:500">${escHtml(gasTypes ? (gasTypes[p.GasType as keyof typeof gasTypes] ?? p.GasType) : p.GasType)}</span>
        <strong style="color:#111;font-size:14px;margin-left:10px">${escHtml(p.Price)} <span style="font-size:10px;font-weight:400;color:#888">¢/L</span></strong>
      </div>`)
    .join("");

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const sid = stationId(props);
  const isFav = getFavorites().has(sid);
  const esc = escHtml;

  const btnBase = "border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;padding:7px 4px;display:flex;align-items:center;justify-content:center;gap:4px;flex:1;";

  return `
    <div style="min-width:230px;font-family:system-ui,sans-serif;padding:2px 0" role="region" aria-label="Station ${esc(props.Name)}">
      <div style="margin-bottom:10px">
        <h3 style="font-size:15px;font-weight:700;color:#111;line-height:1.3;margin:0 0 3px 0">${esc(props.Name)}</h3>
        <div style="font-size:12px;color:#666;margin-bottom:1px">${esc(props.brand ?? "")} &middot; ${esc(props.Region)}</div>
        <div style="font-size:11.5px;color:#999">${esc(props.Address)}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px" aria-label="${p.available}">
        ${priceChips}
      </div>

      <div style="display:flex;gap:5px;margin-bottom:5px">
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
          style="${btnBase}background:#4285f4;color:#fff;text-decoration:none;flex:2"
          aria-label="${p.directionsTo(esc(props.Name))}">
          ${SVG.navigation} ${p.directions}
        </a>
        <button onclick="window.__toggleFav('${esc(sid)}')"
          style="${btnBase}background:${isFav ? "#ff9800" : "#f0f0f0"};color:${isFav ? "#fff" : "#555"}"
          aria-label="${isFav ? p.removeFavorite : p.addFavorite}" aria-pressed="${isFav}">
          ${isFav ? SVG.star : SVG.starEmpty} ${p.favorite}
        </button>
      </div>

      <div style="display:flex;gap:5px">
        <button onclick="window.__showHistory('${esc(props.Name)}','${esc(props.Address)}')"
          style="${btnBase}background:#ede9fe;color:#6d28d9"
          aria-label="${p.historyOf(esc(props.Name))}">
          ${SVG.barChart} ${p.history}
        </button>
        <button onclick="window.__showReviews('${esc(props.Name)}','${esc(props.Address)}')"
          style="${btnBase}background:#e0f2fe;color:#0369a1"
          aria-label="${p.commentsOf(esc(props.Name))}">
          ${SVG.messageCircle} ${p.comments}
        </button>
        <button onclick="window.__showReport('${esc(props.Name)}','${esc(props.Address)}')"
          style="${btnBase}background:#fee2e2;color:#dc2626"
          aria-label="${p.reportOf(esc(props.Name))}">
          ${SVG.flag} ${p.report}
        </button>
      </div>
    </div>
  `;
}
