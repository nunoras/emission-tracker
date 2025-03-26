export const SECTOR_PALETTE = [
  "#3b82f6", "#10b981", "#f97316", "#8b5cf6", 
  "#ec4899", "#14b8a6", "#f59e0b", "#ef4444",
  "#84cc16", "#06b6d4", "#d946ef", "#0ea5e9"
];

export const COMPANY_PALETTE = [
  "#6366f1", "#22d3ee", "#f472b6", "#a78bfa",
  "#34d399", "#fb923c", "#60a5fa", "#f87171",
  "#a3e635", "#38bdf8", "#c084fc", "#4ade80",
  "#fbbf24", "#818cf8", "#2dd4bf", "#f43f5e",
  "#a855f7", "#eab308", "#0ea5e9", "#10b981",
  "#f97316", "#8b5cf6", "#ec4899", "#14b8a6"
];

export class ColorAssigner {
  private usedColors = new Set<string>();
  private palette: string[];

  constructor(palette: string[], private maxAttempts = 100) {
    this.palette = [...palette];
  }

  getColor(key: string): string {
    // Try to get consistent color first
    const hash = this.hashString(key);
    const initialIndex = hash % this.palette.length;
    
    if (!this.usedColors.has(this.palette[initialIndex])) {
      this.usedColors.add(this.palette[initialIndex]);
      return this.palette[initialIndex];
    }

    // If taken, find nearest available color
    for (let i = 1; i < this.maxAttempts; i++) {
      const nextIndex = (initialIndex + i) % this.palette.length;
      if (!this.usedColors.has(this.palette[nextIndex])) {
        this.usedColors.add(this.palette[nextIndex]);
        return this.palette[nextIndex];
      }
    }

    // Fallback to hashed color if all attempts fail
    return this.palette[initialIndex];
  }

  private hashString(str: string): number {
    return Array.from(str).reduce(
      (hash, char) => char.charCodeAt(0) + (hash << 6) + (hash << 16) - hash,
      0
    );
  }

  reset() {
    this.usedColors.clear();
  }
}