import { Board } from "@/types/workspace";
import { CanvasNodeRecord, CanvasEdgeRecord, NoteNodeData } from "@/types/node";
import { getBoard, getBoardNodes, getBoardEdges, saveBoard, saveBoardNodes, saveBoardEdges, getDb } from "./db";

export interface BoardExportPackage {
  version: number;
  type: "notemap-board";
  exportedAt: number;
  board: Board;
  nodes: CanvasNodeRecord[];
  edges: CanvasEdgeRecord[];
}

export interface WorkspaceExportPackage {
  version: number;
  type: "notemap-workspace-backup";
  exportedAt: number;
  workspaces: any[];
  boards: Board[];
  nodes: CanvasNodeRecord[];
  edges: CanvasEdgeRecord[];
}

/**
 * Trigger browser file download
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
  URL.revokeObjectURL(url);
}

/**
 * Export a single board to a JSON file
 */
export async function exportBoardToJson(boardId: string): Promise<void> {
  const board = await getBoard(boardId);
  if (!board) throw new Error("Board not found");

  const nodes = await getBoardNodes(boardId);
  const edges = await getBoardEdges(boardId);

  const pkg: BoardExportPackage = {
    version: 1,
    type: "notemap-board",
    exportedAt: Date.now(),
    board,
    nodes,
    edges,
  };

  const filename = `${board.name.toLowerCase().replace(/[^a-z0-9]/gi, "_")}_board.json`;
  downloadFile(JSON.stringify(pkg, null, 2), filename);
}

/**
 * Validate and import a board JSON file
 */
export async function importBoardFromJson(
  jsonString: string,
  targetWorkspaceId?: string
): Promise<{ boardId: string; name: string }> {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON format");
  }

  if (parsed.type !== "notemap-board" || !parsed.board || !Array.isArray(parsed.nodes)) {
    throw new Error("Unsupported or corrupted board file format");
  }

  const newBoardId = `board_import_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const board: Board = {
    ...parsed.board,
    id: newBoardId,
    workspaceId: targetWorkspaceId || parsed.board.workspaceId || "ws-general",
    name: `${parsed.board.name || "Imported Board"} (Imported)`,
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
  };

  // Map old node IDs to new node IDs to preserve edge linkages
  const idMap = new Map<string, string>();
  const newNodes: CanvasNodeRecord[] = parsed.nodes.map((node: CanvasNodeRecord) => {
    const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    idMap.set(node.id, newId);
    return {
      ...node,
      id: newId,
      boardId: newBoardId,
      updatedAt: now,
    };
  });

  const newEdges: CanvasEdgeRecord[] = (parsed.edges || []).map((edge: CanvasEdgeRecord) => {
    return {
      ...edge,
      id: `edge_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      boardId: newBoardId,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
      updatedAt: now,
    };
  });

  await saveBoard(board);
  await saveBoardNodes(newBoardId, newNodes);
  await saveBoardEdges(newBoardId, newEdges);

  return { boardId: newBoardId, name: board.name };
}

/**
 * Export entire workspace backup
 */
export async function exportAllDataBackup(): Promise<void> {
  const db = getDb();
  const workspaces = await db.workspaces.toArray();
  const boards = await db.boards.toArray();
  const nodes = await db.nodes.toArray();
  const edges = await db.edges.toArray();

  const pkg: WorkspaceExportPackage = {
    version: 1,
    type: "notemap-workspace-backup",
    exportedAt: Date.now(),
    workspaces,
    boards,
    nodes,
    edges,
  };

  const filename = `notemap_backup_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(JSON.stringify(pkg, null, 2), filename);
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
