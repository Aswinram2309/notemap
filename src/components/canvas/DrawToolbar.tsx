"use client";

import React from "react";
import { Pen, Eraser, Check, Trash2 } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

const PEN_COLORS = [
  { label: "Charcoal", value: "#292929" },
  { label: "Slate", value: "#555550" },
  { label: "Warm Gray", value: "#8A8178" },
  { label: "Muted Olive", value: "#747A65" },
  { label: "Terracotta", value: "#8A4A4A" },
  { label: "White", value: "#FFFFFF" },
];

const STROKE_WIDTHS = [
  { label: "Fine", value: 1.5, dotSize: 3 },
  { label: "Medium", value: 2.5, dotSize: 5 },
  { label: "Thick", value: 4, dotSize: 7 },
  { label: "Broad", value: 6, dotSize: 9 },
];

export const DrawToolbar: React.FC = () => {
  const {
    activeTool,
    setTool,
    activeDrawColor,
    setActiveDrawColor,
    activeDrawWidth,
    setActiveDrawWidth,
    isEraserActive,
    setIsEraserActive,
    clearDrawings,
    drawings,
  } = useCanvasStore();

  if (activeTool !== "draw") return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl shadow-lg p-1.5 flex items-center gap-2 select-none animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xs">
      {/* Tool Mode: Pen vs Eraser */}
      <div className="flex items-center gap-0.5 bg-[#F0F0EB] p-0.5 rounded-lg">
        <button
          type="button"
          onClick={() => setIsEraserActive(false)}
          title="Freehand Pen"
          className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer ${
            !isEraserActive
              ? "bg-[#FFFFFF] text-[#292929] shadow-2xs"
              : "text-[#777777] hover:text-[#292929]"
          }`}
        >
          <Pen className="w-3.5 h-3.5" />
          <span className="text-[11px]">Pen</span>
        </button>

        <button
          type="button"
          onClick={() => setIsEraserActive(true)}
          title="Stroke Eraser (Click a stroke to erase)"
          className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer ${
            isEraserActive
              ? "bg-[#FFFFFF] text-[#292929] shadow-2xs"
              : "text-[#777777] hover:text-[#292929]"
          }`}
        >
          <Eraser className="w-3.5 h-3.5" />
          <span className="text-[11px]">Eraser</span>
        </button>
      </div>

      <div className="w-px h-5 bg-[#E5E5E0]" />

      {/* Thickness Selector */}
      {!isEraserActive && (
        <>
          <div className="flex items-center gap-1 px-1">
            {STROKE_WIDTHS.map((sw) => {
              const isSelected = activeDrawWidth === sw.value;
              return (
                <button
                  key={sw.value}
                  type="button"
                  onClick={() => setActiveDrawWidth(sw.value)}
                  title={`${sw.label} (${sw.value}px)`}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#E9E9E3] text-[#292929]"
                      : "hover:bg-[#F0F0EB] text-[#777777]"
                  }`}
                >
                  <span
                    className="rounded-full bg-current"
                    style={{ width: sw.dotSize, height: sw.dotSize }}
                  />
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-[#E5E5E0]" />

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 px-1">
            {PEN_COLORS.map((c) => {
              const isSelected = activeDrawColor === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setActiveDrawColor(c.value)}
                  title={c.label}
                  className={`w-5 h-5 rounded-full border transition-transform cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? "scale-115 ring-2 ring-[#8A8178] border-[#292929]"
                      : "border-[#DEDEDA] hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {isSelected && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        c.value === "#FFFFFF" ? "bg-[#292929]" : "bg-[#FFFFFF]"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-[#E5E5E0]" />
        </>
      )}

      {/* Clear all drawings on this board */}
      {drawings.length > 0 && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Clear all drawings on this board?")) {
              clearDrawings();
            }
          }}
          title="Clear all drawings"
          className="p-1.5 text-[#777777] hover:text-[#8A4A4A] hover:bg-[#F5ECEB] rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Done button */}
      <button
        type="button"
        onClick={() => setTool("select")}
        className="px-2.5 py-1 text-xs font-medium bg-[#292929] text-[#FFFFFF] rounded-lg hover:bg-[#454545] transition-colors flex items-center gap-1 cursor-pointer"
      >
        <Check className="w-3 h-3" />
        <span>Done</span>
      </button>
    </div>
  );
};

