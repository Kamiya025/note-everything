"use client"
import React, { useState } from "react"
import { Send, Palette, Loader2, Lock } from "lucide-react"
import { sendTelegramNotification } from "../lib/telegram"
import { PRESET_COLORS } from "../types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import type { Note } from "../types"
import { db } from "../lib/db"
import { usePathname } from "next/navigation"
import { loadConfig } from "../lib/privateConfig"
interface NoteFormProps {
  onClose: () => void
}

export function NoteForm({ onClose }: NoteFormProps) {
  const pathname = usePathname()
  const isPrivate = pathname === "/private"

  // On the private wall, start with the user-configured default color
  const initialColor = isPrivate ? loadConfig().defaultNoteColor : PRESET_COLORS[0]
  const [content, setContent] = useState("")
  const [author, setAuthor] = useState("")
  const [color, setColor] = useState<string>(initialColor)
  const queryClient = useQueryClient()

  const { mutate: addNote, isPending: isSubmitting } = useMutation({
    mutationFn: async (newNote: {
      content: string
      author: string
      color: string
    }) => {
      const response = await axios.post("/api/notes", newNote)
      return response.data as Note
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Note[]>(["notes"], (old) => {
        if (!old) return [data]
        if (old.some((n) => n.id === data.id)) return old
        return [data, ...old].slice(0, 200)
      })
      sendTelegramNotification(data.content, data.author).catch(console.error)
      setContent("")
      setAuthor("")
      setColor(PRESET_COLORS[0])
      onClose()
    },
    onError: (error) => {
      console.error("Error adding note: ", error)
      alert("Failed to add note. Please try again.")
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    
    if (isPrivate) {
      const newNote: Note = {
        id: crypto.randomUUID(),
        content: content.trim(),
        author: author.trim() || "Me",
        color,
        createdAt: new Date().toISOString(),
        isPrivate: true,
      };
      
      try {
        await db.notes.add(newNote);
        setContent("")
        setAuthor("")
        setColor(PRESET_COLORS[0])
        onClose()
      } catch (err) {
        console.error("Error adding private note: ", err)
        alert("Failed to add private note.")
      }
    } else {
      addNote({
        content: content.trim(),
        author: author.trim() || "Anonymous",
        color,
      })
    }
  }

  return (
    <div
      className="form-sticky-note animate-fade-in"
      style={{ "--note-color": color } as React.CSSProperties}
    >
      {/* Thumbtack pin */}
      <div className="form-pin" aria-hidden="true" />

      {/* Header */}
      <div className="form-header">
        <span className="form-title">New Note</span>
        <button type="button" onClick={onClose} className="close-btn" title="Close">
          <span className="close-icon">×</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="note-form">
        {/* Content — sits on ruled lines */}
        <div className="form-field">
          <textarea
            className="form-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            required
            maxLength={150}
            disabled={isSubmitting}
            rows={5}
          />
          <div className="form-char-count">{content.length}/150</div>
        </div>

        {/* Signature + Color row */}
        <div className="form-row">
          {/* Optional signature */}
          <input
            type="text"
            className="form-input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="— sign your name (optional)"
            maxLength={40}
            disabled={isSubmitting}
            aria-label="Signature (optional)"
          />
        </div>
        <div className="form-row">
          <div className="form-colors">
            <Palette size={16} className="form-palette-icon" />
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-btn ${color === c ? "selected" : ""}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                disabled={isSubmitting}
                aria-label={`Color ${c}`}
              />
            ))}
            <input
              type="color"
              value={color.startsWith("#") ? color : "#ffffff"}
              onChange={(e) => setColor(e.target.value)}
              className="color-input"
              title="Custom color"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="submit-button"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="loading-spinner" size={18} />
              <span>Sticking…</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Stick to Wall</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
