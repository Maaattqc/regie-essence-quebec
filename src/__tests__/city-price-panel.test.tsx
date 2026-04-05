import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props as Record<string, unknown>;
      void initial; void animate; void exit; void transition;
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

import CityPricePanel from "@/components/CityPricePanel";

const makeData = (): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-71.2, 46.8] },
      properties: {
        Name: "Shell Québec",
        brand: "Shell",
        Address: "100 Rue Test, Québec",
        Region: "Capitale-Nationale",
        Prices: [{ GasType: "Régulier", Price: "165.9", IsAvailable: true }],
        _city: "Québec",
        _cityNorm: "quebec",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-73.5, 45.5] },
      properties: {
        Name: "Petro Montréal",
        brand: "Petro-Canada",
        Address: "200 Boul Test, Montréal",
        Region: "Montréal",
        Prices: [{ GasType: "Régulier", Price: "172.9", IsAvailable: true }],
        _city: "Montréal",
        _cityNorm: "montreal",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-73.6, 45.6] },
      properties: {
        Name: "Esso Laval",
        brand: "Esso",
        Address: "300 Ave Test, Laval",
        Region: "Laval",
        Prices: [{ GasType: "Régulier", Price: "168.5", IsAvailable: true }],
        _city: "Laval",
        _cityNorm: "laval",
      },
    },
  ],
});

