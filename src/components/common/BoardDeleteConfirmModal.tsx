"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Board } from "@/types/workspace";

interface BoardDeleteConfirmModalProps {
  isOpen: boolean;
  board: Board | null;
  onClose: () => void;
}

export const BoardDeleteConfirmModal: React.FC<BoardDeleteConfirmModalProps> = ({
  isOpen,
  board,
  onClose,
}) => {
  const { deleteBoard } = useWorkspaceStore();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !board) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBoard(board.id);
      onClose();
    } catch (e) {
      console.error("Failed to delete board", e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292929]/25 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E5E0] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#F5ECEB] flex items-center justify-center text-[#8A4A4A]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm text-[#292929]">
              Delete Board
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

        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-[#292929] leading-relaxed">
            Are you sure you want to delete the board <span className="font-semibold">&quot;{board.name}&quot;</span>?
          </p>

          <p className="text-xs text-[#777777] leading-relaxed">
            This will permanently delete this board and all of its notes, tasks, images, and connectors.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F0EB]">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-3 py-1.5 text-xs text-[#777777] hover:text-[#292929] rounded-lg hover:bg-[#F0F0EB]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 py-1.5 text-xs font-medium bg-[#8A4A4A] text-[#FFFFFF] rounded-lg hover:bg-[#723B3B] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Delete Board"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

