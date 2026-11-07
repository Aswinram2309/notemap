"use client";

import React, { useState } from "react";
import { type NodeProps } from "@xyflow/react";
import { NodeHandles } from "./NodeHandles";
import { MessageSquare } from "lucide-react";
import { CommentNodeData } from "@/types/node";
import { useCanvasStore } from "@/stores/canvas-store";

export const CommentNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const commentData = data as unknown as CommentNodeData;
  const { updateNodeData, selectNode } = useCanvasStore();

  const [author, setAuthor] = useState(commentData.author || "Comment");
  const [text, setText] = useState(commentData.text || "");

  const handleBlur = () => {
    updateNodeData(id, { author, text });
  };

  const cardBg = commentData.color || "#FAF8F5";

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
      }}
      style={{ backgroundColor: cardBg }}
      className={`group relative rounded-md border border-[#D5D5CF] shadow-sm hover:shadow-md transition-shadow text-[#292929] select-none max-w-[240px] p-2.5 flex flex-col gap-1.5 cursor-grab active:cursor-grabbing ${
        selected ? "ring-2 ring-[#8A8178]" : ""
      }`}
    >
      <NodeHandles />

      <div className="flex items-center gap-1.5 text-[10px] text-[#777777] border-b border-[#F0F0EB] pb-1 cursor-grab active:cursor-grabbing">
        <MessageSquare className="w-3 h-3 text-[#777777]" />
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          onBlur={handleBlur}
          placeholder="Author..."
          className="nodrag font-medium text-[10px] text-[#777777] bg-transparent outline-none w-full border-none focus:ring-0"
        />
      </div>

      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder="Type a comment or note..."
        className="w-full text-xs text-[#292929] bg-transparent outline-none resize-none leading-relaxed placeholder:text-[#A0A09B]"
      />
    </div>
  );
};
