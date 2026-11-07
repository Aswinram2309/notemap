"use client";

import React from "react";
import {
  MousePointer,
  StickyNote,
  Link as LinkIcon,
  CheckSquare,
  Spline,
  Folder,
  Columns,
  MessageSquare,
  Table as TableIcon,
  Image as ImageIcon,
  Paperclip,
  PenTool,
  Trash2,
} from "lucide-react";
import { useCanvasStore, ActiveTool } from "@/stores/canvas-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { CanvasNodeType } from "@/types/node";

interface ToolItem {
  id: ActiveTool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  nodeType?: CanvasNodeType;
  action?: () => void;
}

interface CanvasToolbarProps {
  onOpenCreateBoardModal?: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onOpenCreateBoardModal,
}) => {
  const {
    activeTool,
    setTool,
    addNode,
    deleteSelected,
    selectedNodeIds,
  } = useCanvasStore();

  const { activeWorkspaceId, createNewBoard } = useWorkspaceStore();

  const handleToolClick = async (tool: ToolItem) => {
    if (activeTool === tool.id && (tool.id === "line" || tool.id === "draw")) {
      setTool("select");
      return;
    }

    if (tool.id === "trash") {
      deleteSelected();
      return;
    }

    if (tool.id === "line") {
      // Line tool mode active: user can manually draw connections between notes (Milanote style)
      setTool("line");
      return;
    }

    if (tool.id === "draw") {
      // Real freehand pen mode
      setTool("draw");
      return;
    }

    // Creating any card sets tool to "select" so the canvas remains fully draggable and interactive!
    setTool("select");

    if (tool.id === "board") {
      if (onOpenCreateBoardModal) {
        onOpenCreateBoardModal();
      } else if (activeWorkspaceId) {
        const board = await createNewBoard(activeWorkspaceId, "New Sub-Board");
        await addNode("board", undefined, {
          targetBoardId: board.id,
          title: board.name,
        });
      }
      return;
    }

    if (tool.nodeType) {
      await addNode(tool.nodeType);
    }
  };

  const onDragStart = (e: React.DragEvent, nodeType: CanvasNodeType) => {
    e.dataTransfer.setData("application/notemap-node-type", nodeType);
    e.dataTransfer.effectAllowed = "move";
  };

  const tools: ToolItem[] = [
    { id: "select", label: "Select", icon: MousePointer },
    { id: "note", label: "Note", icon: StickyNote, nodeType: "note" },
    { id: "link", label: "Link", icon: LinkIcon, nodeType: "link" },
    { id: "todo", label: "To-do", icon: CheckSquare, nodeType: "todo" },
    { id: "line", label: "Line", icon: Spline },
    { id: "board", label: "Board", icon: Folder, nodeType: "board" },
    { id: "column", label: "Column", icon: Columns, nodeType: "column" },
    { id: "comment", label: "Comment", icon: MessageSquare, nodeType: "comment" },
    { id: "table", label: "Table", icon: TableIcon, nodeType: "table" },
    { id: "image", label: "Image", icon: ImageIcon, nodeType: "image" },
    { id: "file", label: "Upload", icon: Paperclip, nodeType: "file" },
    { id: "draw", label: "Draw", icon: PenTool },
    {
      id: "trash",
      label: "Trash",
      icon: Trash2,
      action: deleteSelected,
    },
  ];

  return (
    <aside
      className="fixed left-3 top-1/2 -translate-y-1/2 z-40 bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl shadow-sm py-2 px-1.5 flex flex-col items-center gap-1 select-none backdrop-blur-xs max-h-[92vh] overflow-y-auto"
      aria-label="Canvas creation toolbar"
    >
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        const isTrash = t.id === "trash";
        const hasSelection = selectedNodeIds.length > 0;

        return (
          <button
            key={t.id}
            type="button"
            draggable={!!t.nodeType}
            onDragStart={(e) => t.nodeType && onDragStart(e, t.nodeType)}
            onClick={() => handleToolClick(t)}
            title={
              isTrash
                ? hasSelection
                  ? `Delete ${selectedNodeIds.length} selected items`
                  : "Trash / Delete selected"
                : `${t.label} (Click or drag onto canvas)`
            }
            className={`w-11 h-11 flex flex-col items-center justify-center rounded-lg transition-all relative group cursor-pointer ${
              isActive && !isTrash
                ? "bg-[#E9E9E3] text-[#292929] shadow-2xs font-medium"
                : "text-[#555550] hover:bg-[#F0F0EB] hover:text-[#292929]"
            } ${isTrash && hasSelection ? "text-[#8A4A4A] hover:bg-[#F5ECEB]" : ""}`}
          >
            <Icon className="w-4 h-4 mb-0.5 shrink-0 stroke-[1.6]" />
            <span className="text-[9px] font-medium tracking-tight leading-none text-[#777777] group-hover:text-[#292929]">
              {t.label}
            </span>

            {/* Subtle drag hint tooltip */}
            {t.nodeType && (
              <span className="absolute left-full ml-2 px-2 py-0.5 bg-[#292929] text-[#FFFFFF] text-[10px] rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm z-50">
                Add {t.label} (Drag or Click)
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
};
