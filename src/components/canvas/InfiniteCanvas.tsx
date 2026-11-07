"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ConnectionMode,
  useReactFlow,
  getSmoothStepPath,
  ViewportPortal,
  type Connection,
  type Edge,
} from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { CanvasNodeType } from "@/types/node";
import { CanvasDrawingRecord, DrawingPoint } from "@/types/drawing";
import { NoteNode } from "./NoteNode";
import { TodoNode } from "./TodoNode";
import { LinkNode } from "./LinkNode";
import { BoardNode } from "./BoardNode";
import { ColumnNode } from "./ColumnNode";
import { CommentNode } from "./CommentNode";
import { TableNode } from "./TableNode";
import { ImageNode } from "./ImageNode";
import { FileNode } from "./FileNode";
import { Connector } from "./Connector";
import { ConnectionLine } from "./ConnectionLine";
import { ContextMenu } from "./ContextMenu";
import { DrawToolbar } from "./DrawToolbar";
import { findNearestNodeHandle } from "./connector-utils";
import { pointsToSmoothPath } from "./drawing-utils";
import { generateId } from "@/lib/utils";
import { FolderPlus } from "lucide-react";

const nodeTypes = {
  note: NoteNode,
  todo: TodoNode,
  link: LinkNode,
  board: BoardNode,
  column: ColumnNode,
  comment: CommentNode,
  table: TableNode,
  image: ImageNode,
  file: FileNode,
};

const edgeTypes = {
  smoothstep: Connector,
  straight: Connector,
  bezier: Connector,
};

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
  nodeType: string;
}

interface LineDrawingState {
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  startNodeId: string | null;
  startHandleId: string | null;
  endNodeId: string | null;
  endHandleId: string | null;
  isDragging: boolean;
  dragDistance: number;
}

