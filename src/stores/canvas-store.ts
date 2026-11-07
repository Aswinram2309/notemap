import { create } from "zustand";
import {
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
} from "@xyflow/react";
import {
  CanvasNodeRecord,
  CanvasEdgeRecord,
  CanvasNodeType,
  NoteNodeData,
  TodoNodeData,
  LinkNodeData,
  BoardNodeData,
  ColumnNodeData,
  CommentNodeData,
  TableNodeData,
  ImageNodeData,
} from "@/types/node";
import { CanvasDrawingRecord } from "@/types/drawing";
import {
  getBoardNodes,
  getBoardEdges,
  saveBoardNodes,
  saveBoardEdges,
  getBoardDrawings,
  saveBoardDrawings,
  updateBoardViewport,
} from "@/lib/db";
import { generateId } from "@/lib/utils";

export type ActiveTool =
  | "select"
  | "note"
  | "link"
  | "todo"
  | "line"
  | "board"
  | "column"
  | "comment"
  | "table"
  | "image"
  | "file"
  | "draw"
  | "trash";

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
  drawings: CanvasDrawingRecord[];
}

interface CanvasState {
  currentBoardId: string | null;
  nodes: Node[];
  edges: Edge[];
  drawings: CanvasDrawingRecord[];
  activeTool: ActiveTool;
  activeDrawColor: string;
  activeDrawWidth: number;
  isEraserActive: boolean;
  saveStatus: "saved" | "saving" | "offline";
  lastSavedAt: number | null;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  clipboardNode: Node | null;

  // History
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];

  // Actions
  setBoard: (boardId: string) => Promise<void>;
  setTool: (tool: ActiveTool) => void;
  setActiveDrawColor: (color: string) => void;
  setActiveDrawWidth: (width: number) => void;
  setIsEraserActive: (active: boolean) => void;
  addDrawing: (drawing: CanvasDrawingRecord) => void;
  deleteDrawing: (id: string) => void;
  clearDrawings: () => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: () => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;

  addNode: (
    type: CanvasNodeType,
    position?: { x: number; y: number },
    customData?: any
  ) => Promise<string>;
  updateNodeData: (id: string, dataPatch: Record<string, any>) => void;
  updateNodeColor: (id: string, color: string) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  duplicateNode: (id: string) => void;
  deleteNode: (id: string) => void;
  deleteSelected: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  copyNode: (id: string) => void;
  pasteNode: (position?: { x: number; y: number }) => void;

  updateEdgeLabel: (id: string, label: string) => void;
  deleteEdge: (id: string) => void;
  reconnectEdge: (oldEdge: Edge, newConnection: Connection) => void;
  flipEdgeDirection: (id: string) => void;
  connectNodes: (sourceId: string, targetId: string, label?: string) => void;

  undo: () => void;
  redo: () => void;
  saveCurrentState: () => Promise<void>;
  scheduleAutosave: () => void;
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let viewportSaveTimer: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_EDGE_STYLE = {
  stroke: "#454545",
  strokeWidth: 1.5,
};

