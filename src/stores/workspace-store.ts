import { create } from "zustand";
import { Workspace, Board } from "@/types/workspace";
import {
  getWorkspaces,
  createWorkspace as dbCreateWorkspace,
  renameWorkspace as dbRenameWorkspace,
  deleteWorkspace as dbDeleteWorkspace,
  getBoards,
  getAllBoards,
  getBoard,
  saveBoard,
  deleteBoard as dbDeleteBoard,
  getBoardNodes,
  getBoardEdges,
  saveBoardNodes,
  saveBoardEdges,
  getDb,
} from "@/lib/db";
import { generateId } from "@/lib/utils";

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  boards: Board[];
  activeBoard: Board | null;
  recentBoards: Board[];
  isLoading: boolean;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  setActiveWorkspace: (id: string) => Promise<void>;
  createWorkspace: (name: string, description?: string, icon?: string) => Promise<Workspace>;
  renameWorkspace: (id: string, name: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  fetchBoards: (workspaceId: string) => Promise<void>;
  fetchRecentBoards: () => Promise<void>;
  loadBoardById: (id: string) => Promise<Board | null>;
  createNewBoard: (
    workspaceId: string,
    name: string,
    description?: string,
    parentId?: string | null
  ) => Promise<Board>;
  renameBoard: (id: string, name: string) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  duplicateBoard: (id: string) => Promise<Board | null>;
  moveBoard: (id: string, targetWorkspaceId: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  boards: [],
  activeBoard: null,
  recentBoards: [],
  isLoading: false,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const workspaces = await getWorkspaces();
      const currentActive = get().activeWorkspaceId;
      const nextActive = currentActive || (workspaces[0] ? workspaces[0].id : null);
      set({ workspaces, activeWorkspaceId: nextActive, isLoading: false });

      if (nextActive) {
        await get().fetchBoards(nextActive);
      }
      await get().fetchRecentBoards();
    } catch (e) {
      console.error("Failed to fetch workspaces", e);
      set({ isLoading: false });
    }
  },

  setActiveWorkspace: async (workspaceId: string) => {
    set({ activeWorkspaceId: workspaceId });
    await get().fetchBoards(workspaceId);
    const boards = await getBoards(workspaceId);
    if (boards.length > 0) {
      await get().loadBoardById(boards[0].id);
    } else {
      set({ activeBoard: null });
    }
  },

  createWorkspace: async (name: string, description?: string, icon?: string) => {
    const ws = await dbCreateWorkspace(name, description, icon);
    const workspaces = await getWorkspaces();
    set({
      workspaces,
      activeWorkspaceId: ws.id,
      boards: [],
      activeBoard: null,
    });
    await get().fetchRecentBoards();
    return ws;
  },

  renameWorkspace: async (id: string, name: string) => {
    await dbRenameWorkspace(id, name);
    const workspaces = await getWorkspaces();
    set({ workspaces });
  },

  deleteWorkspace: async (id: string) => {
    await dbDeleteWorkspace(id);
    const workspaces = await getWorkspaces();
    const currentActive = get().activeWorkspaceId;
    let nextActive: string | null = null;
    if (currentActive === id) {
      nextActive = workspaces[0] ? workspaces[0].id : null;
    } else {
      nextActive = currentActive && workspaces.some((w) => w.id === currentActive)
        ? currentActive
        : workspaces[0]
        ? workspaces[0].id
        : null;
    }

    set({ workspaces, activeWorkspaceId: nextActive });

    if (nextActive) {
      await get().fetchBoards(nextActive);
      const boards = await getBoards(nextActive);
      if (boards.length > 0) {
        await get().loadBoardById(boards[0].id);
      } else {
        set({ activeBoard: null });
      }
    } else {
      set({ boards: [], activeBoard: null });
    }

    await get().fetchRecentBoards();
  },

  fetchBoards: async (workspaceId: string) => {
    try {
      const boards = await getBoards(workspaceId);
      set({ boards });
    } catch (e) {
      console.error("Failed to fetch boards", e);
    }
  },

  fetchRecentBoards: async () => {
    try {
      const recent = await getAllBoards();
      set({ recentBoards: recent.slice(0, 10) });
    } catch (e) {
      console.error("Failed to fetch recent boards", e);
    }
  },

  loadBoardById: async (id: string) => {
    try {
      const board = await getBoard(id);
      if (board) {
        set({ activeBoard: board, activeWorkspaceId: board.workspaceId });
        // Update last accessed
        const db = getDb();
        await db.boards.update(id, { lastAccessedAt: Date.now() });
        await get().fetchRecentBoards();
      }
      return board || null;
    } catch (e) {
      console.error("Failed to load board", e);
      return null;
    }
  },

  createNewBoard: async (workspaceId, name, description, parentId = null) => {
    const now = Date.now();
    const newBoard: Board = {
      id: generateId("board"),
      workspaceId,
      parentId,
      name: name.trim() || "Untitled Board",
      description: description || "",
      viewport: { x: 100, y: 100, zoom: 1 },
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    };

    await saveBoard(newBoard);
    await get().fetchBoards(workspaceId);
    await get().fetchRecentBoards();
    return newBoard;
  },

  renameBoard: async (id, name) => {
    const db = getDb();
    await db.boards.update(id, { name, updatedAt: Date.now() });
    const active = get().activeBoard;
    if (active && active.id === id) {
      set({ activeBoard: { ...active, name, updatedAt: Date.now() } });
    }
    const currentWs = get().activeWorkspaceId;
    if (currentWs) await get().fetchBoards(currentWs);
    await get().fetchRecentBoards();
  },

  deleteBoard: async (id) => {
    await dbDeleteBoard(id);
    const activeWs = get().activeWorkspaceId;
    if (activeWs) await get().fetchBoards(activeWs);
    await get().fetchRecentBoards();
    if (get().activeBoard?.id === id) {
      set({ activeBoard: null });
    }
  },

  duplicateBoard: async (id) => {
    const sourceBoard = await getBoard(id);
    if (!sourceBoard) return null;

    const nodes = await getBoardNodes(id);
    const edges = await getBoardEdges(id);

    const newBoardId = generateId("board");
    const now = Date.now();
    const duplicate: Board = {
      ...sourceBoard,
      id: newBoardId,
      name: `${sourceBoard.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    };

    const idMap = new Map<string, string>();
    const newNodes = nodes.map((node) => {
      const nid = generateId("node");
      idMap.set(node.id, nid);
      return {
        ...node,
        id: nid,
        boardId: newBoardId,
        updatedAt: now,
      };
    });

    const newEdges = edges.map((edge) => ({
      ...edge,
      id: generateId("edge"),
      boardId: newBoardId,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
      updatedAt: now,
    }));

    await saveBoard(duplicate);
    await saveBoardNodes(newBoardId, newNodes);
    await saveBoardEdges(newBoardId, newEdges);

    if (get().activeWorkspaceId) {
      await get().fetchBoards(get().activeWorkspaceId!);
    }
    await get().fetchRecentBoards();

    return duplicate;
  },

  moveBoard: async (boardId, targetWorkspaceId) => {
    const db = getDb();
    await db.boards.update(boardId, {
      workspaceId: targetWorkspaceId,
      updatedAt: Date.now(),
    });

    const currentWs = get().activeWorkspaceId;
    if (currentWs) {
      await get().fetchBoards(currentWs);
      if (get().activeBoard?.id === boardId) {
        // If moved from the current workspace, load next board in current workspace or clear
        const remaining = await getBoards(currentWs);
        if (remaining.length > 0) {
          await get().loadBoardById(remaining[0].id);
        } else {
          set({ activeBoard: null });
        }
      }
    }
    await get().fetchRecentBoards();
  },
}));