interface InfiniteCanvasProps {
  onOpenSearch: () => void;
  onOpenCreateBoard?: () => void;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  onOpenSearch,
  onOpenCreateBoard,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    currentBoardId,
    nodes,
    edges,
    drawings,
    activeTool,
    setTool,
    activeDrawColor,
    activeDrawWidth,
    isEraserActive,
    addDrawing,
    deleteDrawing,
    onNodesChange,
    onEdgesChange,
    onConnect: storeOnConnect,
    reconnectEdge,
    deleteEdge,
    onNodeDragStop,
    onViewportChange,
    addNode,
    deleteSelected,
    duplicateNode,
    selectNode,
    selectEdge,
    selectedNodeIds,
    undo,
    redo,
    saveCurrentState,
  } = useCanvasStore();

  const { activeBoard, activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Method A tracking for auto-snapping on release
  const connectingStartRef = useRef<{
    nodeId: string | null;
    handleId: string | null;
    handleType: any;
  } | null>(null);

  // Reconnection tracking for detaching to empty space
  const reconnectingRef = useRef<{
    edge: Edge;
    handleType: string;
    reconnected: boolean;
  } | null>(null);

  // Method B line tool drawing state
  const [lineDrawing, setLineDrawing] = useState<LineDrawingState | null>(null);

  // Freehand pen active stroke state
  const [activeStrokePoints, setActiveStrokePoints] = useState<DrawingPoint[]>([]);
  const isDrawingStrokeRef = useRef(false);

  // Handle Drag & Drop from left toolbar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData("application/notemap-node-type") as CanvasNodeType;
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      await addNode(nodeType, position);
    },
    [screenToFlowPosition, addNode]
  );

  // Context Menu on Node right-click
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeType: node.type || "note",
      });
    },
    []
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
    setContextMenu(null);
  }, [selectNode, selectEdge]);

  // Method A: Connect Start from a Note Handle
  const onConnectStart = useCallback((_: any, params: any) => {
    connectingStartRef.current = params;
  }, []);

  // Method A: Successful Connect
  const onConnect = useCallback(
    (connection: Connection) => {
      connectingStartRef.current = null;
      storeOnConnect(connection);
    },
    [storeOnConnect]
  );

  // Method A: Connect End - Snap to nearest note if mouse not dropped with pixel precision
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectingStartRef.current?.nodeId) return;

      const clientX =
        "clientX" in event
          ? event.clientX
          : event.changedTouches?.[0]?.clientX;
      const clientY =
        "clientY" in event
          ? event.clientY
          : event.changedTouches?.[0]?.clientY;

      if (typeof clientX === "number" && typeof clientY === "number") {
        const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
        const nearest = findNearestNodeHandle(
          flowPos,
          nodes,
          connectingStartRef.current.nodeId,
          85
        );

        if (nearest) {
          storeOnConnect({
            source: connectingStartRef.current.nodeId,
            sourceHandle: connectingStartRef.current.handleId,
            target: nearest.nodeId,
            targetHandle: nearest.handleId,
          });
        }
      }

      connectingStartRef.current = null;
    },
    [nodes, screenToFlowPosition, storeOnConnect]
  );

  // Reconnection handlers (Requirement 4)
  const onReconnectStart = useCallback(
    (_: React.MouseEvent, edge: Edge, handleType: any) => {
      reconnectingRef.current = { edge, handleType, reconnected: false };
    },
    []
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (reconnectingRef.current) {
        reconnectingRef.current.reconnected = true;
      }
      reconnectEdge(oldEdge, newConnection);
    },
    [reconnectEdge]
  );

  const onReconnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, edge: Edge) => {
      if (reconnectingRef.current && !reconnectingRef.current.reconnected) {
        const clientX =
          "clientX" in event ? event.clientX : event.changedTouches?.[0]?.clientX;
        const clientY =
          "clientY" in event ? event.clientY : event.changedTouches?.[0]?.clientY;

        if (typeof clientX === "number" && typeof clientY === "number") {
          const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
          const nearest = findNearestNodeHandle(flowPos, nodes, null, 75);
          if (nearest) {
            if (reconnectingRef.current.handleType === "target") {
              reconnectEdge(edge, {
                source: edge.source,
                sourceHandle: edge.sourceHandle ?? null,
                target: nearest.nodeId,
                targetHandle: nearest.handleId,
              });
            } else {
              reconnectEdge(edge, {
                source: nearest.nodeId,
                sourceHandle: nearest.handleId,
                target: edge.target,
                targetHandle: edge.targetHandle ?? null,
              });
            }
          } else {
            // User intentionally dragged endpoint into empty space -> detach / delete connector
            deleteEdge(edge.id);
          }
        }
      }
      reconnectingRef.current = null;
    },
    [deleteEdge, nodes, reconnectEdge, screenToFlowPosition]
  );

  // --------------------------------------------------------------------------
  // Canvas Pointer Handlers: Freehand Pen & Method B Line Tool
  // --------------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary mouse button

    // Check if target is inside an input, button, or handle to avoid stealing interaction
    const target = e.target as HTMLElement;
    if (
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("button") ||
      target.closest(".react-flow__handle")
    ) {
      return;
    }

    const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    // DRAW TOOL INTERACTION
    if (activeTool === "draw") {
      if (isEraserActive) {
        // Eraser mode: check if click hit any existing drawing stroke
        for (const d of drawings) {
          for (const p of d.points) {
            if (Math.hypot(p.x - flowPos.x, p.y - flowPos.y) < d.strokeWidth + 10) {
              deleteDrawing(d.id);
              return;
            }
          }
        }
        return;
      }

      // Freehand Pen: start stroke
      isDrawingStrokeRef.current = true;
      setActiveStrokePoints([flowPos]);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // LINE TOOL INTERACTION (Method B)
    if (activeTool === "line") {
      const nearest = findNearestNodeHandle(flowPos, nodes, null, 70);

      // If user was already in free-endpoint mode and clicked near another note
      if (lineDrawing && !lineDrawing.isDragging) {
        if (nearest && nearest.nodeId !== lineDrawing.startNodeId) {
          storeOnConnect({
            source: lineDrawing.startNodeId!,
            sourceHandle: lineDrawing.startHandleId,
            target: nearest.nodeId,
            targetHandle: nearest.handleId,
          });
          setLineDrawing(null);
          setTool("select");
          return;
        }
      }

      setLineDrawing({
        startPos: nearest ? nearest.position : flowPos,
        currentPos: flowPos,
        startNodeId: nearest ? nearest.nodeId : null,
        startHandleId: nearest ? nearest.handleId : null,
        endNodeId: null,
        endHandleId: null,
        isDragging: true,
        dragDistance: 0,
      });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    // DRAW TOOL INTERACTION
    if (activeTool === "draw" && isDrawingStrokeRef.current) {
      setActiveStrokePoints((prev) => {
        if (prev.length === 0) return [flowPos];
        const last = prev[prev.length - 1];
        // Append point if moved more than 2 canvas units (smoother curves, optimal performance)
        if (Math.hypot(flowPos.x - last.x, flowPos.y - last.y) >= 2.5) {
          return [...prev, flowPos];
        }
        return prev;
      });
      return;
    }

    // LINE TOOL INTERACTION
    if (activeTool === "line" && lineDrawing && lineDrawing.isDragging) {
      const nearest = findNearestNodeHandle(
        flowPos,
        nodes,
        lineDrawing.startNodeId,
        80
      );

      const dx = flowPos.x - lineDrawing.startPos.x;
      const dy = flowPos.y - lineDrawing.startPos.y;
      const dist = Math.hypot(dx, dy);

      setLineDrawing((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentPos: nearest ? nearest.position : flowPos,
          endNodeId: nearest ? nearest.nodeId : null,
          endHandleId: nearest ? nearest.handleId : null,
          dragDistance: Math.max(prev.dragDistance, dist),
        };
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore if pointer capture already released
    }

    // DRAW TOOL: Commit freehand stroke
    if (activeTool === "draw" && isDrawingStrokeRef.current) {
      isDrawingStrokeRef.current = false;
      if (activeStrokePoints.length > 0) {
        const boardId = currentBoardId || activeBoard?.id || "";
        const newDrawing: CanvasDrawingRecord = {
          id: generateId("draw"),
          boardId,
          points: activeStrokePoints,
          pathData: pointsToSmoothPath(activeStrokePoints),
          color: activeDrawColor,
          strokeWidth: activeDrawWidth,
          createdAt: Date.now(),
        };
        addDrawing(newDrawing);
      }
      setActiveStrokePoints([]);
      return;
    }

    // LINE TOOL: Complete or cancel line drawing
    if (activeTool === "line" && lineDrawing && lineDrawing.isDragging) {
      const { startNodeId, startHandleId, endNodeId, endHandleId, dragDistance } = lineDrawing;

      // If user simply clicked without dragging (dragDistance < 8), do not create any unwanted line!
      if (dragDistance < 8) {
        setLineDrawing(null);
        return;
      }

      if (startNodeId && endNodeId && startNodeId !== endNodeId) {
        // Both endpoints attached to notes -> create persistent connection!
        storeOnConnect({
          source: startNodeId,
          sourceHandle: startHandleId,
          target: endNodeId,
          targetHandle: endHandleId,
        });
        setLineDrawing(null);
        setTool("select");
      } else if (startNodeId && !endNodeId) {
        // One endpoint attached -> keep drawing from free endpoint
        setLineDrawing((prev) => (prev ? { ...prev, isDragging: false } : null));
      } else if (!startNodeId && endNodeId) {
        // Started in blank space and dropped over note -> pin to note
        setLineDrawing({
          startPos: lineDrawing.currentPos,
          currentPos: lineDrawing.currentPos,
          startNodeId: endNodeId,
          startHandleId: endHandleId,
          endNodeId: null,
          endHandleId: null,
          isDragging: false,
          dragDistance: 0,
        });
      } else {
        // Neither endpoint attached -> cancel
        setLineDrawing(null);
      }
    }
  };

  // Keyboard Shortcuts (Undo, Redo, Delete, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Escape key cancels active line drawing or resets tool to select
      if (e.key === "Escape") {
        if (lineDrawing) {
          e.preventDefault();
          setLineDrawing(null);
        }
        if (activeStrokePoints.length > 0) {
          setActiveStrokePoints([]);
          isDrawingStrokeRef.current = false;
        }
        if (activeTool === "line" || activeTool === "draw") {
          setTool("select");
        }
        return;
      }

      // Global search shortcut works everywhere
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      if (isInput) return;

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        redo();
        return;
      }

      // Save: Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveCurrentState();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedNodeIds.length > 0) {
          duplicateNode(selectedNodeIds[0]);
        }
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
        return;
      }

      // Single-letter creation shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.toLowerCase() === "n") {
          e.preventDefault();
          addNode("note");
        } else if (e.key.toLowerCase() === "t") {
          e.preventDefault();
          addNode("todo");
        } else if (e.key.toLowerCase() === "l") {
          e.preventDefault();
          addNode("link");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    saveCurrentState,
    duplicateNode,
    deleteSelected,
    addNode,
    selectedNodeIds,
    onOpenSearch,
    lineDrawing,
    activeStrokePoints,
    activeTool,
    setTool,
  ]);

  // Method B Live Overlay Path calculation
  let lineDrawingPath = "";
  if (lineDrawing && (lineDrawing.dragDistance >= 8 || !lineDrawing.isDragging)) {
    const [path] = getSmoothStepPath({
      sourceX: lineDrawing.startPos.x,
      sourceY: lineDrawing.startPos.y,
      targetX: lineDrawing.currentPos.x,
      targetY: lineDrawing.currentPos.y,
      borderRadius: 8,
    });
    lineDrawingPath = path;
  }

  // Active freehand stroke live path
  const activeStrokePath =
    activeStrokePoints.length > 0 ? pointsToSmoothPath(activeStrokePoints) : "";

  // If no board is active in current workspace, show clean empty state
  if (!activeBoard && activeWorkspaceId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#EAEAE6] select-none text-center p-6">
        <div className="w-12 h-12 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] flex items-center justify-center text-[#292929] mb-4 shadow-xs">
          <FolderPlus className="w-6 h-6 stroke-[1.6]" />
        </div>
        <h2 className="text-base font-semibold text-[#292929] mb-1">
          No boards in &quot;{activeWs?.name || "Workspace"}&quot;
        </h2>
        <p className="text-xs text-[#777777] max-w-sm mb-5 leading-relaxed">
          Create a board to start capturing notes, connections, diagrams, and project ideas.
        </p>
        <button
          type="button"
          onClick={onOpenCreateBoard}
          className="px-4 py-2 bg-[#292929] text-[#FFFFFF] text-xs font-medium rounded-lg hover:bg-[#454545] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Create Board</span>
        </button>
      </div>
    );
  }

  // Tool-specific class for high-contrast visible dark cursors
  const toolClass =
    activeTool === "line"
      ? "canvas-tool-line"
      : activeTool === "draw"
      ? isEraserActive
        ? "canvas-tool-eraser"
        : "canvas-tool-draw"
      : "canvas-tool-select";

  return (
    <div
      ref={reactFlowWrapper}
      className={`w-full h-full relative select-none ${toolClass}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={40}
        connectionLineComponent={ConnectionLine}
        edgesReconnectable={true}
        reconnectRadius={25}
        panOnDrag={activeTool === "select" ? true : [1, 2]}
        elementsSelectable={activeTool !== "draw"}
        nodesDraggable={activeTool !== "draw"}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onNodeDragStop={onNodeDragStop}
        onNodeContextMenu={onNodeContextMenu}
        onNodeClick={(_, node) => {
          if (activeTool === "select") {
            selectNode(node.id);
          }
        }}
        onNodeDoubleClick={(_, node) => {
          if (activeTool === "select") {
            selectNode(node.id);
          }
        }}
        onEdgeClick={(_, edge) => {
          if (activeTool === "select") {
            selectEdge(edge.id);
          }
        }}
        onPaneClick={onPaneClick}
        onMove={(_, viewport) => {
          onViewportChange(viewport);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        panOnScroll={false}
        preventScrolling={true}
        connectionLineStyle={{ stroke: "#454545", strokeWidth: 1.5 }}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        className="touch-none"
      >
        {/* Subtle Milanote Dotted Grid Background on refined light grey */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#BEBEB6"
          bgColor="#EAEAE6"
        />

        {/* Freehand Drawings & Live Preview Layer (rendered inside React Flow Viewport) */}
        <ViewportPortal>
          {/* Persisted Freehand Drawing Paths */}
          <svg
            className={`absolute inset-0 w-full h-full overflow-visible ${
              activeTool === "draw" && isEraserActive ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{ zIndex: 1 }}
          >
            {drawings.map((d) => (
              <path
                key={d.id}
                d={d.pathData}
                fill="none"
                stroke={d.color}
                strokeWidth={d.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={
                  activeTool === "draw" && isEraserActive
                    ? "pointer-events-auto cursor-pointer hover:opacity-30 transition-opacity"
                    : ""
                }
                onClick={(e) => {
                  if (activeTool === "draw" && isEraserActive) {
                    e.stopPropagation();
                    deleteDrawing(d.id);
                  }
                }}
              />
            ))}

            {/* Active Live Freehand Stroke */}
            {activeStrokePath && (
              <path
                d={activeStrokePath}
                fill="none"
                stroke={activeDrawColor}
                strokeWidth={activeDrawWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none opacity-90"
              />
            )}

            {/* Method B Line Drawing Live Overlay */}
            {lineDrawing && lineDrawingPath && (
              <g className="pointer-events-none">
                <path
                  d={lineDrawingPath}
                  fill="none"
                  stroke="#454545"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                {/* Start handle indicator */}
                <circle
                  cx={lineDrawing.startPos.x}
                  cy={lineDrawing.startPos.y}
                  r={4}
                  fill="#454545"
                />
                {/* Target snap indicator */}
                {lineDrawing.endNodeId ? (
                  <g>
                    <circle
                      cx={lineDrawing.currentPos.x}
                      cy={lineDrawing.currentPos.y}
                      r={8}
                      fill="none"
                      stroke="#454545"
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={lineDrawing.currentPos.x}
                      cy={lineDrawing.currentPos.y}
                      r={4}
                      fill="#454545"
                    />
                  </g>
                ) : (
                  <circle
                    cx={lineDrawing.currentPos.x}
                    cy={lineDrawing.currentPos.y}
                    r={3.5}
                    fill="#454545"
                  />
                )}
              </g>
            )}
          </svg>
        </ViewportPortal>

        {/* Minimal Controls */}
        <Controls
          showInteractive={false}
          className="!bottom-4 !right-4 !left-auto"
        />

        {/* Minimap in neutral warm tones */}
        <MiniMap
          nodeStrokeWidth={1}
          nodeBorderRadius={4}
          className="!bottom-4 !right-16 !w-36 !h-24"
        />
      </ReactFlow>

      {/* Floating Freehand Pen & Eraser Toolbar */}
      <DrawToolbar />

      {/* Right Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeType={contextMenu.nodeType}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
