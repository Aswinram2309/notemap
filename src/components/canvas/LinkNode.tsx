"use client";

import React, { useState } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { NodeHandles } from "./NodeHandles";
import { ExternalLink, Globe, Video, FileCode, Copy, Trash2, GripVertical } from "lucide-react";
import { LinkNodeData } from "@/types/node";
import { useCanvasStore } from "@/stores/canvas-store";

export const LinkNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const linkData = data as unknown as LinkNodeData;
  const { updateNodeData, duplicateNode, deleteNode, selectNode } = useCanvasStore();

  const [url, setUrl] = useState(linkData.url || "");
  const [title, setTitle] = useState(linkData.title || "");
  const [description, setDescription] = useState(linkData.description || "");

  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const isGithub = url.includes("github.com");

  const handleBlur = () => {
    let cleanUrl = url.trim();
    if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
      setUrl(cleanUrl);
    }
    updateNodeData(id, { url: cleanUrl, title, description });
  };

  const cardBg = linkData.color || "#FFFFFF";

  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("a") || target.closest(".react-flow__handle")) return;
        selectNode(id);
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("a") || target.closest(".react-flow__handle")) return;
        selectNode(id);
      }}
      style={{ backgroundColor: cardBg }}
      className={`group relative rounded-lg border border-[#D5D5CF] bg-[#FFFFFF] shadow-sm hover:shadow-md transition-shadow text-[#292929] select-none min-h-[110px] flex flex-col cursor-grab active:cursor-grabbing ${
        selected ? "ring-2 ring-[#8A8178] shadow-md" : ""
      }`}
    >
      <NodeResizer
        minWidth={220}
        minHeight={100}
        isVisible={selected}
        lineClassName="!border-[#8A8178]"
        handleClassName="!w-2 !h-2 !bg-[#FFFFFF] !border !border-[#8A8178] !rounded-xs"
      />

      <NodeHandles />

      {/* Header */}
      <div className="p-2.5 pb-2 border-b border-[#F0F0EB] flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-[#A0A09B] hover:text-[#292929] shrink-0" />
          {isYouTube ? (
            <Video className="w-4 h-4 text-[#777777] shrink-0" />
          ) : isGithub ? (
            <FileCode className="w-4 h-4 text-[#777777] shrink-0" />
          ) : (
            <Globe className="w-4 h-4 text-[#777777] shrink-0" />
          )}
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#777777] truncate">
            {isYouTube ? "YouTube" : isGithub ? "GitHub" : "Web Resource"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open link in new tab"
              className="p-1 text-[#777777] hover:text-[#292929] hover:bg-[#F0F0EB] rounded transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              title="Duplicate link card"
              onClick={(e) => {
                e.stopPropagation();
                duplicateNode(id);
              }}
              className="p-1 text-[#777777] hover:text-[#292929] hover:bg-[#F0F0EB] rounded cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              type="button"
              title="Delete link card"
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(id);
              }}
              className="p-1 text-[#777777] hover:text-[#8A4A4A] hover:bg-[#F5ECEB] rounded cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlur}
          placeholder="Resource title..."
          className="font-medium text-xs text-[#292929] bg-transparent outline-none w-full border-none focus:ring-0 placeholder:text-[#A0A09B]"
        />

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleBlur}
          placeholder="https://example.com"
          className="text-[11px] text-[#777777] bg-transparent outline-none w-full border-none focus:ring-0 font-mono truncate"
        />

        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleBlur}
          placeholder="Optional notes or summary..."
          className="w-full text-[11px] text-[#777777] bg-transparent outline-none resize-none placeholder:text-[#A0A09B] mt-1 leading-normal"
        />
      </div>
    </div>
  );
};
