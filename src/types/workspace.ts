export interface Workspace {
  id: string;
  name: string;
  description: string;
  icon?: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Board {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  name: string;
  description?: string;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
}
