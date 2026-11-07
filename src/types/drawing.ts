export interface DrawingPoint {
  x: number;
  y: number;
}

export interface CanvasDrawingRecord {
  id: string;
  boardId: string;
  points: DrawingPoint[];
  pathData: string;
  color: string;
  strokeWidth: number;
  tool?: "pen" | "eraser";
  createdAt: number;
}