const DEFAULT_MARKER_END = {
  type: MarkerType.ArrowClosed,
  color: "#454545",
  width: 14,
  height: 14,
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  currentBoardId: null,
  nodes: [],
  edges: [],
  drawings: [],
  activeTool: "select",
  activeDrawColor: "#292929",
  activeDrawWidth: 2.5,
  isEraserActive: false,
  saveStatus: "saved",
  lastSavedAt: null,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  clipboardNode: null,
  undoStack: [],
  redoStack: [],

  setTool: (tool) => set({ activeTool: tool, isEraserActive: false }),
  setActiveDrawColor: (color) => set({ activeDrawColor: color, isEraserActive: false }),
  setActiveDrawWidth: (width) => set({ activeDrawWidth: width }),
  setIsEraserActive: (active) => set({ isEraserActive: active }),

  addDrawing: (drawing) => {
    const { nodes, edges, drawings, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
      drawings: [...drawings, drawing],
    });
    get().scheduleAutosave();
  },

  deleteDrawing: (id) => {
    const { nodes, edges, drawings, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
      drawings: drawings.filter((d) => d.id !== id),
    });
    get().scheduleAutosave();
  },

  clearDrawings: () => {
    const { nodes, edges, drawings, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
      drawings: [],
    });
    get().scheduleAutosave();
  },

  setBoard: async (boardId: string) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("notemap_active_board", boardId);
      }
      // Clear any pending autosaves
      if (autosaveTimer) clearTimeout(autosaveTimer);

      const dbNodes = await getBoardNodes(boardId);
      const dbEdges = await getBoardEdges(boardId);
      const dbDrawings = await getBoardDrawings(boardId);

      const flowNodes: Node[] = dbNodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data as Record<string, any>,
        style: {
          width: n.width,
          height: n.height,
          zIndex: n.zIndex || 1,
        },
      }));

      const flowEdges: Edge[] = dbEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        type: e.type || "smoothstep",
        style: DEFAULT_EDGE_STYLE,
        markerEnd: DEFAULT_MARKER_END,
        animated: e.animated,
      }));

      set({
        currentBoardId: boardId,
        nodes: flowNodes,
        edges: flowEdges,
        drawings: dbDrawings,
        undoStack: [],
        redoStack: [],
        selectedNodeIds: [],
        selectedEdgeIds: [],
        saveStatus: "saved",
        lastSavedAt: Date.now(),
      });
    } catch (e) {
      console.error("Failed to load canvas for board", boardId, e);
      set({ saveStatus: "offline" });
    }
  },

  onNodesChange: (changes: NodeChange[]) => {
    const currentNodes = get().nodes;
    const nextNodes = applyNodeChanges(changes, currentNodes);

    // Track selections
    const selectedIds = nextNodes.filter((n) => n.selected).map((n) => n.id);

    set({
      nodes: nextNodes,
      selectedNodeIds: selectedIds,
    });

    // If changes include dimension or remove, schedule save
    const hasStructureChange = changes.some(
      (c) => c.type === "remove" || c.type === "dimensions"
    );
    if (hasStructureChange) {
      get().scheduleAutosave();
    }
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const currentEdges = get().edges;
    const nextEdges = applyEdgeChanges(changes, currentEdges);
    const selectedEdgeIds = nextEdges.filter((e) => e.selected).map((e) => e.id);
    set({ edges: nextEdges, selectedEdgeIds });

    const hasStructureChange = changes.some((c) => c.type === "remove");
    if (hasStructureChange) {
      get().scheduleAutosave();
    }
  },

  onConnect: (connection: Connection) => {
    const { nodes, edges, drawings, undoStack } = get();

    // Push history snapshot before connecting
    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const newEdge: Edge = {
      id: generateId("edge"),
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: "smoothstep",
      style: DEFAULT_EDGE_STYLE,
      markerEnd: DEFAULT_MARKER_END,
    };

    const nextEdges = addEdge(newEdge, edges);
    set({ edges: nextEdges });
    get().scheduleAutosave();
  },

  onNodeDragStop: () => {
    // Commit node position save once dragging completes
    get().scheduleAutosave();
  },

  onViewportChange: (viewport) => {
    const boardId = get().currentBoardId;
    if (!boardId) return;

    if (viewportSaveTimer) clearTimeout(viewportSaveTimer);
    viewportSaveTimer = setTimeout(async () => {
      try {
        await updateBoardViewport(boardId, viewport);
      } catch (e) {
        console.error("Failed to save viewport", e);
      }
    }, 800);
  },

  addNode: async (type: CanvasNodeType, position, customData) => {
    const { currentBoardId, nodes, edges, drawings, undoStack } = get();
    if (!currentBoardId) return "";

    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const nodeId = generateId("node");
    const count = nodes.length;
    const defaultPos = position || {
      x: 80 + (count % 3) * 300,
      y: 80 + Math.floor(count / 3) * 220,
    };

    let initialData: any = {};
    let defaultWidth = 260;

    switch (type) {
      case "note":
        initialData = {
          title: "Untitled Note",
          content: "",
          tags: [],
          color: "#FFFFFF",
          ...customData,
        } as NoteNodeData;
        break;

      case "todo":
        initialData = {
          title: "To-do List",
          items: [
            { id: generateId("item"), text: "Task item 1", completed: false },
          ],
          dueDate: "",
          priority: "medium",
          color: "#FFFFFF",
          ...customData,
        } as TodoNodeData;
        defaultWidth = 280;
        break;

      case "link":
        initialData = {
          url: "https://",
          title: "New Link",
          description: "",
          siteName: "",
          color: "#FFFFFF",
          ...customData,
        } as LinkNodeData;
        defaultWidth = 280;
        break;

      case "board":
        initialData = {
          targetBoardId: customData?.targetBoardId || "",
          title: customData?.title || "New Sub-Board",
          description: "Click to open canvas workspace",
          noteCount: 0,
          color: "#FFFFFF",
          ...customData,
        } as BoardNodeData;
        defaultWidth = 220;
        break;

      case "column":
        initialData = {
          title: "Group Column",
          width: 300,
          height: 480,
          color: "rgba(240, 240, 235, 0.4)",
          ...customData,
        } as ColumnNodeData;
        defaultWidth = 300;
        break;

      case "comment":
        initialData = {
          author: "Note",
          text: "Quick annotation or memo",
          color: "#FAF8F5",
          createdAt: Date.now(),
          ...customData,
        } as CommentNodeData;
        defaultWidth = 220;
        break;

      case "table":
        initialData = {
          title: "Data Table",
          columns: ["Item", "Category", "Status"],
          rows: [
            ["Row 1", "General", "Pending"],
            ["Row 2", "General", "Done"],
          ],
          color: "#FFFFFF",
          ...customData,
        } as TableNodeData;
        defaultWidth = 360;
        break;

      case "image":
        initialData = {
          url: customData?.url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
          caption: "Visual Reference",
          ...customData,
        } as ImageNodeData;
        defaultWidth = 280;
        break;

      case "file":
        initialData = {
          fileName: customData?.fileName || "document.pdf",
          fileType: customData?.fileType || "application/pdf",
          fileSize: customData?.fileSize || 1024,
          description: "Reference Attachment",
          ...customData,
        };
        defaultWidth = 240;
        break;

      default:
        initialData = { title: "Item", content: "", color: "#FFFFFF" };
    }

    const newNode: Node = {
      id: nodeId,
      type,
      position: defaultPos,
      data: initialData,
      selected: true,
      style: {
        width: defaultWidth,
        zIndex: type === "column" ? 0 : 2,
      },
    };

    const nextNodes = [
      ...nodes.map((n) => ({ ...n, selected: false })),
      newNode,
    ];

    set({ nodes: nextNodes, selectedNodeIds: [nodeId] });
    get().scheduleAutosave();
    return nodeId;
  },

  updateNodeData: (id: string, dataPatch: Record<string, any>) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...dataPatch,
            lastModified: Date.now(),
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().scheduleAutosave();
  },

  updateNodeColor: (id: string, color: string) => {
    const { nodes, edges, drawings, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const nextNodes = nodes.map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            color,
          },
        };
      }
      return node;
    });

    set({ nodes: nextNodes });
    get().scheduleAutosave();
  },

  selectNode: (id: string | null) => {
    const currentNodes = get().nodes;
    const nextNodes = currentNodes.map((n) => ({
      ...n,
      selected: id ? n.id === id : false,
    }));
    const nextEdges = get().edges.map((e) => ({
      ...e,
      selected: false,
    }));
    set({
      nodes: nextNodes,
      edges: nextEdges,
      selectedNodeIds: id ? [id] : [],
      selectedEdgeIds: [],
    });
  },

  selectEdge: (id: string | null) => {
    const nextNodes = get().nodes.map((n) => ({
      ...n,
      selected: false,
    }));
    const nextEdges = get().edges.map((e) => ({
      ...e,
      selected: id ? e.id === id : false,
    }));
    set({
      nodes: nextNodes,
      edges: nextEdges,
      selectedNodeIds: [],
      selectedEdgeIds: id ? [id] : [],
    });
  },

  duplicateNode: (id: string) => {
    const { nodes, edges, drawings, undoStack } = get();
    const sourceNode = nodes.find((n) => n.id === id);
    if (!sourceNode) return;

    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const newId = generateId("node");
    const duplicated: Node = {
      ...sourceNode,
      id: newId,
      position: {
        x: sourceNode.position.x + 30,
        y: sourceNode.position.y + 30,
      },
      selected: true,
      data: JSON.parse(JSON.stringify(sourceNode.data)),
    };

    const nextNodes: Node[] = [
      ...nodes.map((n) => ({ ...n, selected: false })),
      duplicated,
    ];
    set({ nodes: nextNodes, selectedNodeIds: [newId] });
    get().scheduleAutosave();
  },

  deleteNode: (id: string) => {
    const { nodes, edges, drawings, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const nextNodes = nodes.filter((n) => n.id !== id);
    const nextEdges = edges.filter((e) => e.source !== id && e.target !== id);

    set({
      nodes: nextNodes,
      edges: nextEdges,
      selectedNodeIds: get().selectedNodeIds.filter((nid) => nid !== id),
    });

    get().scheduleAutosave();
  },

  deleteSelected: () => {
    const { nodes, edges, drawings, selectedNodeIds, selectedEdgeIds, undoStack } = get();
    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return;

    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const nodeIdSet = new Set(selectedNodeIds);
    const edgeIdSet = new Set(selectedEdgeIds);

    const nextNodes = nodes.filter((n) => !nodeIdSet.has(n.id));
    const nextEdges = edges.filter(
      (e) => !nodeIdSet.has(e.source) && !nodeIdSet.has(e.target) && !edgeIdSet.has(e.id)
    );

    set({
      nodes: nextNodes,
      edges: nextEdges,
      selectedNodeIds: [],
      selectedEdgeIds: [],
    });

    get().scheduleAutosave();
  },

  bringToFront: (id: string) => {
    const nodes = get().nodes;
    let maxZ = 1;
    nodes.forEach((n) => {
      const z = Number(n.style?.zIndex || 1);
      if (z > maxZ) maxZ = z;
    });

    const nextNodes = nodes.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          style: { ...n.style, zIndex: maxZ + 1 },
        };
      }
      return n;
    });

    set({ nodes: nextNodes });
    get().scheduleAutosave();
  },

  sendToBack: (id: string) => {
    const nodes = get().nodes;
    let minZ = 1;
    nodes.forEach((n) => {
      const z = Number(n.style?.zIndex || 1);
      if (z < minZ) minZ = z;
    });

    const nextNodes = nodes.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          style: { ...n.style, zIndex: Math.max(0, minZ - 1) },
        };
      }
      return n;
    });

    set({ nodes: nextNodes });
    get().scheduleAutosave();
  },

  copyNode: (id: string) => {
    const node = get().nodes.find((n) => n.id === id);
    if (node) {
      set({ clipboardNode: node });
    }
  },

  pasteNode: (position) => {
    const clipboard = get().clipboardNode;
    if (!clipboard) return;

    const { nodes, edges, drawings, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const newId = generateId("node");
    const pastePos = position || {
      x: clipboard.position.x + 40,
      y: clipboard.position.y + 40,
    };

    const newNode: Node = {
      ...clipboard,
      id: newId,
      position: pastePos,
      selected: true,
      data: JSON.parse(JSON.stringify(clipboard.data)),
    };

    const nextNodes: Node[] = [
      ...nodes.map((n) => ({ ...n, selected: false })),
      newNode,
    ];
    set({ nodes: nextNodes, selectedNodeIds: [newId] });
    get().scheduleAutosave();
  },

  updateEdgeLabel: (id: string, label: string) => {
    const nextEdges = get().edges.map((e) => {
      if (e.id === id) {
        return { ...e, label };
      }
      return e;
    });

    set({ edges: nextEdges });
    get().scheduleAutosave();
  },

  deleteEdge: (id: string) => {
    const { nodes, edges, drawings, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const nextEdges = edges.filter((e) => e.id !== id);
    set({
      edges: nextEdges,
      selectedEdgeIds: get().selectedEdgeIds.filter((eid) => eid !== id),
    });
    get().scheduleAutosave();
  },

  reconnectEdge: (oldEdge: Edge, newConnection: Connection) => {
    const { nodes, edges, drawings, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const nextEdges = edges.map((e) => {
      if (e.id === oldEdge.id) {
        return {
          ...e,
          source: newConnection.source || e.source,
          target: newConnection.target || e.target,
          sourceHandle: newConnection.sourceHandle ?? e.sourceHandle,
          targetHandle: newConnection.targetHandle ?? e.targetHandle,
        };
      }
      return e;
    });

    set({ edges: nextEdges });
    get().scheduleAutosave();
  },

  flipEdgeDirection: (id: string) => {
    const { nodes, edges, drawings, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const nextEdges = edges.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          source: e.target,
          target: e.source,
          sourceHandle: e.targetHandle,
          targetHandle: e.sourceHandle,
        };
      }
      return e;
    });

    set({ edges: nextEdges });
    get().scheduleAutosave();
  },

  connectNodes: (sourceId: string, targetId: string, label?: string) => {
    const { nodes, edges, drawings, undoStack } = get();
    const exists = edges.some(
      (e) => (e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId)
    );
    if (exists) return;

    set({
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      redoStack: [],
    });

    const newEdge: Edge = {
      id: generateId("edge"),
      source: sourceId,
      target: targetId,
      type: "smoothstep",
      label: label || undefined,
      style: DEFAULT_EDGE_STYLE,
      markerEnd: DEFAULT_MARKER_END,
    };

    set({ edges: [...edges, newEdge] });
    get().scheduleAutosave();
  },

  undo: () => {
    const { undoStack, redoStack, nodes, edges, drawings } = get();
    if (undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);

    set({
      undoStack: newUndo,
      redoStack: [{ nodes, edges, drawings }, ...redoStack.slice(0, 25)],
      nodes: previous.nodes,
      edges: previous.edges,
      drawings: previous.drawings || [],
    });

    get().scheduleAutosave();
  },

  redo: () => {
    const { undoStack, redoStack, nodes, edges, drawings } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[0];
    const newRedo = redoStack.slice(1);

    set({
      redoStack: newRedo,
      undoStack: [...undoStack.slice(-25), { nodes, edges, drawings }],
      nodes: next.nodes,
      edges: next.edges,
      drawings: next.drawings || [],
    });

    get().scheduleAutosave();
  },

  saveCurrentState: async () => {
    const { currentBoardId, nodes, edges, drawings } = get();
    if (!currentBoardId) return;

    set({ saveStatus: "saving" });

    try {
      const now = Date.now();

      const dbNodes: CanvasNodeRecord[] = nodes.map((n) => ({
        id: n.id,
        boardId: currentBoardId,
        type: (n.type as CanvasNodeType) || "note",
        position: n.position,
        width: typeof n.style?.width === "number" ? n.style.width : 260,
        height: typeof n.style?.height === "number" ? n.style.height : undefined,
        zIndex: typeof n.style?.zIndex === "number" ? n.style.zIndex : 1,
        color: (n.data as any)?.color || "#FFFFFF",
        data: n.data as any,
        createdAt: now,
        updatedAt: now,
      }));

      const dbEdges: CanvasEdgeRecord[] = edges.map((e) => ({
        id: e.id,
        boardId: currentBoardId,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: typeof e.label === "string" ? e.label : undefined,
        type: (e.type as any) || "smoothstep",
        animated: e.animated,
        createdAt: now,
        updatedAt: now,
      }));

      await saveBoardNodes(currentBoardId, dbNodes);
      await saveBoardEdges(currentBoardId, dbEdges);
      await saveBoardDrawings(currentBoardId, drawings);

      set({ saveStatus: "saved", lastSavedAt: Date.now() });
    } catch (e) {
      console.error("Autosave failed", e);
      set({ saveStatus: "offline" });
    }
  },

  scheduleAutosave: () => {
    set({ saveStatus: "saving" });
    if (autosaveTimer) clearTimeout(autosaveTimer);

    autosaveTimer = setTimeout(() => {
      get().saveCurrentState();
    }, 600);
  },
}));
