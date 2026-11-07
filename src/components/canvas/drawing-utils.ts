export interface DrawingPoint {
  x: number;
  y: number;
}

/**
 * Converts an array of 2D canvas-space points into a smooth quadratic bezier SVG path.
 * Uses midpoint interpolation between consecutive points for natural, smooth handwriting.
 */
export function pointsToSmoothPath(points: DrawingPoint[]): string {
  if (!points || points.length === 0) return "";

  if (points.length === 1) {
    // Single tap/dot: draw a tiny segment so rounded linecap renders as a solid circle
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.05} ${points[0].y + 0.05}`;
  }

  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    d += ` Q ${p1.x} ${p1.y}, ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;

  return d;
}

