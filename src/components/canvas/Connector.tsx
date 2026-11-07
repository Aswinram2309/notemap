"use client";

import React, { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { X, ArrowLeftRight, Edit2 } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

export const Connector: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState((label as string) || "");
  const [isHovered, setIsHovered] = useState(false);

  const { updateEdgeLabel, deleteEdge, flipEdgeDirection } = useCanvasStore();

  const handleBlur = () => {
    setIsEditing(false);
    updateEdgeLabel(id, labelText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      updateEdgeLabel(id, labelText);
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setLabelText((label as string) || "");
    }
  };

  const strokeColor = selected ? "#292929" : isHovered ? "#777777" : "#454545";
  const strokeWidth = selected ? 2 : 1.5;

  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: strokeColor,
            strokeWidth,
            transition: "stroke 0.15s ease, stroke-width 0.15s ease",
          }}
        />
        {/* Invisible wider hit area for easy hover/selection */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          className="cursor-pointer"
        />

        {/* Small endpoint handles when selected (for visual feedback and reconnection) */}
        {selected && (
          <g className="pointer-events-none">
            <circle
              cx={sourceX}
              cy={sourceY}
              r={4}
              fill="#FFFFFF"
              stroke="#454545"
              strokeWidth={1.5}
            />
            <circle
              cx={targetX}
              cy={targetY}
              r={4}
              fill="#FFFFFF"
              stroke="#454545"
              strokeWidth={1.5}
            />
          </g>
        )}
      </g>

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="flex items-center gap-1 group bg-[#FFFFFF] border border-[#E5E5E0] rounded shadow-xs px-1 py-0.5"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="px-1 py-0.2 text-[10px] bg-[#FFFFFF] border border-[#8A8178] rounded outline-none text-[#292929] min-w-[50px]"
            />
          ) : labelText ? (
            <span
              onDoubleClick={() => setIsEditing(true)}
              className="px-1 py-0.2 text-[10px] text-[#292929] cursor-pointer hover:text-[#454545] select-none font-medium"
              title="Double click to edit label"
            >
              {labelText}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-[9px] text-[#777777] hover:text-[#292929] px-1 py-0.2"
              title="Add label"
            >
              + label
            </button>
          )}

          {/* Quick controls on hover or selected */}
          {(isHovered || selected) && (
            <div className="flex items-center gap-0.5 pl-1 border-l border-[#F0F0EB]">
              {!isEditing && labelText && (
                <button
                  type="button"
                  title="Edit label"
                  onClick={() => setIsEditing(true)}
                  className="p-0.5 text-[#777777] hover:text-[#292929] rounded"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
              )}

              <button
                type="button"
                title="Reverse connector direction"
                onClick={(e) => {
                  e.stopPropagation();
                  flipEdgeDirection(id);
                }}
                className="p-0.5 text-[#777777] hover:text-[#292929] rounded"
              >
                <ArrowLeftRight className="w-2.5 h-2.5" />
              </button>

              <button
                type="button"
                title="Delete connector"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEdge(id);
                }}
                className="p-0.5 text-[#777777] hover:text-[#8A4A4A] rounded"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
