"use client";

import React from "react";
import { Check } from "lucide-react";

export const NEUTRAL_PALETTE = [
  { name: "White", value: "#FFFFFF", border: "#E5E5E0" },
  { name: "Warm Cream", value: "#FAF8F5", border: "#EBE6DF" },
  { name: "Light Sand", value: "#F4F1EA", border: "#E5DFD4" },
  { name: "Soft Sage", value: "#EDF1EC", border: "#DEE5DD" },
  { name: "Muted Gray", value: "#EFEFEF", border: "#E0E0E0" },
  { name: "Dusty Rose", value: "#F5ECEB", border: "#EADADA" },
];

interface ColorPickerProps {
  currentColor?: string;
  onSelectColor: (color: string) => void;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor = "#FFFFFF",
  onSelectColor,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-1.5 p-1 bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg shadow-sm ${className}`}>
      {NEUTRAL_PALETTE.map((swatch) => {
        const isSelected = (currentColor || "#FFFFFF").toUpperCase() === swatch.value.toUpperCase();
        return (
          <button
            key={swatch.value}
            type="button"
            title={swatch.name}
            onClick={(e) => {
              e.stopPropagation();
              onSelectColor(swatch.value);
            }}
            className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
            style={{
              backgroundColor: swatch.value,
              border: `1.5px solid ${swatch.border}`,
            }}
          >
            {isSelected && <Check className="w-3 h-3 text-[#292929]" strokeWidth={2.5} />}
          </button>
        );
      })}
    </div>
  );
};
