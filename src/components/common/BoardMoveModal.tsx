"use client";

import React, { useState } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Board } from "@/types/workspace";

interface BoardMoveModalProps {
  isOpen: boolean;
  board: Board | null;
  onClose: () => void;
}

export const BoardMoveModal: React.FC<BoardMoveModalProps> = ({
  isOpen,
  board,
  onClose,
}) => {
  const { workspaces, moveBoard } = useWorkspaceStore();
  const otherWorkspaces = workspaces.filter((w) => w.id !== board?.workspaceId);
  const [targetWsId, setTargetWsId] = useState(otherWorkspaces[0]?.id || "");
  const [isMoving, setIsMoving] = useState(false);

  if (!isOpen || !board) return null;

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWsId) return;

    setIsMoving(true);
    try {
      await moveBoard(board.id, targetWsId);
      onClose();
    } catch (e) {
      console.error("Failed to move board", e);
    } finally {
      setIsMoving(false);
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
            <div className="w-7 h-7 rounded bg-[#F0F0EB] flex items-center justify-center text-[#292929]">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm text-[#292929]">
              Move Board
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

        <form onSubmit={handleMove} className="p-4 flex flex-col gap-3.5">
          <p className="text-xs text-[#292929]">
            Move <span className="font-semibold">&quot;{board.name}&quot;</span> to another workspace:
          </p>

          {otherWorkspaces.length === 0 ? (
            <div className="p-3 bg-[#FAF8F5] border border-[#E5E5E0] rounded-lg text-xs text-[#777777]">
              No other workspaces exist yet. Create another workspace first before moving boards.
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-[#777777] mb-1">
                Target Workspace
              </label>
              <select
                value={targetWsId}
                onChange={(e) => setTargetWsId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-lg outline-none text-[#292929]"
              >
                {otherWorkspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F0EB]">
            <button
              type="button"
              onClick={onClose}
              disabled={isMoving}
              className="px-3 py-1.5 text-xs text-[#777777] hover:text-[#292929] rounded-lg hover:bg-[#F0F0EB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!targetWsId || isMoving || otherWorkspaces.length === 0}
              className="px-3.5 py-1.5 text-xs font-medium bg-[#292929] text-[#FFFFFF] rounded-lg hover:bg-[#454545] disabled:opacity-40 transition-colors cursor-pointer"
            >
              {isMoving ? "Moving..." : "Move Board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

