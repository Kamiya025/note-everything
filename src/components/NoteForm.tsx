"use client"
import React, { useState } from "react"
import { Send, Palette, Loader2, Lock, Square, Circle, Heart, Star } from "lucide-react"
import { sendTelegramNotification } from "../lib/telegram"
import { PRESET_COLORS } from "../types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import type { Note, NoteShape } from "../types"
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
  const [shape, setShape] = useState<NoteShape>("rectangle")
  const queryClient = useQueryClient()

  const { mutate: addNote, isPending: isSubmitting } = useMutation({
    mutationFn: async (newNote: {
      content: string
      author: string
      color: string
      shape: NoteShape
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
      setShape("rectangle")
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
        shape,
        createdAt: new Date().toISOString(),
        isPrivate: true,
      };
      
      try {
        await db.notes.add(newNote);
        setContent("")
        setAuthor("")
        setColor(PRESET_COLORS[0])
        setShape("rectangle")
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
        shape,
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
        
        {/* Shape Selection row */}
        <div className="form-row" style={{ marginTop: '0.4rem', marginBottom: '0.4rem' }}>
          <div className="form-colors" style={{ paddingBottom: '0.4rem', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginRight: '0.5rem' }}>Shape:</span>
            {(['rectangle', 'circle', 'heart', 'star'] as NoteShape[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`shape-btn ${shape === s ? "selected" : ""}`}
                onClick={() => setShape(s)}
                disabled={isSubmitting}
                aria-label={`Shape ${s}`}
                style={{
                  background: shape === s ? '#fff' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: shape === s ? '#1c2b3a' : '#64748b',
                  boxShadow: shape === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {s === 'rectangle' && <Square size={16} />}
                {s === 'circle' && <Circle size={16} />}
                {s === 'heart' && <Heart size={16} />}
                {s === 'star' && <Star size={16} />}
              </button>
            ))}
          </div>
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
