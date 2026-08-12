"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import type { Note, TimelineGroup } from "../types"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { NoteCard } from "./NoteCard"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "../lib/db"
import { NoteToast } from "./NoteToast"
import { useNotifications } from "../lib/useNotifications"

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
  layoutMode?: "wall" | "timeline"
}

export const NoteWall: React.FC<NoteWallProps> = ({ mode, noteFont, defaultNoteColor, layoutMode = "wall" }) => {
  const queryClient = useQueryClient()
  const [positions, setPositions] = useState<Record<string, NotePosition>>({})
  const [toast, setToast] = useState<{ author: string; preview: string } | null>(null)
  const { notify, enabled: notifEnabled, setEnabled: setNotifEnabled, permission, requestPermission } = useNotifications()

  // Fetch remote notes (Public mode only)
  const { data: remoteData, isLoading: isRemoteLoading } = useQuery<{ flat?: Note[]; grouped?: TimelineGroup[] }>({
    queryKey: ["notes", layoutMode],
    queryFn: async () => {
      const response = await axios.get(`/api/notes?layout=${layoutMode}`)
      return response.data
    },
    enabled: mode === "public",
  })

  const remoteNotes = remoteData?.flat || []
  const remoteGrouped = remoteData?.grouped || []

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

          // Update React Query Cache for flat notes (and theoretically grouped, but for real-time we'll just invalidate or hack it)
          // To keep it simple, we can invalidate the query so it regroups properly from the API
          queryClient.invalidateQueries({ queryKey: ["notes"] })

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

  const isEmpty = mode === "public" && layoutMode === "timeline" 
    ? remoteGrouped.length === 0 
    : allNotes.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center">
        <p className="text-slate-800 font-semibold text-xl bg-white/40 px-8 py-4 rounded-lg drop-shadow-sm" style={{ textShadow: "1px 1px 0px rgba(255,255,255,0.4)" }}>
          The wall is empty. Be the first to stick a note!
        </p>
      </div>
    )
  }

  return (
    <div className={layoutMode === "wall" ? "wall-container animate-fade-in" : "timeline-container animate-fade-in"}>
      {layoutMode === "timeline" ? (
        <div className="timeline-wrapper">
          {mode === "public" ? (
            remoteGrouped.map((group) => (
              <div key={group.timeGroup} className="timeline-group">
                <div className="timeline-divider">
                  <span className="timeline-group-badge">{group.label}</span>
                </div>
                <div className="timeline-group-grid">
                  {group.notes.map((note) => (
                    <NoteCard key={note.id} note={note} pos={positions[note.id as string] || { left: "0", top: "0", rotate: "0deg", delay: "0s", zIndex: 1 }} noteFont={noteFont} isTimeline={true} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Private mode fallback (ungrouped)
            <div className="timeline-group-grid">
              {allNotes.map((note) => (
                <NoteCard key={note.id} note={note} pos={positions[note.id as string] || { left: "0", top: "0", rotate: "0deg", delay: "0s", zIndex: 1 }} noteFont={noteFont} isTimeline={true} />
              ))}
            </div>
          )}
        </div>
      ) : (
        allNotes.map((note) => {
          const pos = positions[note.id as string]
          if (!pos) return null
          return <NoteCard key={note.id} note={note} pos={pos} noteFont={noteFont} />
        })
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
      `}</style>
    </div>
  )
}
