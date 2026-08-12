"use client"

import { useEffect, useState } from "react"
import { Settings } from "lucide-react"
import { NoteWall } from "../../components/NoteWall"
import { MainLayout } from "../../layout/MainLayout"
import { PinLock } from "../../components/PinLock"
import { PrivateSettings } from "../../components/PrivateSettings"
import {
  type PrivateWallConfig,
  loadConfig,
  buildBgStyle,
  isUnlocked,
} from "../../lib/privateConfig"

export default function PrivatePage() {
  const [config, setConfig] = useState<PrivateWallConfig | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Load config on mount (client-only)
  useEffect(() => {
    const cfg = loadConfig()
    setConfig(cfg)
    if (!cfg.pin || isUnlocked()) {
      setUnlocked(true)
    }
  }, [])

  if (!config) return null // SSR guard

  // Show PIN lock if needed
  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />
  }

  const bgStyle = buildBgStyle(config)

  return (
    <MainLayout>
      {/* Apply background override */}
      <style>{`
        body {
          background: ${bgStyle} !important;
          background-color: #eab308 !important;
        }
      `}</style>

      <section style={{ position: "relative" }}>
        <NoteWall
          mode="private"
          noteFont={config.noteFont}
          defaultNoteColor={config.defaultNoteColor}
        />
      </section>

      {/* Settings button */}
      <button
        onClick={() => setShowSettings(true)}
        className="settings-fab"
        title={`${config.wallName} Settings`}
        aria-label="Open wall settings"
      >
        <Settings size={16} strokeWidth={2} />
      </button>

      {/* Settings panel */}
      {showSettings && (
        <PrivateSettings
          config={config}
          onSave={(newConfig) => {
            setConfig(newConfig)
            setShowSettings(false)
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      <style>{`
        .settings-fab {
          position: fixed;
          bottom: 48px;    /* above wood footer */
          right: 16px;
          z-index: 100;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(28,43,58,0.75);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(6px);
          transition: background 0.2s, transform 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .settings-fab:hover {
          background: rgba(28,43,58,0.95);
          color: white;
          transform: rotate(30deg);
        }
      `}</style>
    </MainLayout>
  )
}
