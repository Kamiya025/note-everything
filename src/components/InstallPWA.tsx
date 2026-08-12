"use client"

import React, { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

const SESSION_KEY = "pwa-prompt-hidden"

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Don't show if user already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`PWA install: ${outcome}`)
    setDeferredPrompt(null)
    dismiss()
  }

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1")
    setLeaving(true)
    setTimeout(() => setIsVisible(false), 300)
  }

  if (!isVisible) return null

  return (
    <>
      <div className={`pwa-chip ${leaving ? "pwa-out" : "pwa-in"}`} role="dialog" aria-label="Install app">
        <span className="pwa-pin" aria-hidden="true" />
        <div className="pwa-inner">
          <Download size={14} strokeWidth={2.5} className="pwa-icon" aria-hidden="true" />
          <div className="pwa-text">
            <span className="pwa-label">Install App</span>
            <span className="pwa-sub">Add to home screen</span>
          </div>
          <button onClick={handleInstall} className="pwa-install-btn" title="Install">Install</button>
          <button onClick={dismiss} className="pwa-close-btn" aria-label="Dismiss" title="Dismiss this session">
            <X size={11} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pwaIn {
          from { opacity: 0; transform: translateY(12px) rotate(-1deg); }
          to   { opacity: 1; transform: translateY(0)    rotate(-1deg); }
        }
        @keyframes pwaOut {
          from { opacity: 1; transform: translateY(0)    rotate(-1deg); }
          to   { opacity: 0; transform: translateY(10px) rotate(-2deg); }
        }

        .pwa-chip {
          position: fixed;
          bottom: 48px;
          left: clamp(10px, 2vw, 20px);
          z-index: 200;
          transform: rotate(-1deg);
          transform-origin: bottom left;

          /* small sticky note */
          background-color: #fef3c7;
          background-image:
            repeating-linear-gradient(
              transparent,
              transparent 19px,
              rgba(0,0,0,0.06) 19px,
              rgba(0,0,0,0.06) 20px
            );
          box-shadow:
            2px 4px 12px rgba(0,0,0,0.22),
            1px 1px 3px  rgba(0,0,0,0.1);
          padding: 6px 10px 8px;
          width: clamp(190px, 55vw, 230px);
          font-family: 'Segoe UI', 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive;
        }
        .pwa-in  { animation: pwaIn  0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .pwa-out { animation: pwaOut 0.3s ease-in both; }

        /* tiny thumbtack */
        .pwa-pin {
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          display: block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 35%,
            #d0d0d0 0%,
            #999 45%,
            #555 100%
          );
          box-shadow: 0 2px 4px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.5);
        }

        .pwa-inner {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pwa-icon {
          font-size: 1rem;
          flex-shrink: 0;
          opacity: 0.75;
        }

        .pwa-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .pwa-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: #1c2b3a;
          white-space: nowrap;
        }
        .pwa-sub {
          font-size: 0.65rem;
          color: rgba(0,0,0,0.4);
          font-style: italic;
          white-space: nowrap;
        }

        .pwa-install-btn {
          background: #334155;
          color: #fef9e7;
          border: none;
          border-radius: 2px;
          padding: 3px 8px;
          font-family: inherit;
          font-size: 0.68rem;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .pwa-install-btn:hover { background: #0f172a; }

        .pwa-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.72rem;
          color: rgba(0,0,0,0.3);
          padding: 0 2px;
          font-family: inherit;
          flex-shrink: 0;
          line-height: 1;
          transition: color 0.15s;
        }
        .pwa-close-btn:hover { color: #ef4444; }
      `}</style>
    </>
  )
}
