import { Node } from "@xyflow/react";

export interface NearestHandleResult {
  nodeId: string;
  handleId: "top" | "right" | "bottom" | "left";
  position: { x: number; y: number };
  distance: number;
}

export function getNodeDimensions(node: Node): { width: number; height: number } {
  const width =
    typeof node.style?.width === "number"
      ? node.style.width
      : typeof (node as any).measured?.width === "number"
      ? (node as any).measured.width
      : typeof node.width === "number"
      ? node.width
      : 260;

  const height =
    typeof node.style?.height === "number"
      ? node.style.height
      : typeof (node as any).measured?.height === "number"
      ? (node as any).measured.height
      : typeof node.height === "number"
      ? node.height
      : 140;

  return { width, height };
}

export function getNodeHandles(
  node: Node
): Array<{ id: "top" | "right" | "bottom" | "left"; x: number; y: number }> {
  const { width, height } = getNodeDimensions(node);
  const nx = node.position.x;
  const ny = node.position.y;

  return [
    { id: "top", x: nx + width / 2, y: ny },
    { id: "right", x: nx + width, y: ny + height / 2 },
    { id: "bottom", x: nx + width / 2, y: ny + height },
    { id: "left", x: nx, y: ny + height / 2 },
  ];
}

/**
 * Detects the nearest valid connection handle on any node within snapRadius.
 * Also checks if the point falls inside the node bounds (in which case it snaps to closest edge handle).
 */
export function findNearestNodeHandle(
  point: { x: number; y: number },
  nodes: Node[],
  excludeNodeId?: string | null,
  snapRadius: number = 75
): NearestHandleResult | null {
  let closest: NearestHandleResult | null = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    if (excludeNodeId && node.id === excludeNodeId) continue;
    // Skip column containers from line snapping
    if (node.type === "column") continue;

    const { width, height } = getNodeDimensions(node);
    const nx = node.position.x;
    const ny = node.position.y;

    // Check if cursor is directly inside the node
    const isInside =
      point.x >= nx &&
      point.x <= nx + width &&
      point.y >= ny &&
      point.y <= ny + height;

    const handles = getNodeHandles(node);

    for (const h of handles) {
      const dx = point.x - h.x;
      const dy = point.y - h.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // If inside node, give a distance bonus to snap immediately to the closest edge
      const effectiveDist = isInside ? Math.min(dist, snapRadius * 0.5) : dist;

      if (effectiveDist < minDistance && (isInside || dist <= snapRadius)) {
        minDistance = effectiveDist;
        closest = {
          nodeId: node.id,
          handleId: h.id,
          position: { x: h.x, y: h.y },
          distance: dist,
        };
      }
    }
  }

  return closest;
}

