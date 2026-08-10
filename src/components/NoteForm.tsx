"use client"
import React, { useState } from "react"
import { Send, Palette, Loader2 } from "lucide-react"
import { sendTelegramNotification } from "../lib/telegram"
import { PRESET_COLORS } from "../types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import type { Note } from "../types"

interface NoteFormProps {
  onClose: () => void
}

export function NoteForm({ onClose }: NoteFormProps) {
  const [content, setContent] = useState("")
  const [color, setColor] = useState<string>(PRESET_COLORS[0])
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
      setColor(PRESET_COLORS[0])
      onClose()
    },
    onError: (error) => {
      console.error("Error adding note: ", error)
      alert("Failed to add note. Please try again.")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    addNote({
      content: content.trim(),
      author: "Anonymous",
      color,
    })
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

        {/* Author + Color row */}
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
