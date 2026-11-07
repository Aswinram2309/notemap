"use client";

import React, { useEffect, useRef } from "react";
import {
  Copy,
  CopyPlus,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  FileDown,
  Palette,
} from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";
import { ColorPicker } from "../common/ColorPicker";
import { exportNoteToMarkdown } from "@/lib/export";

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeType: string;
  onClose: () => void;
  onEdit?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  nodeId,
  nodeType,
  onClose,
  onEdit,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showPalette, setShowPalette] = React.useState(false);

  const {
    nodes,
    duplicateNode,
    deleteNode,
    bringToFront,
    sendToBack,
    copyNode,
    updateNodeColor,
  } = useCanvasStore();

  const currentNode = nodes.find((n) => n.id === nodeId);
  const currentColor = (currentNode?.data as any)?.color || "#FFFFFF";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Adjust positioning so menu stays inside viewport
  const adjustedX = Math.min(x, typeof window !== "undefined" ? window.innerWidth - 220 : x);
  const adjustedY = Math.min(y, typeof window !== "undefined" ? window.innerHeight - 320 : y);

  return (
    <div
      ref={menuRef}
      style={{ top: adjustedY, left: adjustedX }}
      className="fixed z-50 min-w-[200px] bg-[#FFFFFF] border border-[#E5E5E0] rounded-lg shadow-lg py-1.5 text-xs text-[#292929] animate-in fade-in zoom-in-95 duration-100"
    >
      {onEdit && (
        <button
          type="button"
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#F0F0EB] transition-colors"
        >
          <span>Edit content</span>
          <span className="text-[10px] text-[#777777]">Double click</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          copyNode(nodeId);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F0F0EB] transition-colors"
      >
        <Copy className="w-3.5 h-3.5 text-[#777777]" />
        <span>Copy</span>
      </button>

      <button
        type="button"
        onClick={() => {
          duplicateNode(nodeId);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#F0F0EB] transition-colors"
      >
        <div className="flex items-center gap-2">
          <CopyPlus className="w-3.5 h-3.5 text-[#777777]" />
          <span>Duplicate</span>
        </div>
        <span className="text-[10px] text-[#777777]">Ctrl+D</span>
      </button>

      <div className="h-px bg-[#E5E5E0] my-1" />

      {/* Change color option */}
      <div className="px-3 py-1">
        <button
          type="button"
          onClick={() => setShowPalette(!showPalette)}
          className="w-full text-left flex items-center justify-between hover:text-[#292929] text-[#777777]"
        >
          <div className="flex items-center gap-2 text-[#292929]">
            <Palette className="w-3.5 h-3.5 text-[#777777]" />
            <span>Card Color</span>
          </div>
          <div
            className="w-3.5 h-3.5 rounded-full border border-[#E5E5E0]"
            style={{ backgroundColor: currentColor }}
          />
        </button>
        {showPalette && (
          <div className="mt-2">
            <ColorPicker
              currentColor={currentColor}
              onSelectColor={(color) => {
                updateNodeColor(nodeId, color);
                onClose();
              }}
            />
          </div>
        )}
      </div>

      <div className="h-px bg-[#E5E5E0] my-1" />

      <button
        type="button"
        onClick={() => {
          bringToFront(nodeId);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F0F0EB] transition-colors"
      >
        <ArrowUpToLine className="w-3.5 h-3.5 text-[#777777]" />
        <span>Bring to front</span>
      </button>

      <button
        type="button"
        onClick={() => {
          sendToBack(nodeId);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F0F0EB] transition-colors"
      >
        <ArrowDownToLine className="w-3.5 h-3.5 text-[#777777]" />
        <span>Send to back</span>
      </button>

      {nodeType === "note" && currentNode && (
        <>
          <div className="h-px bg-[#E5E5E0] my-1" />
          <button
            type="button"
            onClick={() => {
              exportNoteToMarkdown({
                id: currentNode.id,
                boardId: "",
                type: "note",
                position: currentNode.position,
                data: currentNode.data as any,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F0F0EB] transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-[#777777]" />
            <span>Export as Markdown</span>
          </button>
        </>
      )}

      <div className="h-px bg-[#E5E5E0] my-1" />

      <button
        type="button"
        onClick={() => {
          deleteNode(nodeId);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#8A4A4A] hover:bg-[#F5ECEB] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </div>
        <span className="text-[10px] opacity-70">Del</span>
      </button>
    </div>
  );
};
