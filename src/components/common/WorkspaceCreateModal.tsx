"use client";

import React, { useState } from "react";
import {
  X,
  Folder,
  Layers,
  BookOpen,
  Layout,
  Video,
  FolderGit2,
  Code,
  Palette,
  Briefcase,
  Compass,
  FileText,
  CheckSquare,
  Sparkles,
  Hash,
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface WorkspaceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (workspaceId: string) => void;
}

const AVAILABLE_ICONS = [
  { name: "Folder", icon: Folder },
  { name: "Layers", icon: Layers },
  { name: "BookOpen", icon: BookOpen },
  { name: "Layout", icon: Layout },
  { name: "Video", icon: Video },
  { name: "FolderGit2", icon: FolderGit2 },
  { name: "Code", icon: Code },
  { name: "Palette", icon: Palette },
  { name: "Briefcase", icon: Briefcase },
  { name: "Compass", icon: Compass },
  { name: "FileText", icon: FileText },
  { name: "CheckSquare", icon: CheckSquare },
  { name: "Sparkles", icon: Sparkles },
  { name: "Hash", icon: Hash },
];

export const WorkspaceCreateModal: React.FC<WorkspaceCreateModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createWorkspace, createNewBoard, loadBoardById } = useWorkspaceStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Folder");
  const [createInitialBoard, setCreateInitialBoard] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const ws = await createWorkspace(name.trim(), description.trim(), selectedIcon);

    if (createInitialBoard) {
      // Create initial main board for this workspace
      const board = await createNewBoard(ws.id, `${ws.name} Board`, "Main workspace board");
      await loadBoardById(board.id);
    }

    setName("");
    setDescription("");
    setSelectedIcon("Folder");
    onClose();

    if (onCreated) {
      onCreated(ws.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292929]/25 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E5E0] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#F0F0EB] flex items-center justify-center text-[#292929]">
              <Folder className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm text-[#292929]">
              Create Workspace
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#777777] hover:text-[#292929] p-1 rounded hover:bg-[#F0F0EB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#777777] mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. YouTube, College Notes, Game Design..."
              className="w-full px-2.5 py-1.5 text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg outline-none text-[#292929] placeholder:text-[#A0A09B] focus:border-[#8A8178]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#777777] mb-1.5">
              Workspace Icon (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg max-h-28 overflow-y-auto">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIcon(item.name)}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#292929] text-[#FFFFFF] shadow-2xs scale-105"
                        : "text-[#777777] hover:bg-[#E9E9E3] hover:text-[#292929]"
                    }`}
                    title={item.name}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#777777] mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this workspace be used for?"
              className="w-full px-2.5 py-1.5 text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg outline-none text-[#292929] placeholder:text-[#A0A09B] resize-none focus:border-[#8A8178]"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={createInitialBoard}
              onChange={(e) => setCreateInitialBoard(e.target.checked)}
              className="rounded border-[#C4C4BD] text-[#292929] focus:ring-0"
            />
            <span className="text-xs text-[#555550]">
              Create an initial board automatically
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F0EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#777777] hover:text-[#292929] rounded-lg hover:bg-[#F0F0EB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-3.5 py-1.5 text-xs font-medium bg-[#292929] text-[#FFFFFF] rounded-lg hover:bg-[#454545] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

