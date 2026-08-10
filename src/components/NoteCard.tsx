"use client"
import React, { useCallback, useMemo, useRef, useState } from "react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import type { Note } from "../types"

dayjs.extend(relativeTime)

interface NotePosition {
  left: string
  top: string
  rotate: string
  delay: string   // kept for skeleton compat, not used for pinned
  zIndex: number
}

interface NoteCardProps {
  note: Note
  pos: NotePosition
}

export function NoteCard({ note, pos }: NoteCardProps) {
  const [dragging, setDragging] = useState(false)
  const [justDropped, setJustDropped] = useState(false)
  const [position, setPosition] = useState<{ left: string; top: string } | null>(null)
  const [zIndex, setZIndex] = useState(pos.zIndex)
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  // Per-note physics randomness — stable across renders (useMemo with no deps = computed once)
  const physics = useMemo(() => {
    // entry spin: how much extra rotation the note has before hitting the wall
    const entrySpin = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 30)
    // wobble direction: which way it bounces after impact
    const wobbleDir = entrySpin > 0 ? -1 : 1
    // stagger the entry: later notes appear a bit after earlier ones (0 – 0.55s)
    const entryDelay = Math.random() * 0.55
    // entry duration: how fast it hits (0.55 – 0.85s)
    const entryDuration = 0.55 + Math.random() * 0.3
    // sway period: how slowly the settled note oscillates (7 – 13s)
    const swayDuration = 7 + Math.random() * 6

    return { entrySpin, wobbleDir, entryDelay, entryDuration, swayDuration }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      e.currentTarget.setPointerCapture(e.pointerId)

      const rect = e.currentTarget.getBoundingClientRect()
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      setDragging(true)
      setZIndex(9999)
    },
    []
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return

      const parent = cardRef.current?.parentElement
      if (!parent) return

      const parentRect = parent.getBoundingClientRect()
      const cardWidth = cardRef.current?.offsetWidth ?? 280
      const cardHeight = cardRef.current?.offsetHeight ?? 200

      const rawLeft = e.clientX - parentRect.left - dragOffset.current.x
      const rawTop = e.clientY - parentRect.top - dragOffset.current.y

      const clampedLeft = Math.max(0, Math.min(rawLeft, parentRect.width - cardWidth))
      const clampedTop = Math.max(0, Math.min(rawTop, parentRect.height - cardHeight))

      setPosition({
        left: `${clampedLeft}px`,
        top: `${clampedTop}px`,
      })
    },
    [dragging]
  )

  const onPointerUp = useCallback(() => {
    setDragging(false)
    setZIndex(Math.floor(Math.random() * 50) + 100)
    setJustDropped(true)
    setTimeout(() => setJustDropped(false), 450)
  }, [])

  const left = position?.left ?? pos.left
  const top = position?.top ?? pos.top

  return (
    <div
      ref={cardRef}
      className={`note-card glass-panel pinned-note${dragging ? " dragging" : ""}`}
      style={
        {
          backgroundColor: note.color?.startsWith("#") ? note.color : undefined,
          left,
          top,
          "--base-rotate": dragging ? "0deg" : pos.rotate,
          "--entry-spin": `${physics.entrySpin}deg`,
          "--wobble-dir": physics.wobbleDir,
          "--entry-duration": `${physics.entryDuration}s`,
          "--sway-duration": `${physics.swayDuration}s`,
          // slapOnWall waits --entry-delay, then pinnedSway starts right after
          "--entry-delay": `${physics.entryDelay}s`,
          "--sway-delay": `${physics.entryDelay + physics.entryDuration}s`,
          zIndex,
          cursor: dragging ? "grabbing" : "grab",
          animationPlayState: dragging ? "paused" : undefined,
          userSelect: "none",
          touchAction: "none",

        } as React.CSSProperties
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="note-content">{note.content}</div>
      <div className="note-footer">
        <span className="note-author">- {note.author}</span>
        <span>
          {note.createdAt ? dayjs(note.createdAt).fromNow() : "Just now"}
        </span>
      </div>
    </div>
  )
}
