import Dexie, { type Table } from "dexie";
import { Workspace, Board } from "@/types/workspace";
import {
  CanvasNodeRecord,
  CanvasEdgeRecord,
  NoteNodeData,
  TodoNodeData,
  LinkNodeData,
  BoardNodeData,
  TableNodeData,
  CommentNodeData,
} from "@/types/node";
import { CanvasDrawingRecord } from "@/types/drawing";

export class NoteMapDatabase extends Dexie {
  workspaces!: Table<Workspace, string>;
  boards!: Table<Board, string>;
  nodes!: Table<CanvasNodeRecord, string>;
  edges!: Table<CanvasEdgeRecord, string>;
  drawings!: Table<CanvasDrawingRecord, string>;

  constructor() {
    super("NoteMapDB");
    this.version(1).stores({
      workspaces: "id, name, createdAt, updatedAt",
      boards: "id, workspaceId, parentId, name, updatedAt, lastAccessedAt",
      nodes: "id, boardId, type, createdAt, updatedAt",
      edges: "id, boardId, source, target, createdAt, updatedAt",
    });
    this.version(2).stores({
      drawings: "id, boardId, createdAt",
    });
  }
}

let dbInstance: NoteMapDatabase | null = null;

export function getDb(): NoteMapDatabase {
  if (typeof window === "undefined") {
    // Return dummy or throw if SSR
    return {} as NoteMapDatabase;
  }
  if (!dbInstance) {
    dbInstance = new NoteMapDatabase();
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  if (typeof window === "undefined") return;
  const db = getDb();
  await db.open();
  // Workspaces are user-created.
}

export async function seedDefaultData(db: NoteMapDatabase) {
  const now = Date.now();

  const defaultWorkspaces: Workspace[] = [
    {
      id: "ws-youtube",
      name: "YouTube",
      description: "Video ideas, scripts, storytelling, ARG lore, recording plans, editing notes, and thumbnails.",
      icon: "Video",
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ws-study",
      name: "Study",
      description: "Subject notes, exam preparation, concepts, mind maps, revision plans, and assignments.",
      icon: "BookOpen",
      isDefault: true,
      createdAt: now + 1,
      updatedAt: now + 1,
    },
    {
      id: "ws-game-dev",
      name: "Game Development",
      description: "Game concepts, gameplay mechanics, level design, character ideas, technical notes, and roadmaps.",
      icon: "Gamepad2",
      isDefault: true,
      createdAt: now + 2,
      updatedAt: now + 2,
    },
    {
      id: "ws-personal",
      name: "Personal Projects",
      description: "Coding projects, websites, experiments, side ventures, and infrastructure tasks.",
      icon: "FolderGit2",
      isDefault: true,
      createdAt: now + 3,
      updatedAt: now + 3,
    },
    {
      id: "ws-general",
      name: "General Notes",
      description: "Quick captures, brainstorming, reading summaries, and general notes.",
      icon: "Layers",
      isDefault: true,
      createdAt: now + 4,
      updatedAt: now + 4,
    },
  ];

  await db.workspaces.bulkAdd(defaultWorkspaces);

  // Default Boards
  const defaultBoards: Board[] = [
    // YouTube boards
    {
      id: "board-yt-pipeline",
      workspaceId: "ws-youtube",
      parentId: null,
      name: "Video Production Pipeline",
      description: "Full roadmap from video conception to upload",
      viewport: { x: 120, y: 80, zoom: 0.9 },
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    },
    {
      id: "board-yt-arg",
      workspaceId: "ws-youtube",
      parentId: null,
      name: "ARG Lore & Character Concept",
      description: "Worldbuilding, hidden clues, and timeline",
      viewport: { x: 100, y: 100, zoom: 1 },
      createdAt: now + 1,
      updatedAt: now + 1,
      lastAccessedAt: now + 1,
    },

    // Study boards
    {
      id: "board-study-algo",
      workspaceId: "ws-study",
      parentId: null,
      name: "Algorithms & Data Structures",
      description: "Core algorithms roadmap and revision notes",
      viewport: { x: 100, y: 100, zoom: 1 },
      createdAt: now + 2,
      updatedAt: now + 2,
      lastAccessedAt: now + 2,
    },

    // Game Dev boards
    {
      id: "board-gamedev-master",
      workspaceId: "ws-game-dev",
      parentId: null,
      name: "Indie RPG Game Design Document",
      description: "High level overview and sub-board navigation",
      viewport: { x: 100, y: 80, zoom: 0.95 },
      createdAt: now + 3,
      updatedAt: now + 3,
      lastAccessedAt: now + 3,
    },
    {
      id: "board-gamedev-design",
      workspaceId: "ws-game-dev",
      parentId: "board-gamedev-master",
      name: "Game Design",
      description: "Core loop, mechanics, combat systems",
      viewport: { x: 100, y: 100, zoom: 1 },
      createdAt: now + 4,
      updatedAt: now + 4,
      lastAccessedAt: now + 4,
    },
    {
      id: "board-gamedev-levels",
      workspaceId: "ws-game-dev",
      parentId: "board-gamedev-master",
      name: "Level Design",
      description: "Dungeon layouts, pacing, environmental storytelling",
      viewport: { x: 100, y: 100, zoom: 1 },
      createdAt: now + 5,
      updatedAt: now + 5,
      lastAccessedAt: now + 5,
    },
    {
      id: "board-gamedev-programming",
      workspaceId: "ws-game-dev",
      parentId: "board-gamedev-master",
      name: "Programming",
      description: "Entity component architecture, state machines, shaders",
      viewport: { x: 100, y: 100, zoom: 1 },
      createdAt: now + 6,
      updatedAt: now + 6,
      lastAccessedAt: now + 6,
    },
    {
      id: "board-gamedev-art",
      workspaceId: "ws-game-dev",
      parentId: "board-gamedev-master",
      name: "Art References",
      description: "Color palettes, moodboards, character silhouettes",
      viewport: { x: 100, y: 100, zoom: 1 },
      createdAt: now + 7,
      updatedAt: now + 7,
      lastAccessedAt: now + 7,
    },

    // Personal boards
    {
      id: "board-personal-saas",
      workspaceId: "ws-personal",
      parentId: null,
      name: "Full-Stack SaaS Architecture",
      description: "Database schema, microservices, auth, billing",
      viewport: { x: 100, y: 100, zoom: 1 },
      createdAt: now + 8,
      updatedAt: now + 8,
      lastAccessedAt: now + 8,
    },

    // General boards
    {
      id: "board-general-daily",
      workspaceId: "ws-general",
      parentId: null,
      name: "Weekly Brainstorming & Daily Notes",
      description: "Quick thoughts, daily capture, ideas",
      viewport: { x: 100, y: 100, zoom: 1 },
      createdAt: now + 9,
      updatedAt: now + 9,
      lastAccessedAt: now + 9,
    },
  ];

  await db.boards.bulkAdd(defaultBoards);

  // Seed sample nodes and edges for "Video Production Pipeline"
  const ytNodes: CanvasNodeRecord[] = [
    {
      id: "node-yt-1",
      boardId: "board-yt-pipeline",
      type: "note",
      position: { x: 80, y: 80 },
      width: 250,
      data: {
        title: "VIDEO IDEA",
        content: "Deep dive into forgotten analog computing architectures and why they matter for modern AI hardware.",
        tags: ["concept", "hardware", "research"],
        color: "#FFFFFF",
      } as NoteNodeData,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "node-yt-2",
      boardId: "board-yt-pipeline",
      type: "note",
      position: { x: 80, y: 260 },
      width: 250,
      data: {
        title: "STORY RESEARCH",
        content: "Collect historical patents from 1950s-1970s. Compare floating point digital efficiency vs continuous analog feedback loops.",
        tags: ["papers", "patents"],
        color: "#FAF8F5",
      } as NoteNodeData,
      createdAt: now + 1,
      updatedAt: now + 1,
    },
    {
      id: "node-yt-3",
      boardId: "board-yt-pipeline",
      type: "note",
      position: { x: 80, y: 440 },
      width: 250,
      data: {
        title: "SCRIPT",
        content: "Act 1: The digital bottleneck.\nAct 2: The analog revolution that almost was.\nAct 3: Modern neuromorphic chips.",
        tags: ["story", "draft"],
        color: "#FFFFFF",
      } as NoteNodeData,
      createdAt: now + 2,
      updatedAt: now + 2,
    },
    {
      id: "node-yt-4",
      boardId: "board-yt-pipeline",
      type: "note",
      position: { x: 80, y: 620 },
      width: 250,
      data: {
        title: "RECORDING",
        content: "A-Roll in studio with warm backlight. B-Roll macro shots of vacuum tubes and op-amp breadboards.",
        tags: ["production"],
        color: "#F4F1EA",
      } as NoteNodeData,
      createdAt: now + 3,
      updatedAt: now + 3,
    },
    {
      id: "node-yt-5",
      boardId: "board-yt-pipeline",
      type: "note",
      position: { x: 420, y: 620 },
      width: 250,
      data: {
        title: "EDITING",
        content: "Sound design: Subtle vintage electronic hum and clicky relay sounds. Motion graphics in DaVinci Resolve.",
        tags: ["post-production"],
        color: "#FFFFFF",
      } as NoteNodeData,
      createdAt: now + 4,
      updatedAt: now + 4,
    },
    {
      id: "node-yt-6",
      boardId: "board-yt-pipeline",
      type: "note",
      position: { x: 420, y: 440 },
      width: 250,
      data: {
        title: "THUMBNAIL",
        content: "Split composition: Dark charcoal circuit board glowing with warm amber lines. Bold high-contrast typography.",
        tags: ["graphics", "ctr"],
        color: "#FAF8F5",
      } as NoteNodeData,
      createdAt: now + 5,
      updatedAt: now + 5,
    },
    {
      id: "node-yt-7",
      boardId: "board-yt-pipeline",
      type: "note",
      position: { x: 420, y: 260 },
      width: 250,
      data: {
        title: "UPLOAD",
        content: "Schedule for Thursday 2 PM EST. Prepare community post, chapters, pinned comment with source bibliography.",
        tags: ["publishing"],
        color: "#EDF1EC",
      } as NoteNodeData,
      createdAt: now + 6,
      updatedAt: now + 6,
    },
    {
      id: "node-yt-todo",
      boardId: "board-yt-pipeline",
      type: "todo",
      position: { x: 740, y: 80 },
      width: 280,
      data: {
        title: "Production Checklist",
        items: [
          { id: "td-1", text: "Finalize script read-through", completed: true },
          { id: "td-2", text: "Record studio voiceover", completed: true },
          { id: "td-3", text: "Render 3D circuit animations", completed: false },
          { id: "td-4", text: "Review sponsor integration", completed: false },
          { id: "td-5", text: "Export 4K master ProRes", completed: false },
        ],
        dueDate: "2026-11-05",
        priority: "high",
        color: "#FFFFFF",
      } as TodoNodeData,
      createdAt: now + 7,
      updatedAt: now + 7,
    },
    {
      id: "node-yt-link",
      boardId: "board-yt-pipeline",
      type: "link",
      position: { x: 740, y: 350 },
      width: 280,
      data: {
        url: "https://youtube.com",
        title: "Analog Computing Reference Video",
        description: "Technical documentary on 1960s differential analyzers and aerospace telemetry systems.",
        siteName: "YouTube",
        color: "#FFFFFF",
      } as LinkNodeData,
      createdAt: now + 8,
      updatedAt: now + 8,
    },
    {
      id: "node-yt-comment",
      boardId: "board-yt-pipeline",
      type: "comment",
      position: { x: 420, y: 140 },
      width: 240,
      data: {
        author: "Director Note",
        text: "Make sure the hook in first 20 seconds clarifies why AI chips are adopting analog memory crossbars!",
        color: "#FAF8F5",
        createdAt: now,
      } as CommentNodeData,
      createdAt: now + 9,
      updatedAt: now + 9,
    },
  ];

  // Seed sequential edges for the YouTube pipeline
  const ytEdges: CanvasEdgeRecord[] = [
    {
      id: "edge-1",
      boardId: "board-yt-pipeline",
      source: "node-yt-1",
      target: "node-yt-2",
      type: "smoothstep",
      label: "Research",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "edge-2",
      boardId: "board-yt-pipeline",
      source: "node-yt-2",
      target: "node-yt-3",
      type: "smoothstep",
      label: "Outline",
      createdAt: now + 1,
      updatedAt: now + 1,
    },
    {
      id: "edge-3",
      boardId: "board-yt-pipeline",
      source: "node-yt-3",
      target: "node-yt-4",
      type: "smoothstep",
      label: "Shoot",
      createdAt: now + 2,
      updatedAt: now + 2,
    },
    {
      id: "edge-4",
      boardId: "board-yt-pipeline",
      source: "node-yt-4",
      target: "node-yt-5",
      type: "smoothstep",
      label: "Cut",
      createdAt: now + 3,
      updatedAt: now + 3,
    },
    {
      id: "edge-5",
      boardId: "board-yt-pipeline",
      source: "node-yt-5",
      target: "node-yt-6",
      type: "smoothstep",
      label: "Visuals",
      createdAt: now + 4,
      updatedAt: now + 4,
    },
    {
      id: "edge-6",
      boardId: "board-yt-pipeline",
      source: "node-yt-6",
      target: "node-yt-7",
      type: "smoothstep",
      label: "Publish",
      createdAt: now + 5,
      updatedAt: now + 5,
    },
  ];

  await db.nodes.bulkAdd(ytNodes);
  await db.edges.bulkAdd(ytEdges);

  // Seed Game Dev master board nodes with nested Board cards!
  const gameDevNodes: CanvasNodeRecord[] = [
    {
      id: "node-gd-header",
      boardId: "board-gamedev-master",
      type: "note",
      position: { x: 80, y: 60 },
      width: 480,
      data: {
        title: "PROJECT: CHRONO SHADOWS",
        content: "A retro-futuristic turn-based tactical RPG with time-manipulation rewind mechanics. Navigate into each sub-board below to manage specialized roadmaps.",
        tags: ["rpg", "tactics", "overview"],
        color: "#FAF8F5",
      } as NoteNodeData,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "node-gd-b1",
      boardId: "board-gamedev-master",
      type: "board",
      position: { x: 80, y: 220 },
      width: 220,
      data: {
        targetBoardId: "board-gamedev-design",
        title: "Game Design",
        description: "Core loop, mechanics, combat formulas, balancing.",
        noteCount: 4,
        color: "#FFFFFF",
      } as BoardNodeData,
      createdAt: now + 1,
      updatedAt: now + 1,
    },
    {
      id: "node-gd-b2",
      boardId: "board-gamedev-master",
      type: "board",
      position: { x: 340, y: 220 },
      width: 220,
      data: {
        targetBoardId: "board-gamedev-levels",
        title: "Level Design",
        description: "Dungeon tilesets, interactive puzzle props, boss arenas.",
        noteCount: 3,
        color: "#FFFFFF",
      } as BoardNodeData,
      createdAt: now + 2,
      updatedAt: now + 2,
    },
    {
      id: "node-gd-b3",
      boardId: "board-gamedev-master",
      type: "board",
      position: { x: 80, y: 390 },
      width: 220,
      data: {
        targetBoardId: "board-gamedev-programming",
        title: "Programming",
        description: "ECS architecture, deterministic rollback, pathfinding.",
        noteCount: 5,
        color: "#FFFFFF",
      } as BoardNodeData,
      createdAt: now + 3,
      updatedAt: now + 3,
    },
    {
      id: "node-gd-b4",
      boardId: "board-gamedev-master",
      type: "board",
      position: { x: 340, y: 390 },
      width: 220,
      data: {
        targetBoardId: "board-gamedev-art",
        title: "Art References",
        description: "Character sketches, isometric sprite sheets, lighting.",
        noteCount: 6,
        color: "#FFFFFF",
      } as BoardNodeData,
      createdAt: now + 4,
      updatedAt: now + 4,
    },
    {
      id: "node-gd-table",
      boardId: "board-gamedev-master",
      type: "table",
      position: { x: 620, y: 60 },
      width: 380,
      data: {
        title: "Milestone Deadlines",
        columns: ["Milestone", "Target", "Status"],
        rows: [
          ["Vertical Slice Demo", "Q1 2027", "In Progress"],
          ["Combat Alpha Playtest", "Q2 2027", "Planned"],
          ["Steam Next Fest Build", "Q3 2027", "Planned"],
          ["Early Access Launch", "Q4 2027", "Draft"],
        ],
        color: "#FFFFFF",
      } as TableNodeData,
      createdAt: now + 5,
      updatedAt: now + 5,
    },
  ];

  const gameDevEdges: CanvasEdgeRecord[] = [
    {
      id: "edge-gd-1",
      boardId: "board-gamedev-master",
      source: "node-gd-header",
      target: "node-gd-b1",
      type: "smoothstep",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "edge-gd-2",
      boardId: "board-gamedev-master",
      source: "node-gd-header",
      target: "node-gd-b2",
      type: "smoothstep",
      createdAt: now + 1,
      updatedAt: now + 1,
    },
    {
      id: "edge-gd-3",
      boardId: "board-gamedev-master",
      source: "node-gd-header",
      target: "node-gd-b3",
      type: "smoothstep",
      createdAt: now + 2,
      updatedAt: now + 2,
    },
    {
      id: "edge-gd-4",
      boardId: "board-gamedev-master",
      source: "node-gd-header",
      target: "node-gd-b4",
      type: "smoothstep",
      createdAt: now + 3,
      updatedAt: now + 3,
    },
  ];

  await db.nodes.bulkAdd(gameDevNodes);
  await db.edges.bulkAdd(gameDevEdges);

  // Seed study board nodes
  const studyNodes: CanvasNodeRecord[] = [
    {
      id: "node-study-1",
      boardId: "board-study-algo",
      type: "note",
      position: { x: 80, y: 100 },
      width: 260,
      data: {
        title: "Graph Algorithms",
        content: "Dijkstra, A* Pathfinding, Bellman-Ford, Floyd-Warshall. Focus on edge relaxation invariants and cycle detection.",
        tags: ["graphs", "dsa"],
        color: "#FFFFFF",
      } as NoteNodeData,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "node-study-2",
      boardId: "board-study-algo",
      type: "note",
      position: { x: 400, y: 100 },
      width: 260,
      data: {
        title: "Dynamic Programming",
        content: "Identify subproblems, recurrence relation, memoization table vs iterative tabulation with state compression.",
        tags: ["dp", "optimization"],
        color: "#FAF8F5",
      } as NoteNodeData,
      createdAt: now + 1,
      updatedAt: now + 1,
    },
    {
      id: "node-study-3",
      boardId: "board-study-algo",
      type: "todo",
      position: { x: 720, y: 100 },
      width: 280,
      data: {
        title: "Practice Queue",
        items: [
          { id: "sq-1", text: "LeetCode 210: Course Schedule II", completed: true },
          { id: "sq-2", text: "LeetCode 312: Burst Balloons", completed: true },
          { id: "sq-3", text: "LeetCode 787: Cheapest Flights with K Stops", completed: false },
          { id: "sq-4", text: "Implement Disjoint Set Union by rank", completed: false },
        ],
        dueDate: "2026-11-01",
        priority: "medium",
        color: "#FFFFFF",
      } as TodoNodeData,
      createdAt: now + 2,
      updatedAt: now + 2,
    },
  ];

  const studyEdges: CanvasEdgeRecord[] = [
    {
      id: "edge-study-1",
      boardId: "board-study-algo",
      source: "node-study-1",
      target: "node-study-2",
      type: "smoothstep",
      label: "DAG State Space",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "edge-study-2",
      boardId: "board-study-algo",
      source: "node-study-2",
      target: "node-study-3",
      type: "smoothstep",
      label: "Practice",
      createdAt: now + 1,
      updatedAt: now + 1,
    },
  ];

  await db.nodes.bulkAdd(studyNodes);
  await db.edges.bulkAdd(studyEdges);
}

// Database helper functions
export async function getWorkspaces(): Promise<Workspace[]> {
  const db = getDb();
  await initDatabase();
  return db.workspaces.orderBy("createdAt").toArray();
}

export async function getWorkspace(id: string): Promise<Workspace | undefined> {
  const db = getDb();
  await initDatabase();
  return db.workspaces.get(id);
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const db = getDb();
  await db.workspaces.put({ ...workspace, updatedAt: Date.now() });
}

export async function createWorkspace(
  name: string,
  description?: string,
  icon?: string
): Promise<Workspace> {
  const db = getDb();
  await initDatabase();
  const now = Date.now();
  const id = `ws-${Math.random().toString(36).substring(2, 9)}`;
  const workspace: Workspace = {
    id,
    name: name.trim() || "Untitled Workspace",
    description: description?.trim() || "",
    icon: icon || "Folder",
    createdAt: now,
    updatedAt: now,
  };
  await db.workspaces.put(workspace);
  return workspace;
}

export async function renameWorkspace(id: string, name: string): Promise<void> {
  const db = getDb();
  await initDatabase();
  await db.workspaces.update(id, {
    name: name.trim(),
    updatedAt: Date.now(),
  });
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = getDb();
  const boards = await db.boards.where("workspaceId").equals(id).toArray();
  for (const board of boards) {
    await deleteBoard(board.id);
  }
  await db.workspaces.delete(id);
}

export async function getBoards(workspaceId: string): Promise<Board[]> {
  const db = getDb();
  await initDatabase();
  return db.boards.where("workspaceId").equals(workspaceId).toArray();
}

export async function getAllBoards(): Promise<Board[]> {
  const db = getDb();
  await initDatabase();
  return db.boards.orderBy("lastAccessedAt").reverse().toArray();
}

export async function getBoard(id: string): Promise<Board | undefined> {
  const db = getDb();
  await initDatabase();
  return db.boards.get(id);
}

export async function saveBoard(board: Board): Promise<void> {
  const db = getDb();
  await db.boards.put({ ...board, updatedAt: Date.now() });
}

export async function updateBoardViewport(
  boardId: string,
  viewport: { x: number; y: number; zoom: number }
): Promise<void> {
  const db = getDb();
  await db.boards.update(boardId, {
    viewport,
    updatedAt: Date.now(),
    lastAccessedAt: Date.now(),
  });
}

export async function deleteBoard(boardId: string): Promise<void> {
  const db = getDb();
  await db.nodes.where("boardId").equals(boardId).delete();
  await db.edges.where("boardId").equals(boardId).delete();
  if (db.drawings) {
    await db.drawings.where("boardId").equals(boardId).delete();
  }
  await db.boards.delete(boardId);
}

export async function getBoardDrawings(boardId: string): Promise<CanvasDrawingRecord[]> {
  const db = getDb();
  await initDatabase();
  if (!db.drawings) return [];
  return db.drawings.where("boardId").equals(boardId).toArray();
}

export async function saveBoardDrawings(boardId: string, drawings: CanvasDrawingRecord[]): Promise<void> {
  const db = getDb();
  await initDatabase();
  if (!db.drawings) return;
  await db.transaction("rw", db.drawings, async () => {
    await db.drawings.where("boardId").equals(boardId).delete();
    if (drawings.length > 0) {
      await db.drawings.bulkAdd(drawings);
    }
  });
}

export async function getBoardNodes(boardId: string): Promise<CanvasNodeRecord[]> {
  const db = getDb();
  await initDatabase();
  return db.nodes.where("boardId").equals(boardId).toArray();
}

export async function saveBoardNodes(boardId: string, nodes: CanvasNodeRecord[]): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.nodes, async () => {
    // Delete existing nodes for this board and add updated list
    await db.nodes.where("boardId").equals(boardId).delete();
    if (nodes.length > 0) {
      await db.nodes.bulkAdd(nodes);
    }
  });
}

