"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import type { Note } from "../types"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { NoteCard } from "./NoteCard"

interface NotePosition {
  left: string
  top: string
  rotate: string
  delay: string
  zIndex: number
}

export const NoteWall: React.FC = () => {
  const queryClient = useQueryClient()
  const [positions, setPositions] = useState<Record<string, NotePosition>>({})

  // Fetch initial notes via API and React Query
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await axios.get("/api/notes")
      return response.data
    },
  })

  // Set positions for notes
  useEffect(() => {
    if (!notes.length) return

    setPositions((prevPositions) => {
      const newPositions = { ...prevPositions }
      let hasNewPositions = false
      notes.forEach((note) => {
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
  }, [notes])

  // Setup Supabase Realtime subscription just to update React Query cache
  useEffect(() => {
    if (!supabase) return

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
            // Avoid duplicates just in case
            if (old.some(n => n.id === newNote.id)) return old
            return [newNote, ...old].slice(0, 200)
          })
        }
      )
      .subscribe()

    return () => {
      supabase?.removeChannel(channel)
    }
  }, [queryClient])

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

  if (notes.length === 0) {
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
      {notes.map((note) => {
        const pos = positions[note.id as string]
        if (!pos) return null

        return <NoteCard key={note.id} note={note} pos={pos} />
      })}
    </div>
  )
}