describe("CityPricePanel", () => {
  const defaultProps = {
    data: makeData(),
    gasType: "Régulier" as const,
    visible: true,
    onClose: vi.fn(),
  };

  it("affiche le titre Prix moyens", () => {
    render(<CityPricePanel {...defaultProps} />);
    expect(screen.getByText("Prix moyens")).toBeInTheDocument();
  });

  it("affiche le nombre de villes", () => {
    render(<CityPricePanel {...defaultProps} />);
    expect(screen.getByText(/3 \/ 3 ville/)).toBeInTheDocument();
  });

  it("affiche les noms des villes", () => {
    render(<CityPricePanel {...defaultProps} />);
    expect(screen.getAllByText("Québec").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Montréal").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Laval").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche les prix moyens des villes", () => {
    render(<CityPricePanel {...defaultProps} />);
    expect(screen.getAllByText("165.9¢").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("172.9¢").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("168.5¢").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche la moyenne provinciale", () => {
    render(<CityPricePanel {...defaultProps} />);
    expect(screen.getByText("Moyenne provinciale")).toBeInTheDocument();
  });

  it("affiche le top 3 moins chères", () => {
    render(<CityPricePanel {...defaultProps} />);
    expect(screen.getByText("Top 3 moins chères")).toBeInTheDocument();
  });

  it("ne rend rien quand visible=false", () => {
    const { container } = render(
      <CityPricePanel {...defaultProps} visible={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("appelle onClose quand on clique sur le backdrop", () => {
    render(<CityPricePanel {...defaultProps} />);
    const backdrop = screen.getByLabelText("Fermer");
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("filtre les villes par recherche", () => {
    render(<CityPricePanel {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Rechercher une ville...");
    fireEvent.change(searchInput, { target: { value: "Québec" } });
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
  });

  it("affiche les onglets de type de carburant", () => {
    render(<CityPricePanel {...defaultProps} />);
    expect(screen.getAllByText("Régulier").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le nombre de stations par ville", () => {
    render(<CityPricePanel {...defaultProps} />);
    expect(screen.getAllByText("1 station").length).toBe(3);
  });

  it("affiche le bouton Par région quand onSwitchView est fourni", () => {
    const onSwitchView = vi.fn();
    render(<CityPricePanel {...defaultProps} onSwitchView={onSwitchView} />);
    const regionBtn = screen.getByText("Par région");
    fireEvent.click(regionBtn);
    expect(onSwitchView).toHaveBeenCalled();
  });

  // ── Tri ──

  it("trie par prix décroissant quand on sélectionne 'Prix ↓'", () => {
    render(<CityPricePanel {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue("Prix ↑");
    fireEvent.change(sortSelect, { target: { value: "price-desc" } });
    // Montréal (172.9) doit apparaître avant Laval (168.5) avant Québec (165.9)
    const items = screen.getAllByText(/¢$/).filter((el) => el.classList.contains("font-bold"));
    const prices = items.map((el) => parseFloat(el.textContent!));
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
    }
  });

  it("trie par nom A→Z quand on sélectionne 'Ville A→Z'", () => {
    render(<CityPricePanel {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue("Prix ↑");
    fireEvent.change(sortSelect, { target: { value: "name-asc" } });
    // Les lignes de la liste contiennent chacune le nom de la ville en font-semibold
    const rows = document.querySelectorAll(".text-\\[13px\\].font-semibold.truncate");
    const cityNames = Array.from(rows).map((el) => el.textContent!);
    expect(cityNames).toEqual(["Laval", "Montréal", "Québec"]);
  });

  it("trie par nom Z→A quand on sélectionne 'Ville Z→A'", () => {
    render(<CityPricePanel {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue("Prix ↑");
    fireEvent.change(sortSelect, { target: { value: "name-desc" } });
    const rows = document.querySelectorAll(".text-\\[13px\\].font-semibold.truncate");
    const cityNames = Array.from(rows).map((el) => el.textContent!);
    expect(cityNames).toEqual(["Québec", "Montréal", "Laval"]);
  });

  it("trie par delta croissant (moins cher vs moy.)", () => {
    render(<CityPricePanel {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue("Prix ↑");
    fireEvent.change(sortSelect, { target: { value: "delta-asc" } });
    // Le moins cher vs moyenne doit être en premier (Québec 165.9)
    const items = screen.getAllByText(/¢$/).filter((el) => el.classList.contains("font-bold"));
    const prices = items.map((el) => parseFloat(el.textContent!));
    expect(prices[0]).toBeLessThanOrEqual(prices[prices.length - 1]);
  });

  it("trie par delta décroissant (plus cher vs moy.)", () => {
    render(<CityPricePanel {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue("Prix ↑");
    fireEvent.change(sortSelect, { target: { value: "delta-desc" } });
    const items = screen.getAllByText(/¢$/).filter((el) => el.classList.contains("font-bold"));
    const prices = items.map((el) => parseFloat(el.textContent!));
    expect(prices[0]).toBeGreaterThanOrEqual(prices[prices.length - 1]);
  });

  it("trie par nombre de stations décroissant", () => {
    render(<CityPricePanel {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue("Prix ↑");
    fireEvent.change(sortSelect, { target: { value: "count-desc" } });
    // Chaque ville a 1 station, l'ordre ne change pas mais le tri est exercé
    expect(screen.getAllByText("1 station").length).toBe(3);
  });

  // ── Filtre par région ──

  it("filtre les villes par région", () => {
    render(<CityPricePanel {...defaultProps} />);
    const regionSelect = screen.getByDisplayValue("Toutes les régions");
    fireEvent.change(regionSelect, { target: { value: "Montréal" } });
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
    // Seule Montréal apparaît dans les lignes de la liste
    const rows = document.querySelectorAll(".text-\\[13px\\].font-semibold.truncate");
    const cityNames = Array.from(rows).map((el) => el.textContent!);
    expect(cityNames).toEqual(["Montréal"]);
  });

  it("affiche 'Aucune ville trouvée' quand la recherche ne matche rien", () => {
    render(<CityPricePanel {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Rechercher une ville...");
    fireEvent.change(searchInput, { target: { value: "XYZNONEXISTENT" } });
    expect(screen.getByText("Aucune ville trouvée.")).toBeInTheDocument();
  });

  it("change de type de carburant quand on clique sur un onglet", () => {
    const dataWithDiesel: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-71.2, 46.8] },
          properties: {
            Name: "Shell Québec",
            brand: "Shell",
            Address: "100 Rue Test, Québec",
            Region: "Capitale-Nationale",
            Prices: [
              { GasType: "Régulier", Price: "165.9", IsAvailable: true },
              { GasType: "Diesel", Price: "175.9", IsAvailable: true },
            ],
            _city: "Québec",
            _cityNorm: "quebec",
          },
        },
      ],
    };

    render(<CityPricePanel data={dataWithDiesel} gasType="Régulier" visible={true} onClose={vi.fn()} />);

    // Cliquer sur l'onglet Diesel
    const dieselButtons = screen.getAllByText("Diesel");
    fireEvent.click(dieselButtons[0]);

    // Le prix Diesel doit maintenant apparaître dans les lignes
    expect(screen.getAllByText("175.9¢").length).toBeGreaterThanOrEqual(1);
  });
});
