import { Board, Workspace } from "@/types/workspace";
import { CanvasNodeRecord, CanvasEdgeRecord, NoteNodeData, ImageNodeData, FileNodeData } from "@/types/node";
import { CanvasDrawingRecord } from "@/types/drawing";
import {
  getBoard,
  getBoardNodes,
  getBoardEdges,
  getBoardDrawings,
  saveBoard,
  saveBoardNodes,
  saveBoardEdges,
  saveBoardDrawings,
  getDb,
  initDatabase,
} from "./db";

export interface BoardExportPackage {
  version: number;
  type: "notemap-board";
  exportedAt: number;
  board: Board;
  nodes: CanvasNodeRecord[];
  edges: CanvasEdgeRecord[];
  drawings?: CanvasDrawingRecord[];
}

export interface WorkspaceExportPackage {
  version: number;
  type: "notemap-workspace-backup";
  exportedAt: number;
  workspaces: Workspace[];
  boards: Board[];
  nodes: CanvasNodeRecord[];
  edges: CanvasEdgeRecord[];
  drawings?: CanvasDrawingRecord[];
}

export interface ImportResult {
  success: boolean;
  type: "board" | "backup";
  boardId?: string;
  boardName?: string;
  workspaceId?: string;
  workspaceCount?: number;
  boardCount?: number;
  nodeCount?: number;
}

/**
 * Trigger browser file download safely without early revocation of large blobs
 */
export function downloadFile(content: string, filename: string, contentType: string = "application/json") {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Keep blob URL active in memory long enough for large downloads to complete
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Ensures that if an image node has a remote URL, we try to convert it to a self-contained
 * base64 data URL so the exported JSON file has the image embedded and works 100% offline.
 */
async function embedImageIfPossible(node: CanvasNodeRecord): Promise<CanvasNodeRecord> {
  if (node.type !== "image" || !node.data) return node;
  const data = { ...node.data } as ImageNodeData;
  const url = data.url;

  // If already base64 or empty, nothing to do
  if (!url || url.startsWith("data:image/")) return node;

  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || url);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      });
      data.url = base64;
      return { ...node, data };
    }
  } catch {
    // If CORS or offline, preserve original URL
  }
  return node;
}

/**
 * Export a single board to a JSON file (including notes, images, connectors, and drawings)
 */
export async function exportBoardToJson(boardId: string): Promise<void> {
  // Ensure the live in-memory changes (notes, uploaded images, connectors, drawings)
  // are saved to IndexedDB before packaging
  if (typeof window !== "undefined") {
    try {
      const { useCanvasStore } = await import("@/stores/canvas-store");
      const canvasStore = useCanvasStore.getState();
      if (canvasStore.currentBoardId === boardId) {
        await canvasStore.saveCurrentState();
      }
    } catch (e) {
      console.warn("Could not flush canvas store before export", e);
    }
  }

  const board = await getBoard(boardId);
  if (!board) throw new Error("Board not found");

  const rawNodes = await getBoardNodes(boardId);
  const edges = await getBoardEdges(boardId);
  const drawings = await getBoardDrawings(boardId);

  // Embed any remote images as base64 so all images are inside the JSON file
  const nodes = await Promise.all(rawNodes.map(embedImageIfPossible));

  const pkg: BoardExportPackage = {
    version: 1,
    type: "notemap-board",
    exportedAt: Date.now(),
    board,
    nodes,
    edges,
    drawings,
  };

  const safeName = (board.name || "board").toLowerCase().replace(/[^a-z0-9]/gi, "_");
  const filename = `${safeName}_board.json`;
  downloadFile(JSON.stringify(pkg, null, 2), filename);
}