export async function putNode(node: CanvasNodeRecord): Promise<void> {
  const db = getDb();
  await db.nodes.put({ ...node, updatedAt: Date.now() });
}

export async function deleteNode(id: string): Promise<void> {
  const db = getDb();
  await db.nodes.delete(id);
  await db.edges.where("source").equals(id).or("target").equals(id).delete();
}

export async function getBoardEdges(boardId: string): Promise<CanvasEdgeRecord[]> {
  const db = getDb();
  await initDatabase();
  return db.edges.where("boardId").equals(boardId).toArray();
}

export async function saveBoardEdges(boardId: string, edges: CanvasEdgeRecord[]): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.edges, async () => {
    await db.edges.where("boardId").equals(boardId).delete();
    if (edges.length > 0) {
      await db.edges.bulkAdd(edges);
    }
  });
}

export async function putEdge(edge: CanvasEdgeRecord): Promise<void> {
  const db = getDb();
  await db.edges.put({ ...edge, updatedAt: Date.now() });
}

export async function deleteEdge(id: string): Promise<void> {
  const db = getDb();
  await db.edges.delete(id);
}

export interface SearchResult {
  workspaceId?: string;
  boardId: string;
  boardName: string;
  workspaceName?: string;
  nodeId?: string;
  title: string;
  snippet: string;
  type: "workspace" | "board" | "note" | "todo" | "link" | "table" | "comment";
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  const db = getDb();
  await initDatabase();

