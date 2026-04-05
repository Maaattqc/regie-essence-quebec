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

vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange, ...props }: { value: number[]; onValueChange: (v: number[]) => void } & Record<string, unknown>) => (
    <input
      type="range"
      value={value[0]}
      onChange={(e) => onValueChange([Number(e.target.value), value[1]])}
      data-testid="slider"
      {...props}
    />
  ),
}));

import PricePanel from "@/components/PricePanel";

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
        Prices: [
          { GasType: "Régulier", Price: "165.9", IsAvailable: true },
          { GasType: "Super 91", Price: "185.9", IsAvailable: true },
        ],
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
        Prices: [
          { GasType: "Régulier", Price: "172.9", IsAvailable: true },
          { GasType: "Super 91", Price: "192.9", IsAvailable: true },
        ],
        _city: "Montréal",
        _cityNorm: "montreal",
      },
    },
  ],
});

describe("PricePanel", () => {
  const defaultProps = {
    data: makeData(),
    gasType: "Régulier" as const,
    visible: true,
    onClose: vi.fn(),
  };

  it("affiche le titre Prix moyens", () => {
    render(<PricePanel {...defaultProps} />);
    expect(screen.getByText("Prix moyens")).toBeInTheDocument();
  });

  it("affiche les 3 vues : Par région, Par ville, Comparer", () => {
    render(<PricePanel {...defaultProps} />);
    expect(screen.getByText("Par région")).toBeInTheDocument();
    expect(screen.getByText("Par ville")).toBeInTheDocument();
    expect(screen.getByText(/Comparer/)).toBeInTheDocument();
  });

  it("commence en vue région", () => {
    render(<PricePanel {...defaultProps} />);
    expect(screen.getByText(/régions/)).toBeInTheDocument();
  });

  it("switch vers la vue ville quand on clique", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Par ville"));
    expect(screen.getByText(/villes/)).toBeInTheDocument();
  });

  it("affiche les moyennes provinciales pour chaque type", () => {
    render(<PricePanel {...defaultProps} />);
    // Les cartes de type de carburant montrent les moyennes
    expect(screen.getAllByText("Régulier").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Super").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Diesel").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche les noms des régions en vue région", () => {
    render(<PricePanel {...defaultProps} />);
    expect(screen.getAllByText("Capitale-Nationale").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Montréal").length).toBeGreaterThanOrEqual(1);
  });

  it("ne rend rien quand visible=false", () => {
    const { container } = render(
      <PricePanel {...defaultProps} visible={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("appelle onClose quand on clique sur le backdrop", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Fermer"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("affiche le message vide en vue comparer sans sélection", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.click(screen.getByText(/Comparer/));
    expect(screen.getByText(/Cliquez sur des régions ou villes/)).toBeInTheDocument();
  });

  it("affiche le champ de recherche", () => {
    render(<PricePanel {...defaultProps} />);
    expect(screen.getByPlaceholderText("Rechercher une région...")).toBeInTheDocument();
  });

  it("filtre les résultats par recherche", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText("Rechercher une région..."), {
      target: { value: "Montréal" },
    });
    expect(screen.getByText(/1 \/ 2 régions/)).toBeInTheDocument();
  });

  it("affiche le nombre de stations dans les lignes", () => {
    render(<PricePanel {...defaultProps} />);
    expect(screen.getAllByText(/station/).length).toBeGreaterThanOrEqual(1);
  });

  // ── Vue Comparer ──

  it("ajoute une région au compare set et affiche le tableau de comparaison", () => {
    render(<PricePanel {...defaultProps} />);
    // En vue région, cliquer sur une ligne pour l'ajouter au compare set
    const capitaleRow = screen.getByText("Capitale-Nationale").closest("[class*='rounded-lg']");
    expect(capitaleRow).toBeTruthy();
    fireEvent.click(capitaleRow!);

    const montrealRow = screen.getByText("Montréal").closest("[class*='rounded-lg']");
    expect(montrealRow).toBeTruthy();
    fireEvent.click(montrealRow!);

    // Aller dans la vue comparer
    fireEvent.click(screen.getByText(/Comparer/));

    // Le header indique "2 sélectionnés"
    expect(screen.getByText("2 sélectionnés")).toBeInTheDocument();

    // Le tableau de comparaison est rendu avec les en-têtes
    expect(screen.getByText("Lieu")).toBeInTheDocument();
    expect(screen.getByText("Stations")).toBeInTheDocument();

    // Le bloc "Le moins cher" apparaît quand 2+ items sont comparés
    expect(screen.getByText(/Le moins cher pour/)).toBeInTheDocument();
  });

  // ── Bouton filtres ──

  it("affiche le panneau de filtres au clic sur le bouton SlidersHorizontal", () => {
    render(<PricePanel {...defaultProps} />);
    // Le bouton filtres est un Button variant="outline" contenant SlidersHorizontal
    // Il est le seul small outline button next to the search
    const filterButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg") && btn.textContent === ""
    );
    // Le bouton SlidersHorizontal est le dernier bouton icône dans la zone de recherche
    const filterBtn = filterButtons.find((btn) => btn.className.includes("h-8"));
    expect(filterBtn).toBeTruthy();
    fireEvent.click(filterBtn!);

    // Le panneau de filtres s'affiche avec le texte "Prix entre"
    expect(screen.getByText(/Prix entre/)).toBeInTheDocument();

    // Le slider de prix est rendu
    expect(screen.getByTestId("slider")).toBeInTheDocument();

    // Le select de tri est rendu dans les filtres
    expect(screen.getByDisplayValue("Prix croissant")).toBeInTheDocument();
  });

  // ── Compare: cheapest highlight avec diff > 0 ──

  it("affiche le bloc 'Le moins cher' avec la différence de prix en vue comparer", () => {
    render(<PricePanel {...defaultProps} />);

    // Sélectionner les deux régions
    const capitaleRow = screen.getByText("Capitale-Nationale").closest("[class*='rounded-lg']");
    fireEvent.click(capitaleRow!);
    const montrealRow = screen.getByText("Montréal").closest("[class*='rounded-lg']");
    fireEvent.click(montrealRow!);

    // Aller en vue comparer
    fireEvent.click(screen.getByText(/Comparer/));

    // Le bloc cheapest doit afficher le nom de la région la moins chère
    expect(screen.getByText(/Le moins cher pour/)).toBeInTheDocument();
    // Capitale-Nationale (165.9) est moins chère que Montréal (172.9), diff = 7.0¢
    expect(screen.getByText(/de moins que/)).toBeInTheDocument();
  });

  it("permet de retirer un item du compare set via le bouton X dans le tableau", () => {
    render(<PricePanel {...defaultProps} />);

    // Sélectionner les deux régions
    const capitaleRow = screen.getByText("Capitale-Nationale").closest("[class*='rounded-lg']");
    fireEvent.click(capitaleRow!);
    const montrealRow = screen.getByText("Montréal").closest("[class*='rounded-lg']");
    fireEvent.click(montrealRow!);

    // Aller en vue comparer
    fireEvent.click(screen.getByText(/Comparer/));
    expect(screen.getByText("2 sélectionnés")).toBeInTheDocument();

    // Cliquer sur le X de la première ligne du tableau
    const removeButtons = screen.getAllByRole("button").filter(
      (btn) => btn.closest("td") && btn.querySelector("svg")
    );
    fireEvent.click(removeButtons[0]);

    expect(screen.getByText("1 sélectionnés")).toBeInTheDocument();
  });

  // ── Vue ville avec filtre région ──

  it("affiche le filtre par région en vue ville avec filtres ouverts", () => {
    render(<PricePanel {...defaultProps} />);

    // Passer en vue ville
    fireEvent.click(screen.getByText("Par ville"));

    // Ouvrir les filtres
    const filterButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg") && btn.textContent === ""
    );
    const filterBtn = filterButtons.find((btn) => btn.className.includes("h-8"));
    fireEvent.click(filterBtn!);

    // Le select de filtre par région doit apparaître
    expect(screen.getByDisplayValue("Toutes les régions")).toBeInTheDocument();
  });

  it("filtre par région en vue ville", () => {
    render(<PricePanel {...defaultProps} />);

    // Passer en vue ville
    fireEvent.click(screen.getByText("Par ville"));

    // Ouvrir les filtres
    const filterButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg") && btn.textContent === ""
    );
    const filterBtn = filterButtons.find((btn) => btn.className.includes("h-8"));
    fireEvent.click(filterBtn!);

    // Sélectionner Montréal dans le filtre région
    const regionSelect = screen.getByDisplayValue("Toutes les régions");
    fireEvent.change(regionSelect, { target: { value: "Montréal" } });

    // Seule 1 ville sur 2 doit être affichée
    expect(screen.getByText(/1 \/ 2 villes/)).toBeInTheDocument();
  });

  // ── Options de tri en vue ville ──

  it("trie par prix décroissant en vue ville", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Par ville"));

    // Ouvrir les filtres
    const filterButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg") && btn.textContent === ""
    );
    const filterBtn = filterButtons.find((btn) => btn.className.includes("h-8"));
    fireEvent.click(filterBtn!);

    // Changer le tri
    const sortSelect = screen.getByDisplayValue("Prix croissant");
    fireEvent.change(sortSelect, { target: { value: "price-desc" } });

    // Montréal (172.9) doit être avant Québec (165.9)
    const rows = document.querySelectorAll(".text-\\[13px\\].font-semibold.truncate");
    const names = Array.from(rows).map((el) => el.textContent!);
    expect(names[0]).toBe("Montréal");
  });

  it("trie par nom A-Z en vue ville", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Par ville"));

    const filterButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg") && btn.textContent === ""
    );
    const filterBtn = filterButtons.find((btn) => btn.className.includes("h-8"));
    fireEvent.click(filterBtn!);

    const sortSelect = screen.getByDisplayValue("Prix croissant");
    fireEvent.change(sortSelect, { target: { value: "name-asc" } });

    const rows = document.querySelectorAll(".text-\\[13px\\].font-semibold.truncate");
    const names = Array.from(rows).map((el) => el.textContent!);
    expect(names[0]).toBe("Montréal");
    expect(names[1]).toBe("Québec");
  });

  it("trie par nom Z-A en vue ville", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Par ville"));

    const filterButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg") && btn.textContent === ""
    );
    const filterBtn = filterButtons.find((btn) => btn.className.includes("h-8"));
    fireEvent.click(filterBtn!);

    const sortSelect = screen.getByDisplayValue("Prix croissant");
    fireEvent.change(sortSelect, { target: { value: "name-desc" } });

    const rows = document.querySelectorAll(".text-\\[13px\\].font-semibold.truncate");
    const names = Array.from(rows).map((el) => el.textContent!);
    expect(names[0]).toBe("Québec");
    expect(names[1]).toBe("Montréal");
  });

  it("trie par delta croissant (moins cher vs moy.) en vue ville", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Par ville"));

    const filterButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg") && btn.textContent === ""
    );
    const filterBtn = filterButtons.find((btn) => btn.className.includes("h-8"));
    fireEvent.click(filterBtn!);

    const sortSelect = screen.getByDisplayValue("Prix croissant");
    fireEvent.change(sortSelect, { target: { value: "delta-asc" } });

    // Québec (165.9) a le delta le plus négatif, doit être en premier
    const rows = document.querySelectorAll(".text-\\[13px\\].font-semibold.truncate");
    const names = Array.from(rows).map((el) => el.textContent!);
    expect(names[0]).toBe("Québec");
  });

  it("trie par delta décroissant (plus cher vs moy.) en vue ville", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Par ville"));

    const filterButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg") && btn.textContent === ""
    );
    const filterBtn = filterButtons.find((btn) => btn.className.includes("h-8"));
    fireEvent.click(filterBtn!);

    const sortSelect = screen.getByDisplayValue("Prix croissant");
    fireEvent.change(sortSelect, { target: { value: "delta-desc" } });

    // Montréal (172.9) a le delta le plus positif, doit être en premier
    const rows = document.querySelectorAll(".text-\\[13px\\].font-semibold.truncate");
    const names = Array.from(rows).map((el) => el.textContent!);
    expect(names[0]).toBe("Montréal");
  });

  it("trie par nombre de stations décroissant en vue ville", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Par ville"));

    const filterButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg") && btn.textContent === ""
    );
    const filterBtn = filterButtons.find((btn) => btn.className.includes("h-8"));
    fireEvent.click(filterBtn!);

    const sortSelect = screen.getByDisplayValue("Prix croissant");
    fireEvent.change(sortSelect, { target: { value: "count-desc" } });

    // Chaque ville a 1 station, vérifier que le tri fonctionne sans erreur
    expect(screen.getAllByText(/station/).length).toBeGreaterThanOrEqual(1);
  });

  it("affiche 'Aucun résultat trouvé' quand la recherche ne matche rien", () => {
    render(<PricePanel {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText("Rechercher une région..."), {
      target: { value: "XYZNONEXISTENT" },
    });
    expect(screen.getByText("Aucun résultat trouvé.")).toBeInTheDocument();
  });
});
