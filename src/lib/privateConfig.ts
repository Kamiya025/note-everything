// ── Private Wall Configuration ────────────────────────────────────
// All config is stored in localStorage and is local to the device.

export type NoteFontKey = "handwriting" | "mono" | "serif" | "sans"
export type BgType = "preset" | "color" | "image"

export interface PrivateWallConfig {
  pin: string             // "" = no PIN required
  wallName: string        // display name, default "Private"
  bgType: BgType
  bgValue: string         // preset name | hex color | base64 data URL
  noteFont: NoteFontKey
  defaultNoteColor: string
  layoutMode?: "wall" | "timeline"
}

export const NOTE_FONTS: Record<NoteFontKey, { label: string; css: string }> = {
  handwriting: {
    label: "Handwriting",
    css: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive",
  },
  mono: {
    label: "Typewriter",
    css: "'Courier New', 'Consolas', monospace",
  },
  serif: {
    label: "Serif",
    css: "'Georgia', 'Times New Roman', serif",
  },
  sans: {
    label: "Clean",
    css: "'Outfit', 'Segoe UI', sans-serif",
  },
}

// Preset backgrounds — value is a CSS background shorthand
export const BG_PRESETS: Record<string, { label: string; css: string }> = {
  yellow_wall: {
    label: "Yellow Wall",
    css: "url('/bg-wall.webp') center/cover",
  },
  cork: {
    label: "Cork Board",
    css: "repeating-linear-gradient(135deg, #c9a96e 0px, #b8914a 2px, #c9a96e 4px, #d4a85a 8px)",
  },
  dark: {
    label: "Dark",
    css: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  },
  pastel: {
    label: "Pastel Blue",
    css: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)",
  },
}

const STORAGE_KEY = "privateWallConfig"

export const DEFAULT_CONFIG: PrivateWallConfig = {
  pin: "",
  wallName: "Private",
  bgType: "preset",
  bgValue: "yellow_wall",
  noteFont: "handwriting",
  defaultNoteColor: "#fef9e7",
  layoutMode: "wall",
}

export function loadConfig(): PrivateWallConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveConfig(config: PrivateWallConfig): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function buildBgStyle(config: PrivateWallConfig): string {
  if (config.bgType === "preset") {
    return BG_PRESETS[config.bgValue]?.css ?? BG_PRESETS.yellow_wall.css
  }
  if (config.bgType === "color") {
    return config.bgValue
  }
  // image = base64 data URL
  return `url('${config.bgValue}') center/cover no-repeat`
}

// Session unlock state — cleared when tab is closed
const SESSION_UNLOCK_KEY = "privateWallUnlocked"

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(SESSION_UNLOCK_KEY) === "1"
}

export function setUnlocked(): void {
  sessionStorage.setItem(SESSION_UNLOCK_KEY, "1")
}

export function clearUnlocked(): void {
  sessionStorage.removeItem(SESSION_UNLOCK_KEY)
}
