"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { X, Copy, Check, Clock, Wifi, RefreshCw, Camera, QrCode } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"
import type { Note } from "../types"

interface ShareModalProps {
  /** The host device's current local notes */
  notes: Note[]
  onClose: () => void
}

const EXPIRE_MS = 10 * 60 * 1000
const POLL_INTERVAL = 5000 // 5 seconds

export function ShareModal({ notes, onClose }: ShareModalProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [url, setUrl] = useState("")
  const [token, setToken] = useState("")
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(EXPIRE_MS)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const expiresAtRef = useRef<number>(0)

  const [mode, setMode] = useState<"share" | "scan">("share")
  const scannerRef = useRef<any>(null)

  // Create session on mount
  useEffect(() => {
    axios
      .post("/api/share", { notes })
      .then(({ data }) => {
        setUrl(data.url)
        setToken(data.token)
        expiresAtRef.current = data.expiresAt
        setTimeLeft(data.expiresAt - Date.now())
        setLoading(false)

        // Delegate syncing to page.tsx so it continues in the background even if modal is closed!
        router.replace(`/private?share=${data.token}`, { scroll: false })
      })
      .catch(() => {
        setError("Failed to create sync session.")
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Render QR
  useEffect(() => {
    if (!url || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 190,
      margin: 2,
      color: { dark: "#1c2b3a", light: "#fef9c3" },
    })
  }, [url])

  useEffect(() => {
    if (!expiresAtRef.current) return
    const id = setInterval(() => {
      const left = expiresAtRef.current - Date.now()
      setTimeLeft(left > 0 ? left : 0)
    }, 1000)
    return () => clearInterval(id)
  }, [url])

  // QR Scanner initialization
  useEffect(() => {
    if (mode === "scan") {
      let isMounted = true
      let html5QrCode: any = null

      const startScanner = async () => {
        try {
          const { Html5Qrcode } = await import("html5-qrcode")
          if (!isMounted) return
          
          html5QrCode = new Html5Qrcode("qr-reader")
          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (text) => {
              if (html5QrCode?.isScanning) {
                html5QrCode.stop().catch(() => {})
              }
              const match = text.match(/share=([a-zA-Z0-9]+)/)
              if (match && match[1]) {
                router.replace(`/private?share=${match[1]}`)
                onClose()
              } else {
                alert("Invalid QR code! Doesn't seem to be a Note Everything session.")
                setMode("share")
              }
            },
            () => {} // ignore scan errors (they happen every frame)
          )
        } catch (err) {
          console.error("Camera error", err)
          if (isMounted) {
            alert("Could not start camera. Make sure you granted permissions and are using HTTPS or localhost.")
            setMode("share")
          }
        }
      }

      // Small delay to ensure #qr-reader is in the DOM
      setTimeout(startScanner, 100)

      return () => {
        isMounted = false
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {})
        }
      }
    }
  }, [mode, router, onClose])

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const mins = Math.floor(timeLeft / 60000)
  const secs = Math.floor((timeLeft % 60000) / 1000)

  return (
    <div className="share-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="share-card">
        <span className="share-tack" aria-hidden="true" />

        {/* Header */}
        <div className="share-header">
          <div className="share-header-left">
            <Wifi size={14} strokeWidth={2.5} className="share-wifi-icon" />
            <h2 className="share-title">LAN Sync</h2>
          </div>
          <button onClick={onClose} className="share-close" aria-label="Close">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <p className="share-sub">
          Both devices must be on the same WiFi. Scans merge notes in both directions.
        </p>

        {/* Mode Toggle */}
        <div className="share-mode-toggle">
          <button
            className={`share-mode-btn ${mode === "share" ? "share-mode-active" : ""}`}
            onClick={() => setMode("share")}
          >
            <QrCode size={14} /> Show QR
          </button>
          <button
            className={`share-mode-btn ${mode === "scan" ? "share-mode-active" : ""}`}
            onClick={() => setMode("scan")}
          >
            <Camera size={14} /> Scan to Join
          </button>
        </div>

        {/* QR or Scanner */}
        <div className="share-qr-wrap" style={{ minHeight: mode === "scan" ? "300px" : "202px" }}>
          {mode === "share" ? (
            <>
              {loading && <span className="share-loading">Creating session…</span>}
              {error && <span className="share-error">{error}</span>}
              {timeLeft === 0 && !loading && (
                <span className="share-error">Session expired. Close and re-open.</span>
              )}
              <canvas
                ref={canvasRef}
                className="share-canvas"
                style={{ display: loading || error || timeLeft === 0 ? "none" : "block" }}
              />
            </>
          ) : (
            <div id="qr-reader" style={{ width: "100%", border: "none" }} />
          )}
        </div>

        {/* URL row */}
        {url && timeLeft > 0 && (
          <div className="share-url-row">
            <span className="share-url">{url}</span>
            <button onClick={handleCopy} className="share-copy-btn" title="Copy link">
              {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
            </button>
          </div>
        )}

        {/* Status row */}
        <div className="share-status-row">
          {/* Timer */}
          {url && (
            <span className={`share-timer ${timeLeft < 60000 ? "share-timer-urgent" : ""}`}>
              <Clock size={10} strokeWidth={2} />
              {timeLeft > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : "Expired"}
            </span>
          )}
        </div>

        <p className="share-note-count">
          This device: {notes.length} note{notes.length !== 1 ? "s" : ""} · polling every 5 s
        </p>
      </div>

      <style>{`
        .share-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        @keyframes shareIn {
          from { opacity: 0; transform: translateY(-18px) rotate(1deg); }
          to   { opacity: 1; transform: translateY(0)     rotate(1deg); }
        }
        .share-card {
          position: relative;
          width: min(300px, 92vw);
          padding: 2rem 1.4rem 1.2rem;
          font-family: 'Segoe UI','Comic Sans MS','Chalkboard SE','Marker Felt',cursive;
          color: #1c2b3a;
          background-color: #fef9c3;
          background-image:
            repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.07) 27px, rgba(0,0,0,0.07) 28px),
            linear-gradient(to right, transparent 38px, rgba(220,80,80,0.18) 38px, rgba(220,80,80,0.18) 39px, transparent 39px);
          box-shadow: 4px 12px 32px rgba(0,0,0,0.32), 2px 4px 8px rgba(0,0,0,0.14);
          animation: shareIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
          transform: rotate(1deg);
        }
        .share-tack {
          position: absolute; top: -9px; left: 50%; transform: translateX(-50%);
          display: block; width: 18px; height: 18px; border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #e8e8e8 0%, #b0b0b0 40%, #888 75%, #555 100%);
          box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.6);
        }
        .share-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 0.4rem; padding-bottom: 0.5rem;
          border-bottom: 1px dashed rgba(0,0,0,0.15);
        }
        .share-header-left { display: flex; align-items: center; gap: 6px; }
        .share-wifi-icon { color: #3b82f6; }
        .share-title { font-size: 0.92rem; font-weight: 900; margin: 0; }
        .share-close {
          background: none; border: none; cursor: pointer;
          color: rgba(0,0,0,0.35); padding: 3px; border-radius: 3px;
          display: flex; align-items: center; transition: color 0.15s;
        }
        .share-close:hover { color: #ef4444; }
        .share-sub {
          font-size: 0.68rem; color: rgba(0,0,0,0.45);
          font-style: italic; margin: 0 0 0.65rem;
        }
        .share-mode-toggle {
          display: flex; gap: 4px; margin-bottom: 0.6rem;
          background: rgba(0,0,0,0.05); border-radius: 4px; padding: 3px;
        }
        .share-mode-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 6px 0; font-size: 0.72rem; font-family: inherit; font-weight: 700;
          color: #64748b; background: transparent; border: none; border-radius: 3px;
          cursor: pointer; transition: background 0.2s, color 0.2s;
        }
        .share-mode-btn:hover { color: #1c2b3a; }
        .share-mode-active {
          background: #fff; color: #1c2b3a;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .share-qr-wrap {
          display: flex; align-items: center; justify-content: center;
          background: #fef9c3; border: 1px dashed rgba(0,0,0,0.12);
          border-radius: 4px; padding: 6px; min-height: 202px;
          margin-bottom: 0.6rem; overflow: hidden;
        }
        .share-canvas { border-radius: 4px; display: block; }
        .share-loading { font-size: 0.75rem; color: rgba(0,0,0,0.4); font-style: italic; }
        .share-error { font-size: 0.72rem; color: #ef4444; font-style: italic; text-align: center; }
        .share-url-row {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.12);
          border-radius: 3px; padding: 4px 7px; margin-bottom: 0.4rem;
        }
        .share-url {
          flex: 1; font-size: 0.58rem; color: #334155;
          font-family: 'Courier New', monospace;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .share-copy-btn {
          background: none; border: none; cursor: pointer;
          color: #64748b; padding: 2px; display: flex; align-items: center;
          transition: color 0.15s; flex-shrink: 0;
        }
        .share-copy-btn:hover { color: #1c2b3a; }
        .share-status-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; margin-bottom: 0.3rem;
        }
        .share-timer {
          display: flex; align-items: center; gap: 3px;
          font-size: 0.65rem; color: rgba(0,0,0,0.38); font-style: italic;
        }
        .share-timer-urgent { color: #ef4444 !important; font-weight: 700; }
        .share-synced {
          display: flex; align-items: center; gap: 3px;
          font-size: 0.65rem; color: #16a34a; font-weight: 700;
        }
        .share-note-count {
          font-size: 0.62rem; color: rgba(0,0,0,0.28);
          text-align: right; margin: 0; font-style: italic;
        }
      `}</style>
    </div>
  )
}
