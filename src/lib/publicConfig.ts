// ── Public Wall Configuration ────────────────────────────────────
// All config is stored in localStorage and is local to the device.
import { BgType, NoteFontKey, BG_PRESETS, NOTE_FONTS } from "./privateConfig"

export interface PublicWallConfig {
  bgType: BgType
  bgValue: string         // preset name | hex color | base64 data URL
  noteFont: NoteFontKey
  defaultNoteColor: string
  layoutMode?: "wall" | "timeline"
}

const STORAGE_KEY = "publicWallConfig"

export const DEFAULT_PUBLIC_CONFIG: PublicWallConfig = {
  bgType: "preset",
  bgValue: "cork", // Default to cork board for public wall
  noteFont: "handwriting",
  defaultNoteColor: "#fef9e7",
  layoutMode: "wall",
}

export function loadPublicConfig(): PublicWallConfig {
  if (typeof window === "undefined") return DEFAULT_PUBLIC_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PUBLIC_CONFIG
    return { ...DEFAULT_PUBLIC_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PUBLIC_CONFIG
  }
}

export function savePublicConfig(config: PublicWallConfig): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function buildPublicBgStyle(config: PublicWallConfig): string {
  if (config.bgType === "preset") {
    return BG_PRESETS[config.bgValue]?.css ?? BG_PRESETS.cork.css
  }
  if (config.bgType === "color") {
    return config.bgValue
  }
  // image = base64 data URL
  return `url('${config.bgValue}') center/cover no-repeat`
}
