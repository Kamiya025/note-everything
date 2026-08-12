"use client"

import React, { useRef, useState } from "react"
import { X, Eye, EyeOff, Upload, Check } from "lucide-react"
import {
  type PrivateWallConfig,
  type NoteFontKey,
  type BgType,
  NOTE_FONTS,
  BG_PRESETS,
  saveConfig,
  clearUnlocked,
} from "../lib/privateConfig"

interface PrivateSettingsProps {
  config: PrivateWallConfig
  onSave: (config: PrivateWallConfig) => void
  onClose: () => void
}

export function PrivateSettings({ config, onSave, onClose }: PrivateSettingsProps) {
  const [draft, setDraft] = useState<PrivateWallConfig>({ ...config })
  const [showPin, setShowPin] = useState(false)
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof PrivateWallConfig>(key: K, value: PrivateWallConfig[K]) =>
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
    // Validate PIN change
    if (newPin) {
      if (!/^\d{4}$/.test(newPin)) {
        setPinError("PIN must be exactly 4 digits.")
        return
      }
      if (newPin !== confirmPin) {
        setPinError("PINs do not match.")
        return
      }
      draft.pin = newPin
      // Force re-unlock since PIN changed
      clearUnlocked()
    }

    setPinError("")
    saveConfig(draft)
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
          <h2 className="settings-title">⚙ Wall Settings</h2>
          <button onClick={onClose} className="settings-close" aria-label="Close settings">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="settings-body">
          {/* Wall Name */}
          <section className="settings-section">
            <label className="settings-label">Wall Name</label>
            <input
              type="text"
              className="settings-input"
              value={draft.wallName}
              onChange={(e) => set("wallName", e.target.value)}
              maxLength={30}
              placeholder="Private"
            />
          </section>

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
            <label className="settings-label">Note Font</label>
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

          {/* PIN */}
          <section className="settings-section">
            <label className="settings-label">PIN Lock</label>
            <p className="settings-hint">
              {config.pin ? "PIN is set. Enter a new one to change it, or leave blank to keep current." : "Set a 4-digit PIN to protect this wall."}
            </p>
            <div className="pin-row">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                className="settings-input pin-input"
                value={newPin}
                onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError("") }}
                placeholder={config.pin ? "New PIN (optional)" : "New PIN"}
                maxLength={4}
              />
              <button onClick={() => setShowPin((v) => !v)} className="pin-eye" aria-label="Toggle PIN visibility">
                {showPin ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
              </button>
            </div>
            {newPin && (
              <input
                type="password"
                inputMode="numeric"
                className="settings-input"
                value={confirmPin}
                onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError("") }}
                placeholder="Confirm PIN"
                maxLength={4}
                style={{ marginTop: "6px" }}
              />
            )}
            {pinError && <p className="pin-err-msg">{pinError}</p>}
            {config.pin && (
              <button
                className="pin-clear-btn"
                onClick={() => {
                  if (!confirm("Remove PIN protection?")) return
                  setDraft((d) => ({ ...d, pin: "" }))
                  setNewPin("")
                  setConfirmPin("")
                }}
              >
                Remove PIN
              </button>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button onClick={onClose} className="settings-cancel">Cancel</button>
          <button onClick={handleSave} className={`settings-save ${saved ? "settings-saved" : ""}`}>
            {saved ? <><Check size={14} strokeWidth={2.5} /> Saved!</> : "Save Changes"}
          </button>
        </div>
      </div>

      <style>{`
        .settings-overlay {
          position: fixed;
          inset: 0;
          z-index: 250;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        @keyframes settingsIn {
          from { opacity: 0; transform: translateY(-16px) rotate(-0.8deg); }
          to   { opacity: 1; transform: translateY(0)     rotate(-0.8deg); }
        }

        .settings-panel {
          position: relative;
          width: min(480px, 95vw);
          max-height: 88vh;
          overflow-y: auto;
          padding: 2.2rem 1.8rem 1.4rem;
          font-family: 'Segoe UI', 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive;
          color: #1c2b3a;

          background-color: #fefce8;
          background-image:
            repeating-linear-gradient(
              transparent,
              transparent 27px,
              rgba(0,0,0,0.06) 27px,
              rgba(0,0,0,0.06) 28px
            ),
            linear-gradient(
              to right,
              transparent 38px,
              rgba(220,80,80,0.15) 38px,
              rgba(220,80,80,0.15) 39px,
              transparent 39px
            );

          box-shadow: 4px 12px 36px rgba(0,0,0,0.32), 2px 4px 8px rgba(0,0,0,0.14);
          animation: settingsIn 0.38s cubic-bezier(0.22,1,0.36,1) both;
          transform: rotate(-0.8deg);
        }

        .settings-tack {
          position: absolute;
          top: -9px;
          left: 50%;
          transform: translateX(-50%);
          display: block;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #e8e8e8 0%, #b0b0b0 40%, #888 75%, #555 100%);
          box-shadow: 0 2px 5px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.6);
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.2rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px dashed rgba(0,0,0,0.15);
        }
        .settings-title {
          font-size: 1rem;
          font-weight: 900;
          color: #1c2b3a;
          margin: 0;
        }
        .settings-close {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(0,0,0,0.35);
          padding: 4px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .settings-close:hover { color: #ef4444; }

        .settings-body { display: flex; flex-direction: column; gap: 1rem; }

        .settings-section { display: flex; flex-direction: column; gap: 6px; }

        .settings-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(0,0,0,0.45);
          font-weight: 700;
        }
        .settings-hint {
          font-size: 0.72rem;
          color: rgba(0,0,0,0.4);
          font-style: italic;
          margin: 0;
        }

        .settings-input {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(0,0,0,0.18);
          border-radius: 3px;
          padding: 6px 10px;
          font-family: inherit;
          font-size: 0.88rem;
          color: #1c2b3a;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .settings-input:focus { border-color: #3b82f6; }

        /* Background presets */
        .bg-presets {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .bg-preset-btn {
          width: 44px;
          height: 36px;
          border-radius: 4px;
          border: 2px solid rgba(0,0,0,0.1);
          cursor: pointer;
          transition: border-color 0.15s, transform 0.15s;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-preset-btn:hover { transform: scale(1.08); }
        .bg-preset-active { border-color: #1c2b3a !important; box-shadow: 0 0 0 2px rgba(28,43,58,0.25); }
        .bg-color-btn { background: #e2e8f0; }

        /* Font options */
        .font-options { display: flex; gap: 6px; flex-wrap: wrap; }
        .font-option {
          padding: 5px 12px;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(0,0,0,0.15);
          border-radius: 3px;
          font-size: 0.82rem;
          cursor: pointer;
          color: #1c2b3a;
          transition: background 0.15s, border-color 0.15s;
        }
        .font-option:hover { background: rgba(255,255,255,0.9); }
        .font-option-active {
          background: #1c2b3a !important;
          color: #fef9e7 !important;
          border-color: #1c2b3a !important;
        }

        /* Note color swatches */
        .color-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .note-color-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.1);
          cursor: pointer;
          transition: transform 0.15s, border-color 0.15s;
        }
        .note-color-btn:hover { transform: scale(1.1); }
        .note-color-active { border-color: #1c2b3a; box-shadow: 0 0 0 2px rgba(28,43,58,0.3); transform: scale(1.15); }
        .note-color-custom {
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
        }

        /* Utility */
        .hidden-color-input {
          position: absolute;
          width: 0;
          height: 0;
          opacity: 0;
          pointer-events: none;
        }

        /* PIN row */
        .pin-row { display: flex; gap: 6px; align-items: center; }
        .pin-input { flex: 1; }
        .pin-eye {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(0,0,0,0.15);
          border-radius: 3px;
          padding: 6px 8px;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .pin-eye:hover { background: white; }
        .pin-err-msg { font-size: 0.72rem; color: #ef4444; margin: 0; font-style: italic; }
        .pin-clear-btn {
          background: none;
          border: none;
          color: #ef4444;
          font-family: inherit;
          font-size: 0.72rem;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          transition: opacity 0.15s;
          text-align: left;
        }
        .pin-clear-btn:hover { opacity: 0.7; }

        /* Footer */
        .settings-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 1.2rem;
          padding-top: 0.75rem;
          border-top: 1px dashed rgba(0,0,0,0.12);
        }
        .settings-cancel {
          background: rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 3px;
          padding: 6px 16px;
          font-family: inherit;
          font-size: 0.82rem;
          cursor: pointer;
          color: #64748b;
          transition: background 0.15s;
        }
        .settings-cancel:hover { background: rgba(0,0,0,0.1); }
        .settings-save {
          background: #1c2b3a;
          border: none;
          border-radius: 3px;
          padding: 6px 16px;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          color: #fef9e7;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 0.15s;
          box-shadow: 1px 2px 6px rgba(0,0,0,0.2);
        }
        .settings-save:hover { background: #0f172a; }
        .settings-saved { background: #16a34a !important; }
      `}</style>
    </div>
  )
}