  const workspaces = await db.workspaces.toArray();
  const wsMap = new Map(workspaces.map((w) => [w.id, w.name]));

  const boards = await db.boards.toArray();
  const boardMap = new Map(boards.map((b) => [b.id, b]));

  const results: SearchResult[] = [];

  // Match workspaces
  for (const ws of workspaces) {
    if (
      ws.name.toLowerCase().includes(q) ||
      (ws.description && ws.description.toLowerCase().includes(q))
    ) {
      const firstBoard = boards.find((b) => b.workspaceId === ws.id);
      results.push({
        workspaceId: ws.id,
        boardId: firstBoard ? firstBoard.id : "",
        boardName: firstBoard ? firstBoard.name : "Workspace",
        workspaceName: ws.name,
        title: ws.name,
        snippet: ws.description || "Workspace",
        type: "workspace",
      });
    }
  }

  // Match boards
  for (const board of boards) {
    if (
      board.name.toLowerCase().includes(q) ||
      (board.description && board.description.toLowerCase().includes(q))
    ) {
      results.push({
        boardId: board.id,
        boardName: board.name,
        workspaceName: wsMap.get(board.workspaceId),
        title: board.name,
        snippet: board.description || "Board title match",
        type: "board",
      });
    }
  }

  // Match nodes
  const nodes = await db.nodes.toArray();
  for (const node of nodes) {
    const board = boardMap.get(node.boardId);
    if (!board) continue;

    const data = node.data as any;
    let title = "";
    let snippet = "";
    let matches = false;

    if (node.type === "note") {
      title = data.title || "Untitled Note";
      const content = data.content || "";
      const tags = (data.tags || []).join(" ");
      if (
        title.toLowerCase().includes(q) ||
        content.toLowerCase().includes(q) ||
        tags.toLowerCase().includes(q)
      ) {
        matches = true;
        snippet = content.slice(0, 100) || tags;
      }
    } else if (node.type === "todo") {
      title = data.title || "To-do List";
      const items = (data.items || []).map((i: any) => i.text).join(", ");
      if (title.toLowerCase().includes(q) || items.toLowerCase().includes(q)) {
        matches = true;
        snippet = items.slice(0, 100);
      }
    } else if (node.type === "link") {
      title = data.title || data.url || "Link";
      const desc = data.description || "";
      if (
        title.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        data.url.toLowerCase().includes(q)
      ) {
        matches = true;
        snippet = desc || data.url;
      }
    } else if (node.type === "table") {
      title = data.title || "Table";
      const allCells = (data.rows || []).flat().join(" ");
      if (title.toLowerCase().includes(q) || allCells.toLowerCase().includes(q)) {
        matches = true;
        snippet = allCells.slice(0, 100);
      }
    } else if (node.type === "comment") {
      title = data.author ? `Comment by ${data.author}` : "Comment";
      const text = data.text || "";
      if (title.toLowerCase().includes(q) || text.toLowerCase().includes(q)) {
        matches = true;
        snippet = text.slice(0, 100);
      }
    }

    if (matches) {
      results.push({
        boardId: board.id,
        boardName: board.name,
        workspaceName: wsMap.get(board.workspaceId),
        nodeId: node.id,
        title,
        snippet,
        type: node.type as any,
      });
    }
  }

  return results.slice(0, 30);
}
