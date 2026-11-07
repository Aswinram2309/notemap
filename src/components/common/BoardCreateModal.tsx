"use client";

import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useCanvasStore } from "@/stores/canvas-store";

interface BoardCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  createAsNestedCard?: boolean;
}

export const BoardCreateModal: React.FC<BoardCreateModalProps> = ({
  isOpen,
  onClose,
  createAsNestedCard = false,
}) => {
  const {
    workspaces,
    activeWorkspaceId,
    activeBoard,
    createNewBoard,
    loadBoardById,
  } = useWorkspaceStore();

  const { setBoard, addNode } = useCanvasStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWsId, setSelectedWsId] = useState(activeWorkspaceId || workspaces[0]?.id || "");

  React.useEffect(() => {
    if (activeWorkspaceId) {
      setSelectedWsId(activeWorkspaceId);
    } else if (workspaces[0]) {
      setSelectedWsId(workspaces[0].id);
    }
  }, [activeWorkspaceId, workspaces, isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parentId = createAsNestedCard && activeBoard ? activeBoard.id : null;
    const newBoard = await createNewBoard(
      selectedWsId,
      name.trim(),
      description.trim(),
      parentId
    );

    if (createAsNestedCard) {
      // Add a Board card on the current canvas
      await addNode("board", undefined, {
        targetBoardId: newBoard.id,
        title: newBoard.name,
        description: newBoard.description,
      });
    } else {
      // Switch directly to the new board
      await loadBoardById(newBoard.id);
      await setBoard(newBoard.id);
    }

    setName("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292929]/25 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E5E0] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#F0F0EB] flex items-center justify-center text-[#292929]">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm text-[#292929]">
              {createAsNestedCard ? "Create Nested Board Card" : "Create New Board"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#777777] hover:text-[#292929] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-4 flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#777777] mb-1">
              Workspace
            </label>
            <select
              value={selectedWsId}
              onChange={(e) => setSelectedWsId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg outline-none text-[#292929]"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#777777] mb-1">
              Board Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ARG Episode 4 Lore, Level 2 Dungeon..."
              className="w-full px-2.5 py-1.5 text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg outline-none text-[#292929] placeholder:text-[#A0A09B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#777777] mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this board focus on?"
              className="w-full px-2.5 py-1.5 text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg outline-none text-[#292929] placeholder:text-[#A0A09B] resize-none"
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
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
