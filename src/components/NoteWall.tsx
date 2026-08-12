"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import type { Note } from "../types"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { NoteCard } from "./NoteCard"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "../lib/db"
import { NoteToast } from "./NoteToast"
import { useNotifications } from "../lib/useNotifications"
import { Bell, BellOff } from "lucide-react"

interface NotePosition {
  left: string
  top: string
  rotate: string
  delay: string
  zIndex: number
}

interface NoteWallProps {
  mode: "public" | "private"
  noteFont?: string
  defaultNoteColor?: string
}

export const NoteWall: React.FC<NoteWallProps> = ({ mode, noteFont, defaultNoteColor }) => {
  const queryClient = useQueryClient()
  const [positions, setPositions] = useState<Record<string, NotePosition>>({})
  const [toast, setToast] = useState<{ author: string; preview: string } | null>(null)
  const { notify, enabled: notifEnabled, setEnabled: setNotifEnabled, permission, requestPermission } = useNotifications()

  // Fetch remote notes
  const { data: remoteNotes = [], isLoading: isRemoteLoading } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await axios.get("/api/notes")
      return response.data
    },
    enabled: mode === "public",
  })

  // Fetch private local notes
  const localNotes = useLiveQuery(() => db.notes.toArray()) || []

  const allNotes = mode === "public" ? remoteNotes : localNotes
  const isLoading = mode === "public" ? isRemoteLoading : false

  // Set positions for notes
  useEffect(() => {
    if (!allNotes.length) return

    setPositions((prevPositions) => {
      const newPositions = { ...prevPositions }
      let hasNewPositions = false
      allNotes.forEach((note) => {
        if (!newPositions[note.id!]) {
          newPositions[note.id!] = {
            left: `${5 + Math.random() * 75}%`,
            top: `${5 + Math.random() * 75}%`,
            rotate: `${-15 + Math.random() * 30}deg`,
            delay: `${Math.random() * -5}s`,
            zIndex: Math.floor(Math.random() * 50),
          }
          hasNewPositions = true
        }
      })
      return hasNewPositions ? newPositions : prevPositions
    })
  }, [allNotes])

  // Setup Supabase Realtime subscription just to update React Query cache
  useEffect(() => {
    if (!supabase || mode === "private") return

    const channel = supabase
      .channel("public:notes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes" },
        (payload) => {
          const newNote = payload.new as Note
          
          // Pre-generate position for the new note to ensure it stays on top
          setPositions((prevPositions) => {
            if (prevPositions[newNote.id!]) return prevPositions
            return {
              ...prevPositions,
              [newNote.id!]: {
                left: `${5 + Math.random() * 75}%`,
                top: `${5 + Math.random() * 75}%`,
                rotate: `${-15 + Math.random() * 30}deg`,
                delay: `${Math.random() * -5}s`,
                zIndex: Math.floor(Math.random() * 50) + 50, // Always on top
              },
            }
          })

          // Update React Query Cache
          queryClient.setQueryData<Note[]>(["notes"], (old) => {
            if (!old) return [newNote]
            if (old.some(n => n.id === newNote.id)) return old
            return [newNote, ...old].slice(0, 200)
          })

          // Notifications
          if (document.hidden) {
            // Tab is in background → browser notification
            notify(
              "New note on the Wall!",
              `${newNote.author ?? "Someone"}: ${(newNote.content ?? "").slice(0, 80)}`
            )
          } else {
            // Tab is visible → show in-app toast
            setToast({ author: newNote.author ?? "", preview: newNote.content ?? "" })
          }
        }
      )
      .subscribe()

    return () => {
      supabase?.removeChannel(channel)
    }
  }, [queryClient, notify, notifEnabled])

  if (isLoading) {
    const skeletonNotes = Array.from({ length: 6 }).map((_, i) => ({
      left: `${15 + ((i * 27) % 60)}%`,
      top: `${10 + ((i * 19) % 60)}%`,
      rotate: `${(i % 2 === 0 ? 1 : -1) * (5 + ((i * 3) % 15))}deg`,
      delay: `${-(i * 0.5)}s`,
    }))

    return (
      <div className="wall-container animate-fade-in">
        {skeletonNotes.map((pos, i) => (
          <div
            key={`skeleton-${i}`}
            className="note-card skeleton-note floating-note"
            style={
              {
                left: pos.left,
                top: pos.top,
                "--base-rotate": pos.rotate,
                animationDelay: pos.delay,
                zIndex: i,
              } as React.CSSProperties
            }
          >
            <div className="skeleton-line w-[85%]"></div>
            <div className="skeleton-line w-[60%]"></div>
            <div className="skeleton-line w-[90%]"></div>
            <div className="skeleton-line w-[40%]"></div>
            <div className="note-footer mt-8 border-t border-black/5">
              <div className="skeleton-line w-[30%] mb-0 h-[0.9rem]"></div>
              <div className="skeleton-line w-[20%] mb-0 h-[0.9rem]"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (allNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center">
        <p className="text-slate-800 font-semibold text-xl bg-white/40 px-8 py-4 rounded-lg drop-shadow-sm" style={{ textShadow: "1px 1px 0px rgba(255,255,255,0.4)" }}>
          The wall is empty. Be the first to stick a note!
        </p>
      </div>
    )
  }

  return (
    <div className="wall-container animate-fade-in">
      {allNotes.map((note) => {
        const pos = positions[note.id as string]
        if (!pos) return null
        return <NoteCard key={note.id} note={note} pos={pos} noteFont={noteFont} />
      })}

      {/* Bell toggle — only on public wall */}
      {mode === "public" && (
        <button
          onClick={async () => {
            if (permission === "default") await requestPermission()
            else setNotifEnabled(!notifEnabled)
          }}
          className="bell-toggle"
          title={notifEnabled ? "Mute new note alerts" : "Enable new note alerts"}
          aria-label={notifEnabled ? "Disable notifications" : "Enable notifications"}
        >
          {notifEnabled
            ? <Bell size={13} strokeWidth={2.5} />
            : <BellOff size={13} strokeWidth={2.5} />}
          <span>{notifEnabled ? "Alerts On" : "Alerts Off"}</span>
        </button>
      )}

      {/* In-app toast for new public notes */}
      {toast && (
        <NoteToast
          author={toast.author}
          preview={toast.preview}
          onDismiss={() => setToast(null)}
        />
      )}

      <style>{`
        @keyframes bellTabIn {
          from { opacity: 0; transform: translateY(10px) rotate(-1.5deg); }
          to   { opacity: 1; transform: translateY(0)    rotate(-1.5deg); }
        }
        .bell-toggle {
          position: fixed;
          bottom: 52px;
          left: clamp(10px, 2vw, 20px);
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px 7px;
          font-family: 'Chalkboard SE','Marker Felt','Comic Sans MS',sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          color: #1c2b3a;
          background-color: ${notifEnabled ? "#dcfce7" : "#fef9c3"};
          background-image: repeating-linear-gradient(
            transparent, transparent 15px,
            rgba(0,0,0,0.06) 15px, rgba(0,0,0,0.06) 16px
          );
          border: none;
          box-shadow: 2px 4px 10px rgba(0,0,0,0.22), 1px 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
          transform: rotate(-1.5deg);
          transform-origin: bottom left;
          animation: bellTabIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
          transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s;
        }
        .bell-toggle:hover {
          transform: rotate(0deg) translateY(-2px);
          box-shadow: 3px 8px 18px rgba(0,0,0,0.28);
        }
      `}</style>
    </div>
  )
}
