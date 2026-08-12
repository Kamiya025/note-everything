export interface Note {
  id?: string;
  content: string;
  author: string;
  color: string; // Supports hex colors for custom color picking
  createdAt: any; // Firestore Timestamp
  isPrivate?: boolean;
}

export const PRESET_COLORS = [
  "#fef08a", // Yellow pastel
  "#fbcfe8", // Pink pastel
  "#bbf7d0", // Green pastel
  "#bfdbfe", // Blue pastel
  "#e9d5ff", // Purple pastel
  "#ffffff", // White
];
