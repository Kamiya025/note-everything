"use client"
import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, Lock } from "lucide-react"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="header-wrap">
      {/* Ropes */}
      <div className="ropes-row" aria-hidden="true">
        <span className="rope rope-left" />
        <span className="rope rope-right" />
      </div>

      {/* Wooden board */}
      <div className="wood-board">
        {/* Nail heads */}
        <span className="nail nail-left" aria-hidden="true" />
        <span className="nail nail-right" aria-hidden="true" />

        {/* Logo text */}
        <div className="board-logo">
          <span className="board-title">WALL</span>
          <span className="board-of">of</span>
          <span className="board-notes">NOTES</span>
        </div>

        {/* Separator scratch */}
        <div className="board-sep" aria-hidden="true" />

        {/* Navigation — paper tabs */}
        <nav className="board-nav" aria-label="Main navigation">
          <Link
            href="/"
            className={`tab-link ${pathname === "/" ? "tab-active" : ""}`}
          >
            <Globe size={13} strokeWidth={2.5} aria-hidden="true" />
            Public
            {pathname === "/" && <span className="tab-pin" aria-hidden="true" />}
          </Link>
          <Link
            href="/private"
            className={`tab-link ${pathname === "/private" ? "tab-active" : ""}`}
          >
            <Lock size={13} strokeWidth={2.5} aria-hidden="true" />
            Private
            {pathname === "/private" && <span className="tab-pin" aria-hidden="true" />}
          </Link>
        </nav>
      </div>

      <style>{`
        .header-wrap {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
          user-select: none;
        }

        /* ── Ropes ─────────────────────────────────── */
        .ropes-row {
          display: flex;
          gap: clamp(120px, 28vw, 240px);
        }
        .rope {
          display: block;
          width: 5px;
          height: 36px;
          border-radius: 3px;
          background: repeating-linear-gradient(
            160deg,
            #c9a96e 0px,
            #a07840 4px,
            #c9a96e 8px
          );
          box-shadow: 1px 0 3px rgba(0,0,0,0.4);
        }

        /* ── Wooden board ───────────────────────────── */
        .wood-board {
          pointer-events: auto;
          position: relative;
          display: flex;
          align-items: center;
          gap: clamp(8px, 2vw, 20px);
          padding: 10px clamp(16px, 4vw, 32px);
          border-radius: 4px;

          /* Wood texture layers */
          background-color: #6b3a1f;
          background-image:
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 18px,
              rgba(0,0,0,0.04) 18px,
              rgba(0,0,0,0.04) 19px
            ),
            repeating-linear-gradient(
              180deg,
              rgba(255,255,255,0.03) 0px,
              rgba(255,255,255,0.03) 2px,
              transparent 2px,
              transparent 8px
            );

          border: 3px solid #3d1e0a;
          border-bottom-width: 5px;
          box-shadow:
            0 6px 20px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -2px 0 rgba(0,0,0,0.3);
        }

        /* Nail heads in corners */
        .nail {
          position: absolute;
          top: 6px;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 30%,
            #e0e0e0 0%,
            #a0a0a0 50%,
            #555 100%
          );
          box-shadow: 0 2px 4px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.5);
        }
        .nail-left  { left: 14px; }
        .nail-right { right: 14px; }

        /* ── Logo text ──────────────────────────────── */
        .board-logo {
          display: flex;
          align-items: baseline;
          gap: 5px;
          flex-shrink: 0;
        }
        .board-title {
          font-family: 'Chalkboard SE', 'Marker Felt', 'Comic Sans MS', sans-serif;
          font-size: clamp(1rem, 3vw, 1.5rem);
          font-weight: 900;
          color: #fef08a;
          text-shadow: 2px 2px 0 rgba(0,0,0,0.7), 0 0 8px rgba(254,240,138,0.3);
          letter-spacing: 0.05em;
        }
        .board-of {
          font-family: 'Chalkboard SE', 'Marker Felt', 'Comic Sans MS', sans-serif;
          font-size: clamp(0.7rem, 1.8vw, 1rem);
          color: rgba(255,255,255,0.45);
          font-style: italic;
          letter-spacing: 0.1em;
        }
        .board-notes {
          font-family: 'Chalkboard SE', 'Marker Felt', 'Comic Sans MS', sans-serif;
          font-size: clamp(1rem, 3vw, 1.5rem);
          font-weight: 900;
          color: #fb923c;
          text-shadow: 2px 2px 0 rgba(0,0,0,0.7), 0 0 8px rgba(251,146,60,0.3);
          letter-spacing: 0.05em;
        }

        /* ── Separator ──────────────────────────────── */
        .board-sep {
          width: 2px;
          height: 28px;
          border-radius: 1px;
          background: rgba(0,0,0,0.4);
          box-shadow: 1px 0 0 rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        /* ── Nav tabs ───────────────────────────────── */
        .board-nav {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .tab-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 14px;
          border-radius: 2px;
          font-family: 'Chalkboard SE', 'Marker Felt', 'Comic Sans MS', sans-serif;
          font-size: clamp(0.72rem, 1.8vw, 0.92rem);
          font-weight: 700;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(0,0,0,0.3);
          border-bottom: 2px solid rgba(0,0,0,0.4);
          transition: color 0.2s, background 0.2s, transform 0.15s;
          cursor: pointer;
          white-space: nowrap;
        }

        .tab-link:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(0,0,0,0.35);
          transform: translateY(-1px);
        }

        /* Active tab: looks like a sticky note / index card */
        .tab-active {
          background: #fef9e7 !important;
          color: #3b2108 !important;
          border: 1px solid rgba(0,0,0,0.15) !important;
          border-bottom: 2px solid rgba(0,0,0,0.2) !important;
          box-shadow:
            0 3px 8px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.8);
          transform: none !important;
          font-weight: 900;
        }

        /* Thumbtack on active tab */
        .tab-pin {
          position: absolute;
          top: -7px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 30%,
            #e8e8e8 0%,
            #b0b0b0 45%,
            #666 100%
          );
          box-shadow: 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.5);
          z-index: 2;
        }

        /* ── Swing animation ─────────────────────────── */
        @keyframes gentleSwing {
          0%   { transform: translateX(-50%) rotate(-0.8deg); }
          50%  { transform: translateX(-50%) rotate(0.8deg); }
          100% { transform: translateX(-50%) rotate(-0.8deg); }
        }
        .header-wrap {
          animation: gentleSwing 5s ease-in-out infinite;
          transform-origin: top center;
        }

        @media (max-width: 400px) {
          .board-sep { display: none; }
          .board-of  { display: none; }
        }
      `}</style>
    </header>
  )
}
