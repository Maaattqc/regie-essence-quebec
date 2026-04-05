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

import RegionPricePanel from "@/components/RegionPricePanel";

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
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-71.3, 46.9] },
      properties: {
        Name: "Esso Québec",
        brand: "Esso",
        Address: "300 Ave Test, Québec",
        Region: "Capitale-Nationale",
        Prices: [{ GasType: "Régulier", Price: "163.5", IsAvailable: true }],
        _city: "Québec",
      },
    },
  ],
});

describe("RegionPricePanel", () => {
  const defaultProps = {
    data: makeData(),
    gasType: "Régulier" as const,
    visible: true,
    onClose: vi.fn(),
  };

  it("affiche le titre Prix moyens", () => {
    render(<RegionPricePanel {...defaultProps} />);
    expect(screen.getByText("Prix moyens")).toBeInTheDocument();
  });

  it("affiche le nombre de régions et stations", () => {
    render(<RegionPricePanel {...defaultProps} />);
    expect(screen.getByText(/2 régions · 3 stations/)).toBeInTheDocument();
  });

  it("affiche les noms des régions", () => {
    render(<RegionPricePanel {...defaultProps} />);
    expect(screen.getAllByText("Capitale-Nationale").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Montréal").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche les rangs des régions", () => {
    render(<RegionPricePanel {...defaultProps} />);
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("affiche la moyenne provinciale", () => {
    render(<RegionPricePanel {...defaultProps} />);
    expect(screen.getByText("Moy. provinciale")).toBeInTheDocument();
  });

  it("affiche la moins chère et la plus chère", () => {
    render(<RegionPricePanel {...defaultProps} />);
    expect(screen.getByText("La moins chère")).toBeInTheDocument();
    expect(screen.getByText("La plus chère")).toBeInTheDocument();
  });

  it("Capitale-Nationale est #1 (moins chère)", () => {
    render(<RegionPricePanel {...defaultProps} />);
    // Capitale-Nationale avg = (165.9 + 163.5) / 2 = 164.7
    expect(screen.getAllByText("164.7¢").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche les stats min/max par région", () => {
    render(<RegionPricePanel {...defaultProps} />);
    // Capitale-Nationale min=163.5, max=165.9
    expect(screen.getByText((_, el) =>
      el?.textContent === "Min 163.5¢" || false
    )).toBeInTheDocument();
  });

  it("ne rend rien quand visible=false", () => {
    const { container } = render(
      <RegionPricePanel {...defaultProps} visible={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("appelle onClose quand on clique sur le backdrop", () => {
    render(<RegionPricePanel {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Fermer"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("affiche le bouton Par ville quand onSwitchView est fourni", () => {
    const onSwitchView = vi.fn();
    render(<RegionPricePanel {...defaultProps} onSwitchView={onSwitchView} />);
    const cityBtn = screen.getByText("Par ville");
    fireEvent.click(cityBtn);
    expect(onSwitchView).toHaveBeenCalled();
  });

  it("affiche les onglets de type de carburant", () => {
    render(<RegionPricePanel {...defaultProps} />);
    expect(screen.getAllByText("Régulier").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche l'écart de prix", () => {
    render(<RegionPricePanel {...defaultProps} />);
    // Capitale-Nationale: max - min = 165.9 - 163.5 = 2.4
    expect(screen.getByText((_, el) =>
      el?.textContent === "Écart 2.4¢" || false
    )).toBeInTheDocument();
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
              { GasType: "Diesel", Price: "180.0", IsAvailable: true },
            ],
            _city: "Québec",
          },
        },
      ],
    };

    render(<RegionPricePanel data={dataWithDiesel} gasType="Régulier" visible={true} onClose={vi.fn()} />);

    // Cliquer sur l'onglet Diesel
    const dieselButtons = screen.getAllByText("Diesel");
    fireEvent.click(dieselButtons[0]);

    // Le prix Diesel doit maintenant apparaître
    expect(screen.getAllByText("180.0¢").length).toBeGreaterThanOrEqual(1);
  });

  it("gère les données vides sans erreur", () => {
    const emptyData: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };

    const { container } = render(
      <RegionPricePanel data={emptyData} gasType="Régulier" visible={true} onClose={vi.fn()} />
    );

    // Le panneau s'affiche sans erreur même avec 0 régions
    expect(screen.getByText("Prix moyens")).toBeInTheDocument();
    expect(screen.getByText(/0 régions/)).toBeInTheDocument();
    // Pas de cartes sommaires puisque provAvg = 0
    expect(container.querySelector(".grid")).toBeNull();
  });
});
