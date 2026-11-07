"use client";

import React, { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { TopBar } from "@/components/layout/TopBar";
import { CanvasToolbar } from "@/components/canvas/CanvasToolbar";
import { InfiniteCanvas } from "@/components/canvas/InfiniteCanvas";
import { SearchDialog } from "@/components/common/SearchDialog";
import { BoardCreateModal } from "@/components/common/BoardCreateModal";
import { WorkspaceCreateModal } from "@/components/common/WorkspaceCreateModal";
import { KeyboardShortcutsModal } from "@/components/common/KeyboardShortcutsModal";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { Folder, Plus } from "lucide-react";

function WorkspaceContent() {
  const {
    workspaces,
    boards,
    fetchWorkspaces,
    loadBoardById,
    isLoading,
  } = useWorkspaceStore();

  const { setBoard, currentBoardId } = useCanvasStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNestedCardCreation, setIsNestedCardCreation] = useState(false);

  // Initialize DB and workspaces on client mount
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Restore last accessed board on initial load or reload
  useEffect(() => {
    if (boards.length > 0) {
      const savedLastId =
        typeof window !== "undefined"
          ? localStorage.getItem("notemap_active_board")
          : null;
      const matched = savedLastId
        ? boards.find((b) => b.id === savedLastId)
        : null;
      const targetBoard = matched || boards[0];

      if (targetBoard && targetBoard.id !== currentBoardId) {
        loadBoardById(targetBoard.id);
        setBoard(targetBoard.id);
      }
    }
  }, [boards, currentBoardId, loadBoardById, setBoard]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#EAEAE6]">
      {/* Top Navigation Bar */}
      <TopBar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCreateBoard={() => {
          setIsNestedCardCreation(false);
          setIsCreateBoardOpen(true);
        }}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenCreateWorkspace={() => setIsCreateWsOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        {!isLoading && workspaces.length === 0 ? (
          /* Empty state when no workspaces exist (Requirement 5) */
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#EAEAE6] select-none text-center p-6 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] flex items-center justify-center text-[#292929] mb-4 shadow-xs">
              <Folder className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h1 className="text-lg font-semibold text-[#292929] mb-1.5">
              No workspaces yet
            </h1>
            <p className="text-xs text-[#777777] max-w-sm mb-6 leading-relaxed">
              Create a workspace to organize your notes, research, diagrams, and projects.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateWsOpen(true)}
              className="px-4 py-2 bg-[#292929] text-[#FFFFFF] text-xs font-medium rounded-lg hover:bg-[#454545] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workspace</span>
            </button>
          </div>
        ) : (
          <>
            {/* Left Vertical Toolbar matching reference */}
            <CanvasToolbar
              onOpenCreateBoardModal={() => {
                setIsNestedCardCreation(true);
                setIsCreateBoardOpen(true);
              }}
            />

            {/* Canvas Engine */}
            <InfiniteCanvas
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenCreateBoard={() => {
                setIsNestedCardCreation(false);
                setIsCreateBoardOpen(true);
              }}
            />
          </>
        )}
      </main>

      {/* Modals and Overlays */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <WorkspaceCreateModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
      />

      <BoardCreateModal
        isOpen={isCreateBoardOpen}
        onClose={() => setIsCreateBoardOpen(false)}
        createAsNestedCard={isNestedCardCreation}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <ReactFlowProvider>
      <WorkspaceContent />
    </ReactFlowProvider>
  );
}
