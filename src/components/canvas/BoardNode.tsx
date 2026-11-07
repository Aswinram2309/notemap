"use client";

import React, { useState } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { NodeHandles } from "./NodeHandles";
import { Folder, ArrowRight, Layers } from "lucide-react";
import { BoardNodeData } from "@/types/node";
import { useCanvasStore } from "@/stores/canvas-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export const BoardNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const boardData = data as unknown as BoardNodeData;
  const { updateNodeData, selectNode, setBoard } = useCanvasStore();
  const { loadBoardById } = useWorkspaceStore();

  const [title, setTitle] = useState(boardData.title || "Sub-Board");
  const [description, setDescription] = useState(boardData.description || "");

  const handleOpenBoard = async () => {
    if (!boardData.targetBoardId) return;
    await loadBoardById(boardData.targetBoardId);
    await setBoard(boardData.targetBoardId);
  };

  const handleBlur = () => {
    updateNodeData(id, { title, description });
  };

  const cardBg = boardData.color || "#FFFFFF";

  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest(".react-flow__handle")) return;
        selectNode(id);
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest(".react-flow__handle")) return;
        selectNode(id);
        handleOpenBoard();
      }}
      style={{ backgroundColor: cardBg }}
      className={`group relative rounded-lg border border-[#D5D5CF] bg-[#FFFFFF] shadow-sm hover:shadow-md transition-shadow text-[#292929] select-none min-h-[110px] flex flex-col cursor-grab active:cursor-grabbing ${
        selected ? "ring-2 ring-[#8A8178] shadow-md" : ""
      }`}
    >
      <NodeResizer
        minWidth={200}
        minHeight={100}
        isVisible={selected}
        lineClassName="!border-[#8A8178]"
        handleClassName="!w-2 !h-2 !bg-[#FFFFFF] !border !border-[#8A8178] !rounded-xs"
      />

      <NodeHandles />

      {/* Header */}
      <div className="p-3 pb-2 border-b border-[#F0F0EB] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F0F0EB] flex items-center justify-center text-[#292929]">
            <Folder className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-medium tracking-wider uppercase text-[#777777]">
            Nested Board
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenBoard}
          title="Open board canvas"
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-[#292929] text-[#FFFFFF] hover:bg-[#454545] transition-colors"
        >
          <span>Open</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            placeholder="Board title..."
            className="font-medium text-xs text-[#292929] bg-transparent outline-none w-full border-none focus:ring-0 placeholder:text-[#A0A09B]"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleBlur}
            placeholder="Description..."
            className="text-[11px] text-[#777777] bg-transparent outline-none w-full border-none focus:ring-0 placeholder:text-[#A0A09B] mt-0.5"
          />
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-[#777777]">
          <Layers className="w-3 h-3" />
          <span>Double-click to drill down</span>
        </div>
      </div>
    </div>
  );
};
