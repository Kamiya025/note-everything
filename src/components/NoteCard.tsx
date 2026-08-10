"use client"
import React, { useCallback, useRef, useState } from "react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import type { Note } from "../types"

dayjs.extend(relativeTime)

interface NotePosition {
  left: string
  top: string
  rotate: string
  delay: string
  zIndex: number
}

interface NoteCardProps {
  note: Note
  pos: NotePosition
}

export function NoteCard({ note, pos }: NoteCardProps) {
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState<{ left: string; top: string } | null>(null)
  const [zIndex, setZIndex] = useState(pos.zIndex)
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Don't drag on text selection attempts
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

      // Clamp within parent bounds
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
    // Keep elevated z-index after drag
    setZIndex(Math.floor(Math.random() * 50) + 100)
  }, [])

  const left = position?.left ?? pos.left
  const top = position?.top ?? pos.top

  return (
    <div
      ref={cardRef}
      className={`note-card glass-panel floating-note${dragging ? " dragging" : ""}`}
      style={
        {
          backgroundColor: note.color?.startsWith("#") ? note.color : undefined,
          left,
          top,
          "--base-rotate": dragging ? "0deg" : pos.rotate,
          animationDelay: pos.delay,
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
