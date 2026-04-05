import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockDisable = vi.fn();
const mockEnable = vi.fn();

vi.mock("react-leaflet", () => ({
  useMap: () => ({
    dragging: {
      disable: mockDisable,
      enable: mockEnable,
    },
  }),
}));

let capturedOnValueChange: ((v: number[] | number) => void) | null = null;

vi.mock("@/components/ui/slider", () => ({
  Slider: ({
    value,
    onValueChange,
    ...props
  }: {
    value: number[];
    onValueChange: (v: number[] | number) => void;
    min: number;
    max: number;
    step: number;
    className?: string;
  }) => {
    capturedOnValueChange = onValueChange;
    return (
      <input
        type="range"
        data-testid="radius-slider"
        value={value[0]}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={(e) => onValueChange([Number(e.target.value)])}
      />
    );
  },
}));

import RadiusSlider from "@/components/RadiusSlider";

describe("RadiusSlider", () => {
  it("affiche le rayon en km", () => {
    render(<RadiusSlider radiusKm={10} onChange={vi.fn()} />);
    expect(screen.getByText("Rayon : 10 km")).toBeInTheDocument();
  });

  it("affiche Tout quand rayon=0", () => {
    render(<RadiusSlider radiusKm={0} onChange={vi.fn()} />);
    expect(screen.getByText("Rayon : Tout")).toBeInTheDocument();
  });

  it("affiche le slider", () => {
    render(<RadiusSlider radiusKm={25} onChange={vi.fn()} />);
    expect(screen.getByTestId("radius-slider")).toBeInTheDocument();
  });

  it("passe la valeur au slider", () => {
    render(<RadiusSlider radiusKm={30} onChange={vi.fn()} />);
    const slider = screen.getByTestId("radius-slider") as HTMLInputElement;
    expect(slider.value).toBe("30");
  });

  it("affiche le rayon max 50", () => {
    render(<RadiusSlider radiusKm={50} onChange={vi.fn()} />);
    expect(screen.getByText("Rayon : 50 km")).toBeInTheDocument();
  });

  it("désactive le drag de la carte sur mouseDown et le réactive sur mouseUp", () => {
    render(<RadiusSlider radiusKm={10} onChange={vi.fn()} />);
    const container = screen.getByText("Rayon : 10 km").closest(".radius-panel")!;

    fireEvent.mouseDown(container);
    expect(mockDisable).toHaveBeenCalled();

    fireEvent.mouseUp(container);
    expect(mockEnable).toHaveBeenCalled();
  });

  it("désactive le drag de la carte sur touchStart et le réactive sur touchEnd", () => {
    mockDisable.mockClear();
    mockEnable.mockClear();

    render(<RadiusSlider radiusKm={10} onChange={vi.fn()} />);
    const container = screen.getByText("Rayon : 10 km").closest(".radius-panel")!;

    fireEvent.touchStart(container);
    expect(mockDisable).toHaveBeenCalled();

    fireEvent.touchEnd(container);
    expect(mockEnable).toHaveBeenCalled();
  });

  it("appelle onChange quand le slider change de valeur (tableau)", () => {
    const handleChange = vi.fn();
    render(<RadiusSlider radiusKm={10} onChange={handleChange} />);

    const slider = screen.getByTestId("radius-slider");
    fireEvent.change(slider, { target: { value: "20" } });

    expect(handleChange).toHaveBeenCalledWith(20);
  });

  it("appelle onChange quand onValueChange reçoit un scalaire", () => {
    const handleChange = vi.fn();
    render(<RadiusSlider radiusKm={10} onChange={handleChange} />);

    // Appeler directement onValueChange avec un scalaire pour couvrir la branche non-array
    capturedOnValueChange!(15 as unknown as number);

    expect(handleChange).toHaveBeenCalledWith(15);
  });
});
