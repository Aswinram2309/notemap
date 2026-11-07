"use client";

import React, { useState } from "react";
import { type NodeProps } from "@xyflow/react";
import { NodeHandles } from "./NodeHandles";
import { FileText, Download, Upload } from "lucide-react";
import { FileNodeData } from "@/types/node";
import { useCanvasStore } from "@/stores/canvas-store";
import { downloadFile } from "@/lib/export";

export const FileNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const fileData = data as unknown as FileNodeData;
  const { updateNodeData, selectNode } = useCanvasStore();

  const [description, setDescription] = useState(fileData.description || "");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateNodeData(id, {
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        fileData: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (fileData.fileData) {
      const a = document.createElement("a");
      a.href = fileData.fileData;
      a.download = fileData.fileName || "attachment";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      downloadFile("NoteMap file attachment placeholder", fileData.fileName || "note.txt", "text/plain");
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      className={`group relative rounded-lg border border-[#D5D5CF] bg-[#FFFFFF] shadow-sm hover:shadow-md transition-shadow text-[#292929] select-none min-w-[220px] p-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing ${
        selected ? "ring-2 ring-[#8A8178] shadow-md" : ""
      }`}
    >
      <NodeHandles />

      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded bg-[#F0F0EB] flex items-center justify-center text-[#292929] shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#292929] truncate" title={fileData.fileName}>
            {fileData.fileName || "No file attached"}
          </p>
          <p className="text-[10px] text-[#777777]">
            {formatSize(fileData.fileSize || 0)}
          </p>
        </div>
      </div>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => updateNodeData(id, { description })}
        placeholder="Add note or description..."
        className="w-full text-[11px] text-[#777777] bg-transparent outline-none border-b border-[#F0F0EB] pb-1 focus:text-[#292929]"
      />

      <div className="flex items-center justify-between pt-1">
        <label className="text-[10px] text-[#777777] hover:text-[#292929] flex items-center gap-1 cursor-pointer">
          <Upload className="w-3 h-3" />
          <span>Replace</span>
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>

        <button
          type="button"
          onClick={handleDownload}
          className="text-[10px] text-[#292929] font-medium bg-[#F0F0EB] hover:bg-[#E9E9E3] px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};
