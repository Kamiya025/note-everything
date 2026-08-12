"use client"

import { OdometerCounter } from "../components/OdometerCounter"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Mail, Users, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { sendVisitorNotification } from "../lib/telegram"
import type { Note } from "../types"

dayjs.extend(relativeTime)

export function Footer() {
  const [visitorCount, setVisitorCount] = useState(0)

  const { data: visitorData } = useQuery<{ count: number }>({
    queryKey: ["visitors"],
    queryFn: async () => {
      const res = await axios.get("/api/visitors")
      return res.data
    },
    staleTime: 60_000,
  })

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await axios.get("/api/notes")
      return res.data
    },
  })

  const lastNote = notes[0]

  useEffect(() => {
    if (visitorData) setVisitorCount(visitorData.count)
  }, [visitorData])

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisited_WallOfNotes")
    if (!hasVisited) {
      sendVisitorNotification()
      sessionStorage.setItem("hasVisited_WallOfNotes", "true")
      axios.post("/api/visitors").then((res) => {
        setVisitorCount(res.data.count)
      }).catch(() => {})
    }
  }, [])

  return (
    <footer className="wood-footer">
      {/* Nail accents */}
      <span className="foot-nail foot-nail-l" aria-hidden="true" />
      <span className="foot-nail foot-nail-r" aria-hidden="true" />

      {/* Stats row */}
      <div className="foot-inner">
        {/* Visitors */}
        <div className="foot-stat">
          <Users size={11} strokeWidth={2} className="foot-icon" aria-hidden="true" />
          <OdometerCounter count={visitorCount} label="visitors" />
        </div>

        <span className="foot-sep" aria-hidden="true" />

        {/* Last note time */}
        <div className="foot-stat">
          <Clock size={11} strokeWidth={2} className="foot-icon" aria-hidden="true" />
          <span className="foot-label">latest</span>
          <span className="foot-value">
            {lastNote?.createdAt ? dayjs(lastNote.createdAt).fromNow() : "—"}
          </span>
        </div>

        <span className="foot-sep" aria-hidden="true" />

        {/* Email */}
        <a href="mailto:hawk01525@gmail.com" className="foot-email" title="Send email">
          <Mail size={11} strokeWidth={2} className="foot-icon" aria-hidden="true" />
          <span>hawk01525@gmail.com</span>
        </a>
      </div>

      <style>{`
        /* ── Wood footer bar ─────────────────────────── */
        .wood-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 80;
          flex-shrink: 0;

          /* Wood texture matching header board */
          background-color: #5a3018;
          background-image:
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 22px,
              rgba(0,0,0,0.04) 22px,
              rgba(0,0,0,0.04) 23px
            ),
            repeating-linear-gradient(
              180deg,
              rgba(255,255,255,0.025) 0px,
              rgba(255,255,255,0.025) 2px,
              transparent 2px,
              transparent 8px
            );
          border-top: 3px solid #3d1e0a;
          box-shadow:
            0 -4px 16px rgba(0,0,0,0.45),
            inset 0 1px 0 rgba(255,255,255,0.07);

          padding: 5px 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Nail heads */
        .foot-nail {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 30%,
            #e0e0e0 0%,
            #a0a0a0 50%,
            #555 100%
          );
          box-shadow: 0 1px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.4);
        }
        .foot-nail-l { left: 14px; }
        .foot-nail-r { right: 14px; }

        /* Inner stats row */
        .foot-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .foot-stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .foot-icon {
          color: rgba(255,255,255,0.35);
          flex-shrink: 0;
        }

        .foot-label {
          font-family: 'Chalkboard SE','Marker Felt','Comic Sans MS',sans-serif;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.35);
        }

        .foot-value {
          font-family: 'Chalkboard SE','Marker Felt','Comic Sans MS',sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          color: #fef08a;
          text-shadow: 1px 1px 0 rgba(0,0,0,0.6);
        }

        /* Vertical separator — looks like a carved groove */
        .foot-sep {
          display: block;
          width: 1px;
          height: 16px;
          background: rgba(0,0,0,0.4);
          box-shadow: 1px 0 0 rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        /* Email link */
        .foot-email {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'Chalkboard SE','Marker Felt','Comic Sans MS',sans-serif;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          transition: color 0.2s;
        }
        .foot-email:hover {
          color: rgba(255,255,255,0.65);
        }

        @media (max-width: 500px) {
          .foot-email span { display: none; }
          .foot-inner { gap: 8px; }
        }
      `}</style>
    </footer>
  )
}
