"use client";

import React, { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  Undo2,
  Redo2,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Upload,
  ChevronDown,
  Layers,
  FolderPlus,
  HelpCircle,
  Database,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Folder,
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { exportBoardToJson, exportAllDataBackup, importBoardFromJson } from "@/lib/export";
import { Workspace, Board } from "@/types/workspace";
import { WorkspaceCreateModal } from "../common/WorkspaceCreateModal";
import { WorkspaceRenameModal } from "../common/WorkspaceRenameModal";
import { WorkspaceDeleteConfirmModal } from "../common/WorkspaceDeleteConfirmModal";
import { BoardMoveModal } from "../common/BoardMoveModal";
import { BoardDeleteConfirmModal } from "../common/BoardDeleteConfirmModal";

interface TopBarProps {
  onOpenSearch: () => void;
  onOpenCreateBoard: () => void;
  onOpenShortcuts: () => void;
  onOpenCreateWorkspace?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSearch,
  onOpenCreateBoard,
  onOpenShortcuts,
}) => {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const currentZoom = Math.round((getZoom ? getZoom() : 1) * 100);
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    boards,
    activeBoard,
    renameBoard,
    loadBoardById,
  } = useWorkspaceStore();

  const {
    saveStatus,
    undo,
    redo,
    undoStack,
    redoStack,
    saveCurrentState,
    setBoard,
  } = useCanvasStore();

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState(activeBoard?.name || "");

  // Modal states
  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [renamingWs, setRenamingWs] = useState<Workspace | null>(null);
  const [deletingWs, setDeletingWs] = useState<Workspace | null>(null);
  const [movingBoard, setMovingBoard] = useState<Board | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (activeBoard && boardTitle.trim()) {
      renameBoard(activeBoard.id, boardTitle.trim());
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result as string;
        const imported = await importBoardFromJson(result, activeWorkspaceId || undefined);
        await loadBoardById(imported.boardId);
        await setBoard(imported.boardId);
        setShowExportMenu(false);
      } catch (err: any) {
        alert(err.message || "Failed to import board");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="h-12 border-b border-[#E5E5E0] bg-[#FAFAF8] px-3 flex items-center justify-between select-none z-40 relative">
        {/* Left section: Logo + Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* App Logo & Name */}
          <div className="flex items-center gap-2 pr-2 border-r border-[#E5E5E0]">
            <div className="w-6 h-6 rounded bg-[#292929] flex items-center justify-center text-[#FFFFFF]">
              <Layers className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <span className="font-semibold text-xs tracking-tight text-[#292929]">
              NoteMap
            </span>
          </div>

          {/* Workspace Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowWorkspaceMenu(!showWorkspaceMenu);
                setShowBoardMenu(false);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#F0F0EB] text-xs font-medium text-[#292929] transition-colors"
            >
              <Folder className="w-3.5 h-3.5 text-[#777777]" />
              <span>{activeWs?.name || (workspaces.length === 0 ? "No Workspaces" : "Select Workspace")}</span>
              <ChevronDown className="w-3 h-3 text-[#777777]" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-[#FFFFFF] border border-[#E5E5E0] rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-[#777777] tracking-wider flex items-center justify-between border-b border-[#F0F0EB]">
                  <span>Workspaces</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setIsCreateWsOpen(true);
                    }}
                    className="flex items-center gap-1 text-[#292929] hover:underline font-medium cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  {workspaces.length === 0 ? (
                    <div className="px-3 py-3 text-center text-xs text-[#777777]">
                      No workspaces yet
                    </div>
                  ) : (
                    workspaces.map((ws) => (
                      <div
                        key={ws.id}
                        className={`w-full px-3 py-1.5 text-xs flex items-center justify-between group transition-colors ${
                          ws.id === activeWorkspaceId
                            ? "font-semibold text-[#292929] bg-[#F5F5F2]"
                            : "text-[#555550] hover:bg-[#F0F0EB]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={async () => {
                            await setActiveWorkspace(ws.id);
                            setShowWorkspaceMenu(false);
                          }}
                          className="flex-1 text-left truncate flex items-center gap-1.5 cursor-pointer mr-2"
                        >
                          <Folder className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                          <span className="truncate">{ws.name}</span>
                        </button>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            title="Rename workspace"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowWorkspaceMenu(false);
                              setRenamingWs(ws);
                            }}
                            className="p-1 text-[#777777] hover:text-[#292929] hover:bg-[#E9E9E3] rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Delete workspace"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowWorkspaceMenu(false);
                              setDeletingWs(ws);
                            }}
                            className="p-1 text-[#777777] hover:text-[#8A4A4A] hover:bg-[#F5ECEB] rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-1 border-t border-[#F0F0EB]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setIsCreateWsOpen(true);
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-[#292929] hover:bg-[#F0F0EB] rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#777777]" />
                    <span>Create workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <span className="text-[#A0A09B] text-xs">/</span>

          {/* Board Dropdown / Title editor */}
          <div className="relative">
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSubmit();
                  if (e.key === "Escape") {
                    setIsEditingTitle(false);
                    setBoardTitle(activeBoard?.name || "");
                  }
                }}
                className="text-xs font-medium px-1.5 py-0.5 bg-[#FFFFFF] border border-[#8A8178] rounded outline-none"
              />
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onDoubleClick={() => {
                    if (activeBoard) {
                      setBoardTitle(activeBoard.name);
                      setIsEditingTitle(true);
                    }
                  }}
                  onClick={() => {
                    setShowBoardMenu(!showBoardMenu);
                    setShowWorkspaceMenu(false);
                    setShowExportMenu(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F0F0EB] text-xs font-semibold text-[#292929] transition-colors"
                  title="Click to switch boards or double-click to rename"
                >
                  <span>{activeBoard?.name || (boards.length === 0 ? "No Boards" : "Select Board")}</span>
                  <ChevronDown className="w-3 h-3 text-[#777777]" />
                </button>

                {activeWs && (
                  <button
                    type="button"
                    onClick={onOpenCreateBoard}
                    title="Create new board in this workspace"
                    className="p-1 hover:bg-[#F0F0EB] text-[#777777] hover:text-[#292929] rounded"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {showBoardMenu && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-[#FFFFFF] border border-[#E5E5E0] rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-[#777777] tracking-wider flex items-center justify-between border-b border-[#F0F0EB]">
                  <span className="truncate">Boards in {activeWs?.name || "Workspace"}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBoardMenu(false);
                      onOpenCreateBoard();
                    }}
                    className="text-[#292929] hover:underline font-medium shrink-0 cursor-pointer"
                  >
                    + New
                  </button>
                </div>

                <div className="py-1">
                  {boards.length === 0 ? (
                    <div className="px-3 py-3 text-center text-xs text-[#777777]">
                      No boards in this workspace
                    </div>
                  ) : (
                    boards.map((b) => (
                      <div
                        key={b.id}
                        className={`w-full px-3 py-1.5 text-xs flex items-center justify-between group transition-colors ${
                          b.id === activeBoard?.id
                            ? "font-semibold text-[#292929] bg-[#F5F5F2]"
                            : "text-[#555550] hover:bg-[#F0F0EB]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={async () => {
                            await loadBoardById(b.id);
                            await setBoard(b.id);
                            setShowBoardMenu(false);
                          }}
                          className="flex-1 text-left flex flex-col truncate mr-2 cursor-pointer"
                        >
                          <span className="truncate">{b.name}</span>
                          {b.description && (
                            <span className="text-[10px] text-[#777777] font-normal truncate">
                              {b.description}
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            title="Move to another workspace"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowBoardMenu(false);
                              setMovingBoard(b);
                            }}
                            className="p-1 text-[#777777] hover:text-[#292929] hover:bg-[#E9E9E3] rounded"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Delete board"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowBoardMenu(false);
                              setDeletingBoard(b);
                            }}
                            className="p-1 text-[#777777] hover:text-[#8A4A4A] hover:bg-[#F5ECEB] rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-1 border-t border-[#F0F0EB]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBoardMenu(false);
                      onOpenCreateBoard();
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-[#292929] hover:bg-[#F0F0EB] rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#777777]" />
                    <span>Create board</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center section: Undo/Redo & Save indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 border border-[#E5E5E0] rounded-lg p-0.5 bg-[#FFFFFF]">
            <button
              type="button"
              onClick={undo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
              className="p-1 rounded text-[#555550] hover:text-[#292929] hover:bg-[#F0F0EB] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Shift+Z)"
              className="p-1 rounded text-[#555550] hover:text-[#292929] hover:bg-[#F0F0EB] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save Status Indicator */}
          <div
            onClick={saveCurrentState}
            title="Click to trigger manual save (Autosaves automatically)"
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#FFFFFF] border border-[#E5E5E0] text-[11px] font-medium text-[#777777] cursor-pointer hover:border-[#8A8178] transition-colors"
          >
            {saveStatus === "saving" && (
              <>
                <RefreshCw className="w-3 h-3 text-[#8A8178] animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="w-3 h-3 text-[#747A65]" />
                <span className="text-[#555550]">Saved</span>
              </>
            )}
            {saveStatus === "offline" && (
              <>
                <AlertTriangle className="w-3 h-3 text-[#8A4A4A]" />
                <span className="text-[#8A4A4A]">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Right section: Search + Zoom + Import/Export + Help */}
        <div className="flex items-center gap-1.5">
          {/* Search button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2 py-1 rounded border border-[#E5E5E0] bg-[#FFFFFF] hover:bg-[#F0F0EB] text-xs text-[#777777] hover:text-[#292929] transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#777777]" />
            <span>Search</span>
            <kbd className="text-[10px] font-mono text-[#A0A09B]">Ctrl+F</kbd>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 border border-[#E5E5E0] rounded-lg p-0.5 bg-[#FFFFFF]">
            <button
              type="button"
              onClick={() => zoomOut({ duration: 200 })}
              title="Zoom out"
              className="p-1 rounded text-[#777777] hover:text-[#292929] hover:bg-[#F0F0EB] cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-[#777777] px-1 min-w-[36px] text-center">
              {currentZoom}%
            </span>
            <button
              type="button"
              onClick={() => zoomIn({ duration: 200 })}
              title="Zoom in"
              className="p-1 rounded text-[#777777] hover:text-[#292929] hover:bg-[#F0F0EB] cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => fitView({ padding: 0.2, duration: 250 })}
              title="Fit to content"
              className="p-1 rounded text-[#777777] hover:text-[#292929] hover:bg-[#F0F0EB] cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export / Import Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                setShowWorkspaceMenu(false);
                setShowBoardMenu(false);
              }}
              title="Backup & Export"
              className="p-1.5 rounded border border-[#E5E5E0] bg-[#FFFFFF] hover:bg-[#F0F0EB] text-[#777777] hover:text-[#292929] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[#FFFFFF] border border-[#E5E5E0] rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-[#777777] tracking-wider">
                  Backup & Portability
                </div>

                {activeBoard && (
                  <button
                    type="button"
                    onClick={() => {
                      exportBoardToJson(activeBoard.id);
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F0F0EB] text-[#292929] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#777777]" />
                    <span>Export Board (JSON)</span>
                  </button>
                )}

                <label className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F0F0EB] text-[#292929] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#777777]" />
                  <span>Import Board (JSON)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>

                <div className="h-px bg-[#E5E5E0] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    exportAllDataBackup();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F0F0EB] text-[#292929] cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-[#777777]" />
                  <span>Backup All Data (IndexedDB)</span>
                </button>

                <div className="px-3 py-1.5 bg-[#FAF8F5] border-t border-[#E5E5E0] text-[10px] text-[#777777] leading-tight">
                  Data is persisted locally in your browser via Dexie / IndexedDB.
                </div>
              </div>
            )}
          </div>

          {/* Shortcuts / Help modal trigger */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts & guide"
            className="p-1.5 rounded border border-[#E5E5E0] bg-[#FFFFFF] hover:bg-[#F0F0EB] text-[#777777] hover:text-[#292929] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Workspace & Board Modals */}
      <WorkspaceCreateModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
      />

      <WorkspaceRenameModal
        isOpen={!!renamingWs}
        workspace={renamingWs}
        onClose={() => setRenamingWs(null)}
      />

      <WorkspaceDeleteConfirmModal
        isOpen={!!deletingWs}
        workspace={deletingWs}
        onClose={() => setDeletingWs(null)}
      />

      <BoardMoveModal
        isOpen={!!movingBoard}
        board={movingBoard}
        onClose={() => setMovingBoard(null)}
      />

      <BoardDeleteConfirmModal
        isOpen={!!deletingBoard}
        board={deletingBoard}
        onClose={() => setDeletingBoard(null)}
      />
    </>
  );
};
