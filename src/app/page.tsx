"use client"

import { PenLine, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { NoteForm } from "../components/NoteForm"
import { NoteWall } from "../components/NoteWall"
import { OdometerCounter } from "../components/OdometerCounter"
import { isSupabaseConfigured } from "../lib/supabase"
import { sendVisitorNotification } from "../lib/telegram"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { Note } from "../types"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

export default function Home() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTearing, setIsTearing] = useState(false)
  const [visitorCount, setVisitorCount] = useState(0)

  // Fetch visitor count
  const { data: visitorData } = useQuery<{ count: number }>({
    queryKey: ["visitors"],
    queryFn: async () => {
      const res = await axios.get("/api/visitors")
      return res.data
    },
    staleTime: 60_000,
  })

  // Fetch notes to find the last note time
  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await axios.get("/api/notes")
      return res.data
    },
  })

  const lastNote = notes[0] // newest is first

  useEffect(() => {
    if (visitorData) {
      setVisitorCount(visitorData.count)
    }
  }, [visitorData])

  useEffect(() => {
    // Check if we already notified about this visitor in this session
    const hasVisited = sessionStorage.getItem("hasVisited_WallOfNotes")
    if (!hasVisited) {
      sendVisitorNotification()
      sessionStorage.setItem("hasVisited_WallOfNotes", "true")
      // Increment counter on new visit
      axios.post("/api/visitors").then((res) => {
        setVisitorCount(res.data.count)
      }).catch(() => {})
    }
  }, [])

  const handleAddNoteClick = () => {
    if (isTearing || isFormOpen) return
    setIsTearing(true)
    // Wait for the tear animation to complete before opening the form
    setTimeout(() => {
      setIsTearing(false)
      setIsFormOpen(true)
    }, 600) // 600ms matches the CSS animation duration
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="setup-card glass-panel">
          <h2>⚠️ Setup Required</h2>
          <p>
            It looks like Supabase is not configured yet. To get your Wall of
            Notes working, please replace the placeholder values in
            <code>src/lib/supabase.ts</code> or add them to your{" "}
            <code>.env.local</code> file.
          </p>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Note: The app needs a real Supabase database to store and display
            the notes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="header-container">
        <div className="hanging-sign">
          <h1>
            Wall of Notes{" "}
            <Sparkles
              style={{
                display: "inline",
                color: "#fbbf24",
                verticalAlign: "middle",
              }}
              size={28}
            />
          </h1>
          <p>Leave a thought, a quote, or just say hi. Everyone can see it!</p>
        </div>

        {/* Stats Panel */}
        <div className="stats-panel">
          <OdometerCounter count={visitorCount} label="lượt ghé thăm" />
          <div className="stats-divider" />
          <div className="last-note-info">
            <span className="last-note-label">ghi chú mới nhất</span>
            <span className="last-note-time">
              {lastNote?.createdAt
                ? dayjs(lastNote.createdAt).fromNow()
                : "chưa có ghi chú"}
            </span>
          </div>
        </div>
      </header>

      <main>
        {isFormOpen && (
          <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <NoteForm onClose={() => setIsFormOpen(false)} />
            </div>
          </div>
        )}

        <section>
          <NoteWall />
        </section>
      </main>

      <button
        className="sticky-stack-fab"
        onClick={handleAddNoteClick}
        aria-label="Write a note"
        title="Tear off a note to write"
      >
        <div className={`top-note ${isTearing ? 'tearing' : ''}`}>
          <PenLine size={24} color="#334155" />
        </div>
      </button>
    </div>
  )
}