/**
 * Export entire workspace backup (all workspaces, boards, notes, images, connectors, and drawings)
 */
  export async function exportAllDataBackup(): Promise<void> {
    // Flush live canvas changes first
    if (typeof window !== "undefined") {
      try {
        const { useCanvasStore } = await import("@/stores/canvas-store");
        await useCanvasStore.getState().saveCurrentState();
      } catch (e) {
        console.warn("Could not flush canvas store before backup", e);
      }
    }

    const db = getDb();
    await initDatabase();
    const workspaces = await db.workspaces.toArray();
    const boards = await db.boards.toArray();
    const rawNodes = await db.nodes.toArray();
    const edges = await db.edges.toArray();
    const drawings = db.drawings ? await db.drawings.toArray() : [];

    // Embed any remote images as base64
    const nodes = await Promise.all(rawNodes.map(embedImageIfPossible));

    const pkg: WorkspaceExportPackage = {
      version: 1,
      type: "notemap-workspace-backup",
      exportedAt: Date.now(),
      workspaces,
      boards,
      nodes,
      edges,
      drawings,
    };

    const filename = `notemap_backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(JSON.stringify(pkg, null, 2), filename);
  }

/**
 * Smart import that handles both Board JSON and Full Workspace Backup files
 */
export async function importDataFromJson(
  jsonString: string,
  targetWorkspaceId?: string
): Promise < ImportResult > {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch(err: any) {
      throw new Error("Invalid JSON file: The file is not valid JSON. Please check the file and try again.");
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid file content: Expected a JSON object.");
    }

    const db = getDb();
    await initDatabase();

    // CASE 1: Full Workspace Backup
    const isWorkspaceBackup =
      parsed.type === "notemap-workspace-backup" ||
      (Array.isArray(parsed.workspaces) && Array.isArray(parsed.boards));

    if (isWorkspaceBackup) {
      const workspaces: Workspace[] = parsed.workspaces || [];
      const boards: Board[] = parsed.boards || [];
      const nodes: CanvasNodeRecord[] = parsed.nodes || [];
      const edges: CanvasEdgeRecord[] = parsed.edges || [];
      const drawings: CanvasDrawingRecord[] = parsed.drawings || [];

      if (workspaces.length > 0) {
        await db.workspaces.bulkPut(workspaces);
      }
      if (boards.length > 0) {
        await db.boards.bulkPut(boards);
      }
      if (nodes.length > 0) {
        await db.nodes.bulkPut(nodes);
      }
      if (edges.length > 0) {
        await db.edges.bulkPut(edges);
      }
      if (drawings.length > 0 && db.drawings) {
        await db.drawings.bulkPut(drawings);
      }

      const primaryWorkspaceId =
        workspaces[0]?.id || boards[0]?.workspaceId || targetWorkspaceId;
      const primaryBoardId = boards[0]?.id;

      return {
        success: true,
        type: "backup",
        workspaceId: primaryWorkspaceId,
        boardId: primaryBoardId,
        workspaceCount: workspaces.length,
        boardCount: boards.length,
        nodeCount: nodes.length,
      };
    }

    // CASE 2: Board Export or loose notes/board structure
    let rawNodes: CanvasNodeRecord[] = [];
    if (Array.isArray(parsed.nodes)) {
      rawNodes = parsed.nodes;
    } else if (Array.isArray(parsed)) {
      rawNodes = parsed;
    }

    const rawBoard = parsed.board || (parsed.name ? { name: parsed.name } : {});
    const rawEdges: CanvasEdgeRecord[] = Array.isArray(parsed.edges) ? parsed.edges : [];
    const rawDrawings: CanvasDrawingRecord[] = Array.isArray(parsed.drawings) ? parsed.drawings : [];

    // If there's neither board nor nodes, throw clear error
    if (rawNodes.length === 0 && !parsed.board && !parsed.name) {
      throw new Error(
        "Unsupported file format: The selected JSON file does not contain NoteMap board or workspace data."
      );
    }

    // Determine target workspace ID
    let wsId = targetWorkspaceId;
    if (!wsId) {
      const existingWorkspaces = await db.workspaces.toArray();
      if (existingWorkspaces.length > 0) {
        wsId = existingWorkspaces[0].id;
      } else {
        const now = Date.now();
        const newWs: Workspace = {
          id: `ws_${now}`,
          name: "My Workspace",
          description: "Default workspace",
          icon: "Folder",
          createdAt: now,
          updatedAt: now,
        };
        await db.workspaces.put(newWs);
        wsId = newWs.id;
      }
    }

    const now = Date.now();
    const newBoardId = `board_import_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const boardName = rawBoard.name
      ? `${rawBoard.name} (Imported)`
      : "Imported Board";

    const board: Board = {
      id: newBoardId,
      workspaceId: wsId,
      name: boardName,
      description: rawBoard.description || "Imported NoteMap Board",
      viewport: rawBoard.viewport || { x: 0, y: 0, zoom: 1 },
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    };

    // Remap node IDs to prevent collisions while preserving edge connections
    const idMap = new Map<string, string>();
      const newNodes: CanvasNodeRecord[] = rawNodes.map((node: CanvasNodeRecord) => {
        const newId = `node_${now}_${Math.random().toString(36).substring(2, 7)}`;
        idMap.set(node.id, newId);
        return {
          ...node,
          id: newId,
          boardId: newBoardId,
          // Fully preserve all node data (including Base64 image data url and caption)
          data: { ...(node.data || {}) },
          updatedAt: now,
        };
      });

      const newEdges: CanvasEdgeRecord[] = rawEdges.map((edge: CanvasEdgeRecord) => ({
        ...edge,
        id: `edge_${now}_${Math.random().toString(36).substring(2, 7)}`,
        boardId: newBoardId,
        source: idMap.get(edge.source) || edge.source,
        target: idMap.get(edge.target) || edge.target,
        updatedAt: now,
      }));

      const newDrawings: CanvasDrawingRecord[] = rawDrawings.map((d: CanvasDrawingRecord) => ({
        ...d,
        id: `draw_${now}_${Math.random().toString(36).substring(2, 7)}`,
        boardId: newBoardId,
        createdAt: d.createdAt || now,
      }));

      await saveBoard(board);
      await saveBoardNodes(newBoardId, newNodes);
      await saveBoardEdges(newBoardId, newEdges);
      if (newDrawings.length > 0) {
        await saveBoardDrawings(newBoardId, newDrawings);
      }

      return {
        success: true,
        type: "board",
        boardId: newBoardId,
        boardName: board.name,
        workspaceId: wsId,
        nodeCount: newNodes.length,
      };
    }

/**
 * Backward compatibility wrapper for importBoardFromJson
 */
        export async function importBoardFromJson(
          jsonString: string,
          targetWorkspaceId ?: string
        ): Promise<{ boardId: string; name: string }> {
        const result = await importDataFromJson(jsonString, targetWorkspaceId);
        return {
          boardId: result.boardId || "",
          name: result.boardName || "Imported Board",
        };
    }

    /**
     * Export an individual note to Markdown
     */
    export function exportNoteToMarkdown(node: CanvasNodeRecord): void {
      if (node.type !== "note") return;
      const data = node.data as NoteNodeData;
      const tagsStr = data.tags && data.tags.length > 0 ? `\nTags: ${data.tags.map((t) => `#${t}`).join(" ")}\n` : "";
      const content = `# ${data.title || "Untitled Note"}\n${tagsStr}\n${data.content || ""}\n`;
      const filename = `${(data.title || "note").toLowerCase().replace(/[^a-z0-9]/gi, "_")}.md`;
      downloadFile(content, filename, "text/markdown");
    }
