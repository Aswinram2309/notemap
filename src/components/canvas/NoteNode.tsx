"use client";

import React, { useState, useRef, useEffect } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { NodeHandles } from "./NodeHandles";
import {
  GripVertical,
  Plus,
  X,
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Copy,
  Trash2,
} from "lucide-react";
import { NoteNodeData } from "@/types/node";
import { useCanvasStore } from "@/stores/canvas-store";

export const NoteNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const noteData = data as unknown as NoteNodeData;
  const { updateNodeData, duplicateNode, deleteNode, selectNode } = useCanvasStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(noteData.title || "");
  const [content, setContent] = useState(noteData.content || "");
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(noteData.title || "");
    setContent(noteData.content || "");
  }, [noteData.title, noteData.content]);

  // When card loses selection, automatically exit editing modes
  useEffect(() => {
    if (!selected) {
      setIsEditing(false);
      setIsEditingTitle(false);
    }
  }, [selected]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleTitleBlur = () => {
    updateNodeData(id, { title });
  };

  const handleContentBlur = () => {
    updateNodeData(id, { content });
  };

  const addTag = (newTag: string) => {
    const cleanTag = newTag.trim().replace(/^#/, "");
    if (!cleanTag) return;
    const existingTags = noteData.tags || [];
    if (!existingTags.includes(cleanTag)) {
      updateNodeData(id, { tags: [...existingTags, cleanTag] });
    }
    setTagInput("");
    setShowTagInput(false);
  };

  const removeTag = (tagToRemove: string) => {
    const existingTags = noteData.tags || [];
    updateNodeData(id, {
      tags: existingTags.filter((t) => t !== tagToRemove),
    });
  };

  // Quick formatting insert
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end);

    const replacement = `${prefix}${selectedText || "text"}${suffix}`;
    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    setContent(nextVal);
    updateNodeData(id, { content: nextVal });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText ? selectedText.length : 4)
      );
    }, 10);
  };

  const cardBg = noteData.color || "#FFFFFF";

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".react-flow__handle")) {
      return;
    }
    selectNode(id);
  };

  const handleCardDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".react-flow__handle")) {
      return;
    }
    selectNode(id);
    setIsEditing(true);
  };

  return (
    <div
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      style={{ backgroundColor: cardBg }}
      className={`group relative rounded-lg border border-[#D5D5CF] bg-[#FFFFFF] shadow-sm hover:shadow-md transition-shadow text-[#292929] select-none min-h-[140px] flex flex-col cursor-grab active:cursor-grabbing ${
        selected ? "ring-2 ring-[#8A8178] shadow-md" : ""
      }`}
    >
      <NodeResizer
        minWidth={220}
        minHeight={120}
        isVisible={selected}
        lineClassName="!border-[#8A8178]"
        handleClassName="!w-2 !h-2 !bg-[#FFFFFF] !border !border-[#8A8178] !rounded-xs"
      />

      {/* Connection handles on 4 sides (subtle, appear on hover/selection) */}
      <NodeHandles />

      {/* Note Header / Title Bar (always draggable) */}
      <div className="p-2.5 pb-1.5 border-b border-[#F0F0EB] flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 cursor-grab active:cursor-grabbing">
          <div
            className="cursor-grab active:cursor-grabbing p-0.5 text-[#A0A09B] hover:text-[#292929] transition-colors shrink-0"
            title="Drag to move note"
          >
            <GripVertical className="w-3.5 h-3.5 stroke-[1.8]" />
          </div>

          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setTitle(nextTitle);
                updateNodeData(id, { title: nextTitle });
              }}
              onBlur={() => {
                handleTitleBlur();
                setIsEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  handleTitleBlur();
                  setIsEditingTitle(false);
                }
              }}
              placeholder="Note title..."
              className="nodrag font-medium text-sm text-[#292929] bg-transparent outline-none w-full border-none focus:ring-0 placeholder:text-[#A0A09B] p-0 cursor-text"
            />
          ) : (
            <div
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              className="font-medium text-sm text-[#292929] truncate w-full cursor-grab active:cursor-grabbing py-0.5"
              title="Drag to move card (double-click to edit title)"
            >
              {title || <span className="text-[#A0A09B] italic">Untitled Note</span>}
            </div>
          )}
        </div>

        <div className="nodrag flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            title="Duplicate note"
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
            title="Delete note"
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

      {/* Formatting bar visible when editing */}
      {isEditing && (
        <div className="nodrag flex items-center gap-1 px-3 py-1 bg-[#FAFAF8] border-b border-[#E5E5E0] text-[#777777]">
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onClick={() => insertFormatting("**", "**")}
            className="p-1 hover:bg-[#E9E9E3] rounded hover:text-[#292929]"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onClick={() => insertFormatting("*", "*")}
            className="p-1 hover:bg-[#E9E9E3] rounded hover:text-[#292929]"
          >
            <Italic className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Heading"
            onClick={() => insertFormatting("## ")}
            className="p-1 hover:bg-[#E9E9E3] rounded hover:text-[#292929]"
          >
            <Heading2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Bullet list"
            onClick={() => insertFormatting("- ")}
            className="p-1 hover:bg-[#E9E9E3] rounded hover:text-[#292929]"
          >
            <List className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Numbered list"
            onClick={() => insertFormatting("1. ")}
            className="p-1 hover:bg-[#E9E9E3] rounded hover:text-[#292929]"
          >
            <ListOrdered className="w-3 h-3" />
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-[10px] text-[#8A8178] hover:text-[#292929] px-1.5 py-0.5 rounded hover:bg-[#E9E9E3] font-medium"
          >
            Done
          </button>
        </div>
      )}

      {/* Note Body: Draggable when viewing, editable when double-clicked */}
      <div className="p-3 flex-1 flex flex-col">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            rows={5}
            value={content}
            onChange={(e) => {
              const nextContent = e.target.value;
              setContent(nextContent);
              updateNodeData(id, { content: nextContent });
            }}
            onBlur={handleContentBlur}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsEditing(false);
              }
            }}
            placeholder="Type your notes here..."
            className="nodrag w-full h-full min-h-[90px] text-xs leading-relaxed text-[#292929] bg-transparent outline-none resize-none placeholder:text-[#A0A09B] font-normal cursor-text select-text"
          />
        ) : (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              selectNode(id);
              setIsEditing(true);
            }}
            className="w-full flex-1 text-xs leading-relaxed text-[#292929] whitespace-pre-wrap font-normal select-none cursor-grab active:cursor-grabbing min-h-[70px]"
            title="Drag to move card (double-click to edit content)"
          >
            {content ? (
              content
            ) : (
              <span className="text-[#A0A09B] italic">
                Double-click to add content...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tags section */}
      <div className="nodrag px-3 pb-2.5 pt-1 flex flex-wrap items-center gap-1.5">
        {(noteData.tags || []).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-[#F0F0EB] text-[#777777] rounded font-medium group/tag"
          >
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-[#8A4A4A] opacity-60 hover:opacity-100"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {showTagInput ? (
          <div className="inline-flex items-center gap-1">
            <input
              type="text"
              autoFocus
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTag(tagInput);
                if (e.key === "Escape") setShowTagInput(false);
              }}
              onBlur={() => addTag(tagInput)}
              placeholder="tag..."
              className="w-14 px-1 py-0.5 text-[10px] bg-[#FFFFFF] border border-[#8A8178] rounded outline-none"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowTagInput(true)}
            className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[10px] text-[#777777] hover:text-[#292929] hover:bg-[#F0F0EB] rounded"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>tag</span>
          </button>
        )}
      </div>
    </div>
  );
};
