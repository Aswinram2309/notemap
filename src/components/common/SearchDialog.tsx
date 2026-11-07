"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Folder, StickyNote, CheckSquare, Link as LinkIcon, Table, MessageSquare, ArrowRight } from "lucide-react";
import { searchAll, SearchResult } from "@/lib/db";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useCanvasStore } from "@/stores/canvas-store";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToNode?: (boardId: string, nodeId?: string) => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({
  isOpen,
  onClose,
  onNavigateToNode,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { loadBoardById, setActiveWorkspace } = useWorkspaceStore();
  const { setBoard } = useCanvasStore();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const hits = await searchAll(query);
        setResults(hits);
      } catch (e) {
        console.error("Search error", e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectResult = async (res: SearchResult) => {
    if (res.type === "workspace" && res.workspaceId) {
      await setActiveWorkspace(res.workspaceId);
      if (res.boardId) {
        await loadBoardById(res.boardId);
        await setBoard(res.boardId);
      }
      onClose();
      return;
    }

    if (res.boardId) {
      await loadBoardById(res.boardId);
      await setBoard(res.boardId);

      if (onNavigateToNode) {
        onNavigateToNode(res.boardId, res.nodeId);
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  const getResultIcon = (type: string) => {
    switch (type) {
      case "workspace":
        return <Folder className="w-4 h-4 text-[#292929]" />;
      case "board":
        return <Folder className="w-4 h-4 text-[#777777]" />;
      case "note":
        return <StickyNote className="w-4 h-4 text-[#777777]" />;
      case "todo":
        return <CheckSquare className="w-4 h-4 text-[#777777]" />;
      case "link":
        return <LinkIcon className="w-4 h-4 text-[#777777]" />;
      case "table":
        return <Table className="w-4 h-4 text-[#777777]" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-[#777777]" />;
      default:
        return <StickyNote className="w-4 h-4 text-[#777777]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[#292929]/20 backdrop-blur-2xs animate-in fade-in duration-100">
      <div
        className="w-full max-w-xl bg-[#FFFFFF] border border-[#E5E5E0] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[#E5E5E0] flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[#777777]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all boards, notes, tags, and tasks..."
            className="flex-1 text-sm bg-transparent outline-none text-[#292929] placeholder:text-[#A0A09B]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[#777777] hover:text-[#292929] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-[10px] bg-[#F0F0EB] text-[#777777] rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2">
          {isSearching && (
            <div className="p-4 text-center text-xs text-[#777777]">
              Searching workspace...
            </div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className="p-6 text-center text-xs text-[#777777]">
              No matching boards, notes, or tags found for &quot;{query}&quot;
            </div>
          )}

          {!isSearching && !query && (
            <div className="p-6 text-center text-xs text-[#777777]">
              Type a word to search notes, video plans, game specs, tags, or to-dos.
            </div>
          )}

          {!isSearching &&
            results.map((res, index) => (
              <button
                key={`${res.boardId}_${res.nodeId || index}`}
                type="button"
                onClick={() => handleSelectResult(res)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-[#F0F0EB] transition-colors flex items-start gap-3 group"
              >
                <div className="p-1.5 rounded bg-[#FAFAF8] border border-[#E5E5E0] shrink-0 mt-0.5 group-hover:border-[#C4C4BD]">
                  {getResultIcon(res.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-[#292929] truncate">
                      {res.title}
                    </span>
                    <span className="text-[10px] text-[#777777] bg-[#F5F5F2] px-1.5 py-0.2 rounded border border-[#E5E5E0]">
                      {res.workspaceName ? `${res.workspaceName} / ` : ""}
                      {res.boardName}
                    </span>
                  </div>
                  {res.snippet && (
                    <p className="text-[11px] text-[#777777] truncate mt-0.5">
                      {res.snippet}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A0A09B] opacity-0 group-hover:opacity-100 self-center transition-opacity" />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
