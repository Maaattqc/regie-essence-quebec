"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Search, Star, StarOff, X, User, ChevronDown, MapPin, Building2, Sun, Moon, Lightbulb } from "lucide-react";
import {
  type GasTypeKey,
  GAS_TYPES,
  BRANDS,
  REGIONS,
  normalize,
} from "@/lib/stations";
import NavDropdown from "@/components/NavDropdown";
import UserDropdown from "@/components/UserDropdown";

function SearchWithSuggestions({
  search,
  onSearchChange,
  onConfirm,
  cities,
  cityCounts,
}: {
  search: string;
  onSearchChange: (s: string) => void;
  onConfirm: (s: string) => void;
  cities: string[];
  cityCounts: Record<string, number>;
}) {
  const [input, setInput] = useState(search);
  const [focused, setFocused] = useState(false);
  const [debouncedInput, setDebouncedInput] = useState(input);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInput(search);
    setDebouncedInput(search);
  }, [search]);

  const handleInput = useCallback((v: string) => {
    setInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedInput(v), 200);
  }, []);

  const suggestions = useMemo(() => {
    const q = debouncedInput.trim();
    if (q.length < 2) return [];
    const norm = normalize(q);
    return cities.filter((c) => normalize(c).includes(norm)).slice(0, 8);
  }, [debouncedInput, cities]);

  function select(city: string) {
    setInput(city);
    onSearchChange(city);
    onConfirm(city);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      onSearchChange(input);
      onConfirm(input);
      (e.target as HTMLInputElement).blur();
    }
  }

  function handleClear() {
    setInput("");
    onSearchChange("");
    onConfirm("");
  }

  return (
    <div className="relative">
      <div className="nb-input-wrap">
        <Search className="nb-input-icon" />
        <Input
          type="text"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Ville…"
          className="nb-input"
          style={{ paddingRight: input ? 28 : 10 }}
        />
        {input && (
          <span className="nb-input-clear" onMouseDown={handleClear}>
            <X className="size-3" />
          </span>
        )}
      </div>
      {focused && suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((city) => (
            <div
              key={city}
              className="suggestion-item"
              onMouseDown={() => select(city)}
            >
              {city} <span className="text-[var(--text-muted)]">({cityCounts[city] || 0})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NbSelect({
  value,
  onChange,
  icon: Icon,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className={`nb-select-wrap${value ? " nb-select-wrap--active" : ""}`}>
      <Icon className="nb-select-icon-left" />
      <select className="nb-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
      <ChevronDown className="nb-select-icon-right" />
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center size-8 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
      style={{ background: "transparent", border: "none", cursor: "pointer" }}
      aria-label={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export default function FilterBar({
  gasType,
  onGasTypeChange,
  brand,
  onBrandChange,
  region,
  onRegionChange,
  search,
  onSearchChange,
  cities,
  showFavorites,
  onToggleFavorites,
  regionCounts,
  brandCounts,
  cityCounts,
  totalStations,
  onLoginClick,
  onChangelogClick,
  onSuggestionClick,
  currentUser,
  onLogout,
}: {
  gasType: GasTypeKey;
  onGasTypeChange: (t: GasTypeKey) => void;
  brand: string;
  onBrandChange: (b: string) => void;
  region: string;
  onRegionChange: (r: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  cities: string[];
  showFavorites: boolean;
  onToggleFavorites: () => void;
  regionCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  cityCounts: Record<string, number>;
  totalStations: number;
  onLoginClick: () => void;
  onChangelogClick: () => void;
  onSuggestionClick: () => void;
  currentUser: { email: string } | null;
  onLogout: () => void;
}) {
  return (
    <header className="gov-header">

      {/* ── Barre 1 ── */}
      <div className="gov-bar">
        <div className="gov-bar-title">
          <span className="gov-bar-fleur">&#9884;</span>
          <div className="gov-bar-title-text">
            Essence Québec
            <div className="gov-bar-subtitle">Prix en temps réel des stations-service</div>
          </div>
        </div>

        <div className="nb-sep" />

        {/* Pills carburant — toujours visibles */}
        <div className="nb-pills">
          {GAS_TYPES.map((t) => (
            <button
              key={t.key}
              className={`nb-pill${gasType === t.key ? " nb-pill-active" : ""}`}
              style={gasType === t.key ? { background: t.color, borderColor: t.color } : undefined}
              onClick={() => onGasTypeChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtres desktop seulement (cachés sur mobile) */}
        <div className="nb-filters-desktop">
          <SearchWithSuggestions
            search={search}
            onSearchChange={onSearchChange}
            onConfirm={onSearchChange}
            cities={cities}
            cityCounts={cityCounts}
          />
          <NbSelect value={region} onChange={onRegionChange} icon={MapPin}>
            <option value="">Toutes les régions ({totalStations})</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r} ({regionCounts[r] || 0})</option>
            ))}
          </NbSelect>
          <NbSelect value={brand} onChange={onBrandChange} icon={Building2}>
            <option value="">Toutes les compagnies ({totalStations})</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>{b} ({brandCounts[b] || 0})</option>
            ))}
          </NbSelect>
          <button
            className={`nb-fav${showFavorites ? " nb-fav-active" : ""}`}
            onClick={onToggleFavorites}
          >
            {showFavorites ? <Star className="size-3.5 fill-current" /> : <StarOff className="size-3.5" />}
            <span className="nb-label-text">Favoris</span>
          </button>
        </div>

        <div className="gov-bar-right">
          <button
            className="nb-fav"
            onClick={onSuggestionClick}
            title="Suggestion"
          >
            <Lightbulb className="size-3.5" />
            <span className="nb-label-text">Suggestion</span>
          </button>
          <NavDropdown onChangelogClick={onChangelogClick} />
          <ThemeToggle />
          {currentUser ? (
            <UserDropdown email={currentUser.email} onLogout={onLogout} />
          ) : (
            <button className="nb-login-btn" onClick={onLoginClick}>
              <User className="size-3.5" />
              <span className="nb-label-text">Connexion</span>
            </button>
          )}
        </div>

        <div className="gov-bar-accent" />
      </div>

      {/* ── Barre 2 : mobile seulement ── */}
      <div className="gov-bar-2">
        <SearchWithSuggestions
          search={search}
          onSearchChange={onSearchChange}
          onConfirm={onSearchChange}
          cities={cities}
          cityCounts={cityCounts}
        />
        <NbSelect value={region} onChange={onRegionChange} icon={MapPin}>
          <option value="">Région ({totalStations})</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r} ({regionCounts[r] || 0})</option>
          ))}
        </NbSelect>
      </div>

    </header>
  );
}
