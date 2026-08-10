"use client"

import { OdometerCounter } from "../components/OdometerCounter"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Mail } from "lucide-react"
import { useEffect, useState } from "react"
import { sendVisitorNotification } from "../lib/telegram"
import type { Note } from "../types"

dayjs.extend(relativeTime)

export function Footer() {
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

  return (
    <footer className="stats-footer">
      <OdometerCounter count={visitorCount} label="visitors" />
      <div className="stats-divider" />
      <div className="last-note-info">
        <span className="last-note-label">latest note</span>
        <span className="last-note-time">
          {lastNote?.createdAt
            ? dayjs(lastNote.createdAt).fromNow()
            : "no notes yet"}
        </span>
      </div>
      <div className="stats-divider" />
      <a href="mailto:hawk01525@gmail.com" className="footer-email">
        <Mail size={12} className="inline mr-1 opacity-70" />
        hawk01525@gmail.com
      </a>
    </footer>
  )
}
