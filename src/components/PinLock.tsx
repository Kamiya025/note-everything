"use client"

import React, { useState } from "react"
import { Lock, RotateCcw } from "lucide-react"
import { setUnlocked, saveConfig, loadConfig } from "../lib/privateConfig"

interface PinLockProps {
  onUnlock: () => void
}

export function PinLock({ onUnlock }: PinLockProps) {
  const [digits, setDigits] = useState(["", "", "", ""])
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  const refs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
  ]

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[i] = digit
    setDigits(next)
    setError(false)

    if (digit && i < 3) {
      refs[i + 1].current?.focus()
    }

    // Auto-submit when last digit filled
    if (digit && i === 3) {
      const pin = [...next.slice(0, 3), digit].join("")
      checkPin(pin)
    }
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs[i - 1].current?.focus()
    }
  }

  const checkPin = (pin: string) => {
    const config = loadConfig()
    if (pin === config.pin) {
      setUnlocked()
      onUnlock()
    } else {
      setShaking(true)
      setError(true)
      setDigits(["", "", "", ""])
      setTimeout(() => {
        setShaking(false)
        refs[0].current?.focus()
      }, 500)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkPin(digits.join(""))
  }

  const handleForgetPin = () => {
    if (!confirm("Reset PIN? You'll lose PIN protection but keep all your notes.")) return
    const config = loadConfig()
    saveConfig({ ...config, pin: "" })
    setUnlocked()
    onUnlock()
  }

  return (
    <div className="pin-overlay">
      <div className={`pin-card ${shaking ? "pin-shake" : ""}`}>
        {/* Thumbtack */}
        <span className="pin-tack" aria-hidden="true" />

        {/* Icon + title */}
        <div className="pin-header">
          <div className="pin-icon-wrap">
            <Lock size={22} strokeWidth={2.5} className="pin-icon" />
          </div>
          <h2 className="pin-title">Private Wall</h2>
          <p className="pin-sub">Enter your PIN to continue</p>
        </div>

        {/* Digit inputs */}
        <form onSubmit={handleSubmit} className="pin-form">
          <div className="pin-digits">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`pin-digit ${error ? "pin-digit-error" : ""}`}
                autoFocus={i === 0}
                aria-label={`PIN digit ${i + 1}`}
              />
            ))}
          </div>

          {error && <p className="pin-error">Incorrect PIN. Try again.</p>}

          <button type="submit" className="pin-btn">Unlock</button>
        </form>

        {/* Forget PIN */}
        <button onClick={handleForgetPin} className="pin-forget">
          <RotateCcw size={11} strokeWidth={2} />
          Forgot PIN? Reset it
        </button>
      </div>

      <style>{`
        .pin-overlay {
          position: fixed;
          inset: 0;
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background-image: url('/bg-wall.png');
          background-size: cover;
          background-position: center;
          background-color: #eab308;
        }

        @keyframes pinIn {
          from { opacity: 0; transform: translateY(-20px) rotate(-1.5deg); }
          to   { opacity: 1; transform: translateY(0)     rotate(-1.5deg); }
        }
        @keyframes pinShake {
          0%, 100% { transform: rotate(-1.5deg) translateX(0); }
          20%      { transform: rotate(-1.5deg) translateX(-8px); }
          40%      { transform: rotate(-1.5deg) translateX(8px); }
          60%      { transform: rotate(-1.5deg) translateX(-5px); }
          80%      { transform: rotate(-1.5deg) translateX(5px); }
        }

        .pin-card {
          position: relative;
          width: min(340px, 90vw);
          padding: 2.5rem 2rem 1.5rem;
          font-family: 'Segoe UI', 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive;
          color: #1c2b3a;

          background-color: #fef9c3;
          background-image:
            repeating-linear-gradient(
              transparent,
              transparent 27px,
              rgba(0,0,0,0.07) 27px,
              rgba(0,0,0,0.07) 28px
            ),
            linear-gradient(
              to right,
              transparent 38px,
              rgba(220,80,80,0.18) 38px,
              rgba(220,80,80,0.18) 39px,
              transparent 39px
            );

          box-shadow:
            4px 12px 32px rgba(0,0,0,0.32),
            2px 4px 8px rgba(0,0,0,0.14);
          animation: pinIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
          transform: rotate(-1.5deg);
          transform-origin: top center;
        }
        .pin-shake {
          animation: pinShake 0.45s ease both !important;
        }

        /* Thumbtack */
        .pin-tack {
          position: absolute;
          top: -9px;
          left: 50%;
          transform: translateX(-50%);
          display: block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #e8e8e8 0%, #b0b0b0 40%, #888 75%, #555 100%);
          box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.6);
        }

        .pin-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .pin-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #1c2b3a;
          margin-bottom: 0.75rem;
        }
        .pin-icon { color: #fef08a; }
        .pin-title {
          font-size: 1.2rem;
          font-weight: 900;
          color: #1c2b3a;
          margin-bottom: 0.2rem;
        }
        .pin-sub {
          font-size: 0.78rem;
          color: rgba(0,0,0,0.45);
          font-style: italic;
        }

        .pin-form { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }

        .pin-digits {
          display: flex;
          gap: 12px;
        }
        .pin-digit {
          width: 52px;
          height: 60px;
          border: 2px solid rgba(0,0,0,0.15);
          border-radius: 4px;
          background: rgba(255,255,255,0.7);
          font-size: 1.8rem;
          font-weight: 900;
          text-align: center;
          color: #1c2b3a;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
          caret-color: transparent;
        }
        .pin-digit:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.2), inset 0 1px 3px rgba(0,0,0,0.1);
        }
        .pin-digit-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.2) !important;
        }

        .pin-error {
          font-size: 0.78rem;
          color: #ef4444;
          font-style: italic;
          margin: 0;
        }

        .pin-btn {
          width: 100%;
          background: #1c2b3a;
          color: #fef9e7;
          border: none;
          border-radius: 2px;
          padding: 0.65rem 1rem;
          font-family: inherit;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: background 0.15s;
          box-shadow: 2px 3px 8px rgba(0,0,0,0.25);
        }
        .pin-btn:hover { background: #0f172a; }

        .pin-forget {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.65rem;
          color: rgba(0,0,0,0.3);
          padding: 0.5rem 0 0;
          transition: color 0.2s;
          width: 100%;
        }
        .pin-forget:hover { color: #ef4444; }
      `}</style>
    </div>
  )
}
