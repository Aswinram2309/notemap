"use client";

import React, { useState } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { NodeHandles } from "./NodeHandles";
import { Image as ImageIcon, Upload, Link as LinkIcon } from "lucide-react";
import { ImageNodeData } from "@/types/node";
import { useCanvasStore } from "@/stores/canvas-store";

export const ImageNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const imgData = data as unknown as ImageNodeData;
  const { updateNodeData, selectNode } = useCanvasStore();

  const [caption, setCaption] = useState(imgData.caption || "");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateNodeData(id, { url: result, caption: file.name });
      setCaption(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      updateNodeData(id, { url: urlInput.trim() });
      setShowUrlInput(false);
      setUrlInput("");
    }
  };

  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("label") || target.closest(".react-flow__handle")) return;
        selectNode(id);
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("label") || target.closest(".react-flow__handle")) return;
        selectNode(id);
      }}
      className={`group relative rounded-lg border border-[#D5D5CF] bg-[#FFFFFF] shadow-sm hover:shadow-md transition-shadow text-[#292929] select-none min-w-[200px] min-h-[160px] flex flex-col overflow-hidden cursor-grab active:cursor-grabbing ${
        selected ? "ring-2 ring-[#8A8178] shadow-md" : ""
      }`}
    >
      <NodeResizer
        minWidth={180}
        minHeight={140}
        isVisible={selected}
        lineClassName="!border-[#8A8178]"
        handleClassName="!w-2 !h-2 !bg-[#FFFFFF] !border !border-[#8A8178] !rounded-xs"
      />

      <NodeHandles />

      {/* Image container */}
      <div className="relative flex-1 bg-[#EAEAE6] flex items-center justify-center min-h-[120px] overflow-hidden group/img">
        {imgData.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgData.url}
            alt={caption || "Visual Reference"}
            className="w-full h-full object-cover max-h-[380px]"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-[#777777]">
            <ImageIcon className="w-8 h-8 text-[#A0A09B]" />
            <span className="text-xs">No image loaded</span>
          </div>
        )}

        {/* Hover upload / link controls */}
        <div className="absolute inset-0 bg-[#292929]/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2">
          <label className="p-1.5 bg-[#FFFFFF] hover:bg-[#F0F0EB] text-[#292929] rounded cursor-pointer shadow text-[10px] flex items-center gap-1 font-medium">
            <Upload className="w-3 h-3" />
            <span>Upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="p-1.5 bg-[#FFFFFF] hover:bg-[#F0F0EB] text-[#292929] rounded shadow text-[10px] flex items-center gap-1 font-medium"
          >
            <LinkIcon className="w-3 h-3" />
            <span>URL</span>
          </button>
        </div>
      </div>

      {showUrlInput && (
        <div className="p-2 bg-[#FAFAF8] border-b border-[#E5E5E0] flex items-center gap-1">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            placeholder="Paste image URL..."
            className="flex-1 text-xs px-2 py-1 bg-[#FFFFFF] border border-[#E5E5E0] rounded outline-none"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-2 py-1 text-xs bg-[#292929] text-[#FFFFFF] rounded font-medium"
          >
            Set
          </button>
        </div>
      )}

      {/* Caption footer */}
      <div className="p-2 border-t border-[#F0F0EB] bg-[#FFFFFF]">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => updateNodeData(id, { caption })}
          placeholder="Add caption..."
          className="w-full text-[11px] text-[#777777] bg-transparent outline-none border-none p-0 focus:text-[#292929]"
        />
      </div>
    </div>
  );
};
