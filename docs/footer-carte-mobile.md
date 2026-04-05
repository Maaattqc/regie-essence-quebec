# Footer fixe sur carte Leaflet — mobile, Safari, Messenger

## Problème

Sur une carte plein écran avec Leaflet :
- Le widget `AttributionControl` de Leaflet se positionne dans un **coin** et entre en conflit avec d'autres contrôles (zoom, boutons custom)
- Sur **Safari iOS**, `h-screen` (`100vh`) est trop grand — la barre URL cache le bas du contenu
- Sur **iPhone**, l'indicateur home (safe area) cache les éléments collés à `bottom: 0`
- Le contrôle zoom (+/-) monte au-dessus du footer puisqu'il ne sait pas que le footer existe

---

## Solution complète

### 1. Remplacer `AttributionControl` par un `<div>` custom

Au lieu d'utiliser le widget Leaflet, créer un `div` React **en dehors** du `MapContainer` :

```tsx
// Dans Map.tsx, après </MapContainer>
<div
  className="absolute left-0 right-0 z-[400] pointer-events-none flex justify-end"
  style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
>
  <div className="pointer-events-auto bg-white/80 dark:bg-black/60 text-[9px] px-2 py-0.5">
    © <a href="https://leafletjs.com">Leaflet</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | ...
  </div>
</div>
```

Avantages :
- Toujours au bas de l'écran, peu importe les autres contrôles
- Réactif à l'état React (ex: changer le texte selon le style de carte)
- Compatible dark mode avec Tailwind

### 2. Cacher le widget Leaflet résiduel

```css
.leaflet-control-attribution {
  display: none !important;
}
```

### 3. Pousser le zoom au-dessus du footer

```css
.leaflet-bottom.leaflet-right {
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
}
.leaflet-bottom.leaflet-left {
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
}
```

### 4. Fix Safari — hauteur dynamique

```tsx
// page.tsx — remplacer h-screen par h-dvh
<section className="relative h-dvh w-full">
```

| Valeur | Comportement |
|---|---|
| `100vh` | Hauteur fixe (grande) — barre URL Safari cache le bas |
| `100dvh` | Hauteur dynamique — s'adapte à la barre URL |
| `100svh` | Hauteur petite (barre URL toujours visible) — trop conservateur |

### 5. Safe area iOS (indicateur home)

```tsx
// Sur le footer
style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}

// Sur le padding du zoom
padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
```

`env(safe-area-inset-bottom)` retourne `0px` sur desktop et ~34px sur iPhone avec encoche/Dynamic Island.

---

## Attributions légales Leaflet + OSM

- **OpenStreetMap** : obligatoire légalement (licence ODbL) quand on utilise les tuiles `tile.openstreetmap.org`
- **Leaflet** : pas obligatoire légalement, mais bonne pratique

Style de carte | Attributions requises
--- | ---
OSM (défaut) | Leaflet + OpenStreetMap
Satellite Esri | Leaflet + Esri
Dark CARTO | Leaflet + CARTO

---

## Contexte

Appliqué dans le projet **Régie Essence Québec** (Next.js 16 + react-leaflet 5 + Tailwind 4).
