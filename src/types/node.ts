export type CanvasNodeType =
  | "note"
  | "todo"
  | "link"
  | "board"
  | "column"
  | "comment"
  | "table"
  | "image"
  | "file";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  data?: string;
}

export interface NoteNodeData {
  title: string;
  content: string;
  tags: string[];
  color?: string;
  attachments?: Attachment[];
  lastModified?: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoNodeData {
  title: string;
  items: TodoItem[];
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  color?: string;
}

export interface LinkNodeData {
  url: string;
  title: string;
  description?: string;
  siteName?: string;
  imageUrl?: string;
  color?: string;
}

export interface BoardNodeData {
  targetBoardId: string;
  title: string;
  description?: string;
  noteCount?: number;
  color?: string;
}

export interface ColumnNodeData {
  title: string;
  width?: number;
  height?: number;
  color?: string;
}

export interface CommentNodeData {
  author?: string;
  text: string;
  color?: string;
  createdAt: number;
}

export interface TableNodeData {
  title: string;
  columns: string[];
  rows: string[][];
  color?: string;
}

export interface ImageNodeData {
  url: string;
  caption?: string;
  localData?: string;
  aspectRatio?: number;
  width?: number;
  height?: number;
}

export interface FileNodeData {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData?: string;
  description?: string;
}

export type CanvasNodeDataUnion =
  | NoteNodeData
  | TodoNodeData
  | LinkNodeData
  | BoardNodeData
  | ColumnNodeData
  | CommentNodeData
  | TableNodeData
  | ImageNodeData
  | FileNodeData;

export interface CanvasNodeRecord {
  id: string;
  boardId: string;
  type: CanvasNodeType;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  zIndex?: number;
  color?: string;
  data: CanvasNodeDataUnion;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasEdgeRecord {
  id: string;
  boardId: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  type: "straight" | "smoothstep" | "bezier";
  animated?: boolean;
  createdAt: number;
  updatedAt: number;
}
