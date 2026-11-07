"use client";

import React, { useState } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { NodeHandles } from "./NodeHandles";
import { Plus, Trash2 } from "lucide-react";
import { TableNodeData } from "@/types/node";
import { useCanvasStore } from "@/stores/canvas-store";

export const TableNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const tableData = data as unknown as TableNodeData;
  const { updateNodeData, selectNode } = useCanvasStore();

  const [title, setTitle] = useState(tableData.title || "Table");
  const columns = tableData.columns || ["Column 1", "Column 2", "Column 3"];
  const rows = tableData.rows || [["", "", ""]];

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const nextRows = rows.map((r, ri) =>
      ri === rowIndex ? r.map((c, ci) => (ci === colIndex ? value : c)) : [...r]
    );
    updateNodeData(id, { rows: nextRows });
  };

  const updateColumnName = (colIndex: number, name: string) => {
    const nextCols = [...columns];
    nextCols[colIndex] = name;
    updateNodeData(id, { columns: nextCols });
  };

  const addColumn = () => {
    const nextCols = [...columns, `Column ${columns.length + 1}`];
    const nextRows = rows.map((r) => [...r, ""]);
    updateNodeData(id, { columns: nextCols, rows: nextRows });
  };

  const addRow = () => {
    const newRow = new Array(columns.length).fill("");
    updateNodeData(id, { rows: [...rows, newRow] });
  };

  const removeRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    const nextRows = rows.filter((_, i) => i !== rowIndex);
    updateNodeData(id, { rows: nextRows });
  };

  const cardBg = tableData.color || "#FFFFFF";

  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest(".react-flow__handle")) return;
        selectNode(id);
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest(".react-flow__handle")) return;
        selectNode(id);
      }}
      style={{ backgroundColor: cardBg }}
      className={`group relative rounded-lg border border-[#D5D5CF] bg-[#FFFFFF] shadow-sm hover:shadow-md transition-shadow text-[#292929] select-none min-h-[140px] flex flex-col cursor-grab active:cursor-grabbing ${
        selected ? "ring-2 ring-[#8A8178] shadow-md" : ""
      }`}
    >
      <NodeResizer
        minWidth={280}
        minHeight={140}
        isVisible={selected}
        lineClassName="!border-[#8A8178]"
        handleClassName="!w-2 !h-2 !bg-[#FFFFFF] !border !border-[#8A8178] !rounded-xs"
      />

      <NodeHandles />

      {/* Header */}
      <div className="p-3 pb-2 border-b border-[#F0F0EB] flex items-center justify-between gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => updateNodeData(id, { title })}
          placeholder="Table title..."
          className="font-medium text-xs text-[#292929] bg-transparent outline-none w-full border-none focus:ring-0 placeholder:text-[#A0A09B]"
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={addColumn}
            className="text-[10px] text-[#777777] hover:text-[#292929] hover:bg-[#F0F0EB] px-1.5 py-0.5 rounded flex items-center gap-1"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>Col</span>
          </button>
          <button
            type="button"
            onClick={addRow}
            className="text-[10px] text-[#777777] hover:text-[#292929] hover:bg-[#F0F0EB] px-1.5 py-0.5 rounded flex items-center gap-1"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>Row</span>
          </button>
        </div>
      </div>

      {/* Table content */}
      <div className="nodrag p-2 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5E0] bg-[#FAFAF8]">
              {columns.map((col, ci) => (
                <th key={ci} className="p-1.5 font-medium text-[#777777]">
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => updateColumnName(ci, e.target.value)}
                    className="w-full text-xs font-medium text-[#777777] bg-transparent outline-none border-none p-0 focus:text-[#292929]"
                  />
                </th>
              ))}
              <th className="w-6 p-1"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-[#F0F0EB] hover:bg-[#FAF8F5] group/row">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-1.5">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      placeholder="..."
                      className="w-full text-xs text-[#292929] bg-transparent outline-none border-none p-0"
                    />
                  </td>
                ))}
                <td className="w-6 p-1 text-right">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(ri)}
                      className="opacity-0 group-hover/row:opacity-100 text-[#777777] hover:text-[#8A4A4A] p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
