"use client"

import React, { useRef, useState } from "react"
import { X, Upload, Check, Bell, BellOff } from "lucide-react"
import {
  type PublicWallConfig,
  savePublicConfig,
} from "../lib/publicConfig"
import { BG_PRESETS, NOTE_FONTS, NoteFontKey } from "../lib/privateConfig"
import { useNotifications } from "../lib/useNotifications"

interface PublicSettingsProps {
  config: PublicWallConfig
  onSave: (config: PublicWallConfig) => void
  onClose: () => void
}

export function PublicSettings({ config, onSave, onClose }: PublicSettingsProps) {
  const [draft, setDraft] = useState<PublicWallConfig>({ ...config })
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { notify, enabled: notifEnabled, setEnabled: setNotifEnabled, permission, requestPermission } = useNotifications()

  const set = <K extends keyof PublicWallConfig>(key: K, value: PublicWallConfig[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large (max 2 MB). Please choose a smaller one.")
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setDraft((d) => ({ ...d, bgType: "image", bgValue: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    savePublicConfig(draft)
    onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="settings-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="settings-panel">
        {/* Thumbtack */}
        <span className="settings-tack" aria-hidden="true" />

        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">⚙ Public Wall Settings</h2>
          <button onClick={onClose} className="settings-close" aria-label="Close settings">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="settings-body">
          {/* Background */}
          <section className="settings-section">
            <label className="settings-label">Background</label>

            {/* Presets */}
            <div className="bg-presets">
              {Object.entries(BG_PRESETS).map(([key, { label, css }]) => (
                <button
                  key={key}
                  className={`bg-preset-btn ${draft.bgType === "preset" && draft.bgValue === key ? "bg-preset-active" : ""}`}
                  style={{ background: css }}
                  title={label}
                  onClick={() => setDraft((d) => ({ ...d, bgType: "preset", bgValue: key }))}
                  aria-label={label}
                />
              ))}

              {/* Solid color */}
              <label className="bg-preset-btn bg-color-btn" title="Solid color" aria-label="Pick solid color">
                <input
                  type="color"
                  value={draft.bgType === "color" ? draft.bgValue : "#3b82f6"}
                  onChange={(e) => setDraft((d) => ({ ...d, bgType: "color", bgValue: e.target.value }))}
                  className="hidden-color-input"
                />
                <span style={{ fontSize: "1.1rem" }}>🎨</span>
              </label>

              {/* Upload image */}
              <button
                className={`bg-preset-btn ${draft.bgType === "image" ? "bg-preset-active" : ""}`}
                title="Upload image"
                onClick={() => fileRef.current?.click()}
                aria-label="Upload background image"
                style={{ background: draft.bgType === "image" ? `url('${draft.bgValue}') center/cover` : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {draft.bgType !== "image" && <Upload size={14} strokeWidth={2} style={{ color: "#64748b" }} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden-color-input" />
            </div>
          </section>

          {/* Note Font */}
          <section className="settings-section">
            <label className="settings-label">Default Note Font</label>
            <div className="font-options">
              {(Object.entries(NOTE_FONTS) as [NoteFontKey, { label: string; css: string }][]).map(([key, { label, css }]) => (
                <button
                  key={key}
                  className={`font-option ${draft.noteFont === key ? "font-option-active" : ""}`}
                  style={{ fontFamily: css }}
                  onClick={() => set("noteFont", key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Default note color */}
          <section className="settings-section">
            <label className="settings-label">Default Note Color</label>
            <div className="color-row">
              {["#fef9e7", "#fce7f3", "#dbeafe", "#dcfce7", "#fef3c7", "#f3e8ff"].map((c) => (
                <button
                  key={c}
                  className={`note-color-btn ${draft.defaultNoteColor === c ? "note-color-active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => set("defaultNoteColor", c)}
                  aria-label={`Color ${c}`}
                />
              ))}
              <label className="note-color-btn note-color-custom" title="Custom color" aria-label="Custom note color">
                <input
                  type="color"
                  value={draft.defaultNoteColor}
                  onChange={(e) => set("defaultNoteColor", e.target.value)}
                  className="hidden-color-input"
                />
                <span>+</span>
              </label>
            </div>
          </section>

          {/* Layout Mode */}
          <section className="settings-section" style={{ borderTop: "1px dashed rgba(0,0,0,0.1)", paddingTop: "12px", marginTop: "12px" }}>
            <label className="settings-label">Layout</label>
            <div className="font-options">
              <button
                className={`font-option ${draft.layoutMode === "wall" ? "font-option-active" : ""}`}
                onClick={() => set("layoutMode", "wall")}
              >
                Wall
              </button>
              <button
                className={`font-option ${draft.layoutMode === "timeline" ? "font-option-active" : ""}`}
                onClick={() => set("layoutMode", "timeline")}
              >
                Timeline
              </button>
            </div>
          </section>

          {/* Notification Alert */}
          <section className="settings-section" style={{ borderTop: "1px dashed rgba(0,0,0,0.1)", paddingTop: "12px", marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <label className="settings-label">Notification Alerts</label>
                <p className="settings-hint">Get a pop-up alert when someone adds a note.</p>
              </div>
              <button
                onClick={async () => {
                  if (permission === "default") await requestPermission()
                  else setNotifEnabled(!notifEnabled)
                }}
                className="font-option font-option-active"
                style={{ background: notifEnabled ? "#dcfce7" : "#f1f5f9", display: "flex", alignItems: "center", gap: "6px", width: "auto" }}
              >
                {notifEnabled ? <Bell size={14} strokeWidth={2.5} /> : <BellOff size={14} strokeWidth={2.5} />}
                {notifEnabled ? "On" : "Off"}
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button className="settings-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="settings-save" onClick={handleSave}>
            {saved ? (
              <>
                <Check size={14} strokeWidth={3} />
                Saved
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
