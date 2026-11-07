"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas-store";

interface NodeHandlesProps {
  isConnectable?: boolean;
}

export const NodeHandles: React.FC<NodeHandlesProps> = ({ isConnectable = true }) => {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const isLineToolActive = activeTool === "line";

  // Base styling for connection handles:
  // - 11px visual circle with neutral charcoal border
  // - Invisible 28px hit-target for effortless grabbing
  // - Always visible in Line tool mode; visible on card hover in select mode
  const visibilityClass = isLineToolActive
    ? "opacity-100 ring-2 ring-[#8A8178]/40 scale-110"
    : "opacity-0 group-hover:opacity-100";

  return (
    <>
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
        isConnectableStart={isConnectable}
        isConnectableEnd={isConnectable}
        className={`!top-[-5px] !w-3 !h-3 !bg-[#FFFFFF] !border-[1.5px] !border-[#454545] !rounded-full transition-all duration-150 hover:!scale-135 hover:!bg-[#454545] !cursor-crosshair z-20 ${visibilityClass}`}
        title="Drag to connect"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        isConnectableStart={isConnectable}
        isConnectableEnd={isConnectable}
        className={`!right-[-5px] !w-3 !h-3 !bg-[#FFFFFF] !border-[1.5px] !border-[#454545] !rounded-full transition-all duration-150 hover:!scale-135 hover:!bg-[#454545] !cursor-crosshair z-20 ${visibilityClass}`}
        title="Drag to connect"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        isConnectableStart={isConnectable}
        isConnectableEnd={isConnectable}
        className={`!bottom-[-5px] !w-3 !h-3 !bg-[#FFFFFF] !border-[1.5px] !border-[#454545] !rounded-full transition-all duration-150 hover:!scale-135 hover:!bg-[#454545] !cursor-crosshair z-20 ${visibilityClass}`}
        title="Drag to connect"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        isConnectableStart={isConnectable}
        isConnectableEnd={isConnectable}
        className={`!left-[-5px] !w-3 !h-3 !bg-[#FFFFFF] !border-[1.5px] !border-[#454545] !rounded-full transition-all duration-150 hover:!scale-135 hover:!bg-[#454545] !cursor-crosshair z-20 ${visibilityClass}`}
        title="Drag to connect"
      />
    </>
  );
};
