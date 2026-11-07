"use client";

import React from "react";
import { getSmoothStepPath, type ConnectionLineComponentProps } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas-store";
import { findNearestNodeHandle } from "./connector-utils";

export const ConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
  fromNode,
}) => {
  const nodes = useCanvasStore((state) => state.nodes);

  // Check if cursor is within snap radius of a target node handle
  const nearest = findNearestNodeHandle({ x: toX, y: toY }, nodes, fromNode?.id, 70);

  const targetX = nearest ? nearest.position.x : toX;
  const targetY = nearest ? nearest.position.y : toY;

  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX,
    targetY,
    targetPosition: toPosition || fromPosition,
    borderRadius: 8,
  });

  return (
    <g>
      {/* Live connector preview line in neutral dark gray */}
      <path
        fill="none"
        stroke="#454545"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        d={edgePath}
        className="pointer-events-none"
      />

      {/* Target indicator */}
      {nearest ? (
        <g className="pointer-events-none">
          {/* Subtle neutral gray indicator when snapping */}
          <circle
            cx={targetX}
            cy={targetY}
            r={8}
            fill="none"
            stroke="#454545"
            strokeWidth={1.5}
            opacity={0.8}
          />
          <circle
            cx={targetX}
            cy={targetY}
            r={4}
            fill="#454545"
          />
        </g>
      ) : (
        <circle
          cx={toX}
          cy={toY}
          r={3}
          fill="#454545"
          className="pointer-events-none"
        />
      )}
    </g>
  );
};

