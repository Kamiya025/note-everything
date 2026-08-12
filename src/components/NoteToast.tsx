"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface NoteToastProps {
  author: string
  preview: string
  onDismiss: () => void
}

export function NoteToast({ author, preview, onDismiss }: NoteToastProps) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaving(true)
      setTimeout(onDismiss, 350)
    }, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const dismiss = () => {
    setLeaving(true)
    setTimeout(onDismiss, 350)
  }

  return (
    <>
      <div className={`note-toast ${leaving ? "note-toast-out" : "note-toast-in"}`} role="status">
        {/* Thumbtack */}
        <span className="toast-pin" aria-hidden="true" />

        <div className="toast-body">
          <span className="toast-label">📌 New Note</span>
          <p className="toast-preview">{preview.slice(0, 60)}{preview.length > 60 ? "…" : ""}</p>
          {author && author !== "Anonymous" && (
            <span className="toast-author">— {author}</span>
          )}
        </div>

        <button onClick={dismiss} className="toast-close" aria-label="Dismiss">
          <X size={11} strokeWidth={2.5} />
        </button>
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(16px) rotate(1.5deg); }
          to   { opacity: 1; transform: translateY(0)    rotate(1.5deg); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateY(0)    rotate(1.5deg); }
          to   { opacity: 0; transform: translateY(12px) rotate(2deg); }
        }

        .note-toast {
          position: fixed;
          bottom: 56px;
          right: clamp(12px, 3vw, 24px);
          z-index: 180;

          display: flex;
          align-items: flex-start;
          gap: 8px;

          width: clamp(200px, 60vw, 260px);
          padding: 1.2rem 0.9rem 0.8rem;

          font-family: 'Segoe UI','Comic Sans MS','Chalkboard SE','Marker Felt',cursive;
          color: #1c2b3a;

          background-color: #fef9c3;
          background-image:
            repeating-linear-gradient(
              transparent, transparent 21px,
              rgba(0,0,0,0.07) 21px, rgba(0,0,0,0.07) 22px
            );
          box-shadow:
            3px 6px 18px rgba(0,0,0,0.26),
            1px 2px 4px rgba(0,0,0,0.1);

          transform: rotate(1.5deg);
          pointer-events: auto;
        }
        .note-toast-in  { animation: toastIn  0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .note-toast-out { animation: toastOut 0.35s ease-in both; }

        .toast-pin {
          position: absolute; top: -7px; left: 50%;
          transform: translateX(-50%);
          display: block; width: 14px; height: 14px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #e8e8e8 0%, #b0b0b0 40%, #888 75%, #555 100%);
          box-shadow: 0 2px 4px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.5);
        }

        .toast-body { flex: 1; min-width: 0; }
        .toast-label {
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(0,0,0,0.4);
          display: block;
          margin-bottom: 3px;
        }
        .toast-preview {
          font-size: 0.82rem;
          line-height: 1.4;
          color: #1c2b3a;
          margin: 0 0 3px;
          word-break: break-word;
        }
        .toast-author {
          font-size: 0.65rem;
          color: rgba(0,0,0,0.4);
          font-style: italic;
        }

        .toast-close {
          background: none; border: none; cursor: pointer;
          color: rgba(0,0,0,0.3); padding: 2px;
          display: flex; align-items: center; flex-shrink: 0;
          transition: color 0.15s;
        }
        .toast-close:hover { color: #ef4444; }
      `}</style>
    </>
  )
}
