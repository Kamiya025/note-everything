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
  const [author, setAuthor] = useState("")
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
      // Optimistically update the cache if it doesn't already exist via Realtime
      queryClient.setQueryData<Note[]>(["notes"], (old) => {
        if (!old) return [data]
        if (old.some((n) => n.id === data.id)) return old
        return [data, ...old].slice(0, 200)
      })

      // Send Telegram Notification in the background (fire and forget)
      sendTelegramNotification(data.content, data.author).catch(console.error)

      // Reset form and close
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    const finalAuthor = author.trim() || "Anonymous"

    addNote({
      content: content.trim(),
      author: finalAuthor,
      color: color,
    })
  }

  return (
    <div
      className="form-sticky-note animate-fade-in w-full sm:min-w-min"
      style={{ backgroundColor: color }}
    >
      <div className="flex whitespace-nowrap justify-between gap-2 items-center mb-6">
        <h2 className="m-0 text-slate-800 text-2xl font-semibold">
          Create New Note
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="close-btn"
          title="Close note"
        >
          <span className="close-icon">X</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="note-form">
        <div className="relative">
          <textarea
            className="sticky-input w-full"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            required
            maxLength={150}
            disabled={isSubmitting}
          />
          <div className="text-right text-xs text-slate-500 mt-1 italic">
            {content.length}/150
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mt-4">
          <input
            type="text"
            className="sticky-input flex-1 w-full sm:w-auto"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={30}
            disabled={isSubmitting}
          />

          <div className="color-picker flex items-center gap-2">
            <Palette size={20} className="text-slate-500" />
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-btn ${color === c ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  disabled={isSubmitting}
                  aria-label={`Select color ${c}`}
                />
              ))}
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={color.startsWith("#") ? color : "#ffffff"}
                  onChange={(e) => setColor(e.target.value)}
                  className="color-input"
                  title="Choose custom color"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="submit-button mt-4"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Sticking...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Stick to Wall</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
