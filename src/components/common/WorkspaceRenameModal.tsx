"use client";

import React, { useState } from "react";
import { X, Edit2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Workspace } from "@/types/workspace";

interface WorkspaceRenameModalProps {
  isOpen: boolean;
  workspace: Workspace | null;
  onClose: () => void;
}

const WorkspaceRenameForm: React.FC<{
  workspace: Workspace;
  onClose: () => void;
}> = ({ workspace, onClose }) => {
  const { renameWorkspace } = useWorkspaceStore();
  const [name, setName] = useState(workspace.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await renameWorkspace(workspace.id, name.trim());
    onClose();
  };

  return (
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
          className="w-full px-2.5 py-1.5 text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg outline-none text-[#292929] focus:border-[#8A8178]"
        />
      </div>

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
          className="px-3.5 py-1.5 text-xs font-medium bg-[#292929] text-[#FFFFFF] rounded-lg hover:bg-[#454545] disabled:opacity-40 transition-colors"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export const WorkspaceRenameModal: React.FC<WorkspaceRenameModalProps> = ({
  isOpen,
  workspace,
  onClose,
}) => {
  if (!isOpen || !workspace) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292929]/25 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E5E0] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#F0F0EB] flex items-center justify-center text-[#292929]">
              <Edit2 className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm text-[#292929]">
              Rename Workspace
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

        <WorkspaceRenameForm
          key={workspace.id}
          workspace={workspace}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
