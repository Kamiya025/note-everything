"use client"

import { useEffect, useState } from "react"
import { NoteWall } from "../components/NoteWall"
import { MainLayout } from "../layout/MainLayout"
import { PublicSettings } from "../components/PublicSettings"
import { Settings } from "lucide-react"
import {
  type PublicWallConfig,
  loadPublicConfig,
  buildPublicBgStyle,
} from "../lib/publicConfig"

export default function Home() {
  const [config, setConfig] = useState<PublicWallConfig | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    setConfig(loadPublicConfig())
  }, [])

  if (!config) return null

  const bgStyle = buildPublicBgStyle(config)

  return (
    <MainLayout>
      <style>{`
        body {
          background: ${bgStyle} !important;
          background-color: #facc15 !important;
        }
      `}</style>
      <section style={{ position: "relative" }}>
        <NoteWall mode="public" noteFont={config.noteFont} defaultNoteColor={config.defaultNoteColor} layoutMode={config.layoutMode} />
      </section>

      {/* Settings tab */}
      <button
        onClick={() => setShowSettings(true)}
        className="settings-tab"
        title="Public Wall Settings"
        aria-label="Open public wall settings"
      >
        <span className="settings-tab-pin" aria-hidden="true" />
        <Settings size={13} strokeWidth={2.5} className="settings-tab-icon" />
        <span className="settings-tab-label">Settings</span>
      </button>

      {showSettings && (
        <PublicSettings
          config={config}
          onSave={(newConfig) => { setConfig(newConfig); setShowSettings(false) }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </MainLayout>
  )
}
