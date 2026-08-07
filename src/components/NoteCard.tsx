import React from "react"
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
  return (
    <div
      className="note-card glass-panel floating-note"
      style={
        {
          backgroundColor: note.color?.startsWith("#") ? note.color : undefined,
          left: pos.left,
          top: pos.top,
          "--base-rotate": pos.rotate,
          animationDelay: pos.delay,
          zIndex: pos.zIndex,
        } as React.CSSProperties
      }
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
