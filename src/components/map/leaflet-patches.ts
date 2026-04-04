import L from "leaflet";

// Fix Chrome subpixel rendering gaps between tiles (desktop only)
// Sur mobile, les transforms 3D sont nécessaires pour synchroniser
// les marqueurs avec le pan tactile du GPU
if (typeof window !== "undefined" && !("ontouchstart" in window)) {
  (L.Browser as Record<string, unknown>).any3d = false;
}

// Patch removeChild pour éviter le crash React/Leaflet quand les deux
// manipulent le DOM en même temps (race condition sur changement de région)
if (typeof window !== "undefined") {
  const origRemoveChild = Node.prototype.removeChild;

  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) return child;
    return origRemoveChild.call(this, child) as T;
  };
}
