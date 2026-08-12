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
        className="settings-tab"
        title={`${config.wallName} Settings`}
        aria-label="Open wall settings"
      >
        {/* Thumbtack */}
        <span className="settings-tab-pin" aria-hidden="true" />
        <Settings size={13} strokeWidth={2.5} className="settings-tab-icon" />
        <span className="settings-tab-label">Settings</span>
      </button>

      <style>{`
        @keyframes settingsTabIn {
          from { opacity: 0; transform: translateY(10px) rotate(1deg); }
          to   { opacity: 1; transform: translateY(0)    rotate(1deg); }
        }

        .settings-tab {
          position: fixed;
          bottom: 52px;
          left: clamp(10px, 2vw, 20px);
          z-index: 100;

          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px 7px;

          font-family: 'Chalkboard SE', 'Marker Felt', 'Comic Sans MS', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          color: #1c2b3a;

          /* small sticky note */
          background-color: #fef9c3;
          background-image: repeating-linear-gradient(
            transparent,
            transparent 15px,
            rgba(0,0,0,0.06) 15px,
            rgba(0,0,0,0.06) 16px
          );
          border: none;
          box-shadow:
            2px 4px 10px rgba(0,0,0,0.25),
            1px 1px 3px rgba(0,0,0,0.1);

          cursor: pointer;
          transform: rotate(1deg);
          transform-origin: bottom left;
          animation: settingsTabIn 0.35s cubic-bezier(0.22,1,0.36,1) both;

          transition: transform 0.2s, box-shadow 0.2s;
        }
        .settings-tab:hover {
          transform: rotate(0deg) translateY(-2px);
          box-shadow:
            3px 8px 18px rgba(0,0,0,0.3),
            1px 2px 5px rgba(0,0,0,0.12);
        }

        .settings-tab-pin {
          position: absolute;
          top: -7px;
          left: 50%;
          transform: translateX(-50%);
          display: block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 30%,
            #d0d0d0 0%,
            #999 45%,
            #555 100%
          );
          box-shadow: 0 2px 4px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.5);
        }

        .settings-tab-icon { color: #334155; flex-shrink: 0; }
        .settings-tab-label { white-space: nowrap; }
      `}</style>

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
    </MainLayout>
  )
}
