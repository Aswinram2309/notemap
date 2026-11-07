"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "N", description: "Create a note" },
    { key: "T", description: "Create a to-do card" },
    { key: "L", description: "Create a link card" },
    { key: "Delete / Backspace", description: "Delete selected items" },
    { key: "Ctrl / ⌘ + Z", description: "Undo" },
    { key: "Ctrl / ⌘ + Shift + Z", description: "Redo" },
    { key: "Ctrl / ⌘ + S", description: "Trigger a save" },
    { key: "Ctrl / ⌘ + F", description: "Open global search" },
    { key: "Escape", description: "Cancel current operation / Close modal" },
    { key: "Ctrl / ⌘ + D", description: "Duplicate selected item" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292929]/25 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E5E0] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#F0F0EB] flex items-center justify-center text-[#292929]">
              <Keyboard className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm text-[#292929]">
              Keyboard Shortcuts & Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#777777] hover:text-[#292929] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          <div className="flex flex-col divide-y divide-[#F0F0EB]">
            {shortcuts.map((sc) => (
              <div
                key={sc.key}
                className="py-2 flex items-center justify-between text-xs"
              >
                <span className="text-[#555550]">{sc.description}</span>
                <kbd className="px-2 py-1 bg-[#FAFAF8] border border-[#E5E5E0] rounded font-mono text-[11px] text-[#292929] shadow-2xs">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-[#FAF8F5] border border-[#E5E5E0] rounded-lg text-[11px] text-[#777777] leading-relaxed">
            <p className="font-semibold text-[#292929] mb-1">Navigation Tips:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Drag the canvas to pan. Pinch or use mouse wheel to zoom.</li>
              <li>Drag connectors from dots on any card side to build visual roadmaps.</li>
              <li>Right-click any card to open the context menu.</li>
              <li>Shortcuts are disabled when typing inside note or card editors.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
