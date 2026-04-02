"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Star, StarOff, X, User,
} from "lucide-react";
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
      <Input
        type="text"
        value={input}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Ville"
        className="h-7 w-[180px] border-white/25 bg-white/12 text-white text-[13px] font-medium placeholder:text-white/50 focus-visible:bg-white/20 focus-visible:border-white/50 focus-visible:ring-0"
        style={{ paddingRight: input ? 24 : 10 }}
      />
      {input && (
        <span className="search-clear" onMouseDown={handleClear}>
          <X className="size-3" />
        </span>
      )}
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
  currentUser: { email: string } | null;
  onLogout: () => void;
}) {
  return (
    <header className="gov-header">
      <div className="gov-bar">
        <div className="gov-bar-title">
          <span className="gov-bar-fleur">&#9884;</span>
          <div>
            Essence Québec
            <div className="gov-bar-subtitle">Prix en temps réel des stations-service</div>
          </div>
        </div>
        <div className="gov-bar-filters">
          <SearchWithSuggestions
            search={search}
            onSearchChange={onSearchChange}
            onConfirm={onSearchChange}
            cities={cities}
            cityCounts={cityCounts}
          />
          <select
            className="gov-select"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
          >
            <option value="">Toutes les régions ({totalStations})</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r} ({regionCounts[r] || 0})
              </option>
            ))}
          </select>
          <div className="flex gap-0.5">
            {GAS_TYPES.map((t) => (
              <Button
                key={t.key}
                variant={gasType === t.key ? "default" : "ghost"}
                size="sm"
                className={`text-[13px] font-semibold !text-white !border !border-white/25 ${
                  gasType === t.key
                    ? "!border-transparent"
                    : "!bg-white/12 hover:!bg-white/20"
                }`}
                style={gasType === t.key ? { background: t.color } : undefined}
                onClick={() => onGasTypeChange(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <select
            className="gov-select"
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
          >
            <option value="">Toutes les compagnies ({totalStations})</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b} ({brandCounts[b] || 0})
              </option>
            ))}
          </select>
          <Button
            variant={showFavorites ? "default" : "ghost"}
            size="sm"
            className={`text-[13px] font-semibold !text-white !border !border-white/25 ${
              showFavorites
                ? "!border-transparent !bg-[#ff9800] hover:!bg-[#ff9800]/80"
                : "!bg-white/12 hover:!bg-white/20"
            }`}
            onClick={onToggleFavorites}
          >
            {showFavorites ? <Star className="size-3.5 fill-current" /> : <StarOff className="size-3.5" />}
            Favoris
          </Button>
        </div>
        <div className="gov-bar-right">
          <NavDropdown onChangelogClick={onChangelogClick} />
          {currentUser ? (
            <UserDropdown email={currentUser.email} onLogout={onLogout} />
          ) : (
            <Button variant="link" size="sm" className="text-white/85 hover:text-white text-[13px] font-medium no-underline hover:no-underline" onClick={onLoginClick}>
              <User className="size-3.5" /> Connexion
            </Button>
          )}
        </div>
        <div className="gov-bar-accent" />
      </div>
    </header>
  );
}
