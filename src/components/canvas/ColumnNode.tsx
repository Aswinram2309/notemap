"use client";

import React, { useState } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { ColumnNodeData } from "@/types/node";
import { useCanvasStore } from "@/stores/canvas-store";

export const ColumnNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const colData = data as unknown as ColumnNodeData;
  const { updateNodeData } = useCanvasStore();
  const [title, setTitle] = useState(colData.title || "Column");

  return (
    <div
      className={`relative rounded-xl border border-dashed border-[#C4C4BD] bg-[rgba(240,240,235,0.45)] min-w-[260px] min-h-[360px] flex flex-col p-3 transition-colors ${
        selected ? "ring-2 ring-[#8A8178] border-solid" : ""
      }`}
    >
      <NodeResizer
        minWidth={220}
        minHeight={200}
        isVisible={selected}
        lineClassName="!border-[#8A8178]"
        handleClassName="!w-2.5 !h-2.5 !bg-[#FFFFFF] !border !border-[#8A8178] !rounded-xs"
      />

      <div className="pb-2 mb-2 border-b border-[#E5E5E0] flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => updateNodeData(id, { title })}
          placeholder="Column title..."
          className="font-semibold text-xs tracking-wide uppercase text-[#555550] bg-transparent outline-none w-full border-none focus:ring-0"
        />
      </div>

      <div className="flex-1 pointer-events-none" />
    </div>
  );
};
