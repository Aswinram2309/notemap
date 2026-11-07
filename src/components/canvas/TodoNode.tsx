"use client";

import React, { useState, useEffect } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { NodeHandles } from "./NodeHandles";
import {
  Check,
  Plus,
  Trash2,
  Copy,
  Calendar,
  GripVertical,
} from "lucide-react";
import { TodoNodeData, TodoItem } from "@/types/node";
import { useCanvasStore } from "@/stores/canvas-store";
import { generateId } from "@/lib/utils";

export const TodoNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const todoData = data as unknown as TodoNodeData;
  const { updateNodeData, duplicateNode, deleteNode, selectNode } = useCanvasStore();

  const [title, setTitle] = useState(todoData.title || "To-do List");
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    setTitle(todoData.title || "To-do List");
  }, [todoData.title]);

  const items = todoData.items || [];
  const completedCount = items.filter((i) => i.completed).length;

  const toggleItem = (itemId: string) => {
    const nextItems = items.map((item) => {
      if (item.id === itemId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    updateNodeData(id, { items: nextItems });
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: TodoItem = {
      id: generateId("todo"),
      text: newItemText.trim(),
      completed: false,
    };
    updateNodeData(id, { items: [...items, newItem] });
    setNewItemText("");
  };

  const updateItemText = (itemId: string, text: string) => {
    const nextItems = items.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    updateNodeData(id, { items: nextItems });
  };

  const removeItem = (itemId: string) => {
    const nextItems = items.filter((item) => item.id !== itemId);
    updateNodeData(id, { items: nextItems });
  };

  const setPriority = (priority: "low" | "medium" | "high") => {
    updateNodeData(id, { priority });
  };

  const cardBg = todoData.color || "#FFFFFF";

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
        minWidth={240}
        minHeight={130}
        isVisible={selected}
        lineClassName="!border-[#8A8178]"
        handleClassName="!w-2 !h-2 !bg-[#FFFFFF] !border !border-[#8A8178] !rounded-xs"
      />

      <NodeHandles />

      {/* Header */}
      <div className="p-2.5 pb-1.5 border-b border-[#F0F0EB] flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div
            className="cursor-grab active:cursor-grabbing p-0.5 text-[#A0A09B] hover:text-[#292929] transition-colors shrink-0"
            title="Drag to move card"
          >
            <GripVertical className="w-3.5 h-3.5 stroke-[1.8]" />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              const nextTitle = e.target.value;
              setTitle(nextTitle);
              updateNodeData(id, { title: nextTitle });
            }}
            onBlur={() => updateNodeData(id, { title })}
            placeholder="Task title..."
            className="nodrag font-medium text-sm text-[#292929] bg-transparent outline-none w-full border-none focus:ring-0 placeholder:text-[#A0A09B] p-0 cursor-text"
          />
        </div>
        <div className="nodrag flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-medium text-[#777777] bg-[#F0F0EB] px-1.5 py-0.5 rounded">
            {completedCount}/{items.length}
          </span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              title="Duplicate to-do card"
              onClick={(e) => {
                e.stopPropagation();
                duplicateNode(id);
              }}
              className="p-1 text-[#777777] hover:text-[#292929] hover:bg-[#F0F0EB] rounded cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              type="button"
              title="Delete to-do card"
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(id);
              }}
              className="p-1 text-[#777777] hover:text-[#8A4A4A] hover:bg-[#F5ECEB] rounded cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Meta Bar: Priority and Due Date */}
      <div className="nodrag px-3 py-1.5 bg-[#FAFAF8] border-b border-[#F0F0EB] flex items-center justify-between text-[11px] text-[#777777]">
        {/* Priority selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px]">Priority:</span>
          {(["low", "medium", "high"] as const).map((p) => {
            const isCurr = (todoData.priority || "medium") === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-1.5 py-0.5 rounded capitalize text-[10px] transition-colors ${
                  isCurr
                    ? "bg-[#292929] text-[#FFFFFF] font-medium"
                    : "hover:bg-[#E9E9E3] text-[#777777]"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Due date */}
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-[#777777]" />
          <input
            type="date"
            value={todoData.dueDate || ""}
            onChange={(e) => updateNodeData(id, { dueDate: e.target.value })}
            className="text-[10px] bg-transparent border-none text-[#777777] focus:text-[#292929] outline-none cursor-pointer p-0"
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="nodrag p-3 flex-1 flex flex-col gap-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2 group/item py-0.5"
          >
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center transition-colors shrink-0 ${
                item.completed
                  ? "bg-[#747A65] text-[#FFFFFF]"
                  : "border border-[#C4C4BD] hover:border-[#8A8178] bg-[#FFFFFF]"
              }`}
            >
              {item.completed && <Check className="w-3 h-3" strokeWidth={3} />}
            </button>

            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItemText(item.id, e.target.value)}
              className={`flex-1 text-xs bg-transparent border-none outline-none leading-tight ${
                item.completed
                  ? "line-through text-[#777777]"
                  : "text-[#292929]"
              }`}
            />

            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="opacity-0 group-hover/item:opacity-100 text-[#777777] hover:text-[#8A4A4A] p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Add item input */}
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#F0F0EB]">
          <Plus className="w-3.5 h-3.5 text-[#777777] shrink-0" />
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addItem();
            }}
            placeholder="Add a task..."
            className="flex-1 text-xs bg-transparent border-none outline-none placeholder:text-[#A0A09B]"
          />
          {newItemText && (
            <button
              type="button"
              onClick={addItem}
              className="text-[10px] bg-[#292929] text-[#FFFFFF] px-1.5 py-0.5 rounded font-medium"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
