"use client"

import axios from "axios"
import { Camera, Check, Clock, Copy, QrCode, Wifi, X } from "lucide-react"
import { useRouter } from "next/navigation"
import QRCode from "qrcode"
import { useEffect, useRef, useState } from "react"
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
                alert(
                  "Invalid QR code! Doesn't seem to be a Note Everything session.",
                )
                setMode("share")
              }
            },
            () => {}, // ignore scan errors (they happen every frame)
          )
        } catch (err) {
          console.error("Camera error", err)
          if (isMounted) {
            alert(
              "Could not start camera. Make sure you granted permissions and are using HTTPS or localhost.",
            )
            setMode("share")
          }
        }
      }

      // Small delay to ensure #qr-reader is in the DOM
      setTimeout(startScanner, 100)

      return () => {
        isMounted = false
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode
            .stop()
            .then(() => html5QrCode.clear())
            .catch(() => {})
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
    <div
      className="share-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
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
          Both devices must be on the same WiFi. Scans merge notes in both
          directions.
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
        <div
          className="share-qr-wrap"
          style={{ minHeight: mode === "scan" ? "300px" : "202px" }}
        >
          {mode === "share" ? (
            <>
              {loading && (
                <span className="share-loading">Creating session…</span>
              )}
              {error && <span className="share-error">{error}</span>}
              {timeLeft === 0 && !loading && (
                <span className="share-error">
                  Session expired. Close and re-open.
                </span>
              )}
              <canvas
                ref={canvasRef}
                className="share-canvas"
                style={{
                  display:
                    loading || error || timeLeft === 0 ? "none" : "block",
                }}
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
            <button
              onClick={handleCopy}
              className="share-copy-btn"
              title="Copy link"
            >
              {copied ? (
                <Check size={12} strokeWidth={2.5} />
              ) : (
                <Copy size={12} strokeWidth={2} />
              )}
            </button>
          </div>
        )}

        {/* Status row */}
        <div className="share-status-row">
          {/* Timer */}
          {url && (
            <span
              className={`share-timer ${timeLeft < 60000 ? "share-timer-urgent" : ""}`}
            >
              <Clock size={10} strokeWidth={2} />
              {timeLeft > 0
                ? `${mins}:${String(secs).padStart(2, "0")}`
                : "Expired"}
            </span>
          )}
        </div>

        <p className="share-note-count">
          This device: {notes.length} note{notes.length !== 1 ? "s" : ""} ·
          polling every 5 s
        </p>
      </div>
    </div>
  )
}
