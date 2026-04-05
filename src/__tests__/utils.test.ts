import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("retourne une seule classe inchangée", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("fusionne plusieurs classes", () => {
    expect(cn("text-red-500", "bg-blue-200")).toBe("text-red-500 bg-blue-200");
  });

  it("ignore les valeurs false et undefined", () => {
    expect(cn("text-red-500", false && "hidden", undefined, "mt-2")).toBe(
      "text-red-500 mt-2",
    );
  });

  it("résout les conflits Tailwind (p-2 + p-4 donne p-4)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("accepte un tableau de classes", () => {
    expect(cn(["flex", "items-center"])).toBe("flex items-center");
  });

  it("retourne une chaîne vide sans arguments", () => {
    expect(cn()).toBe("");
  });
});
