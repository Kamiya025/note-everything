"use client"

import { PenLine } from "lucide-react"
import { useState } from "react"
import { NoteForm } from "../components/NoteForm"

export function Main({ children }: { children: React.ReactNode }) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTearing, setIsTearing] = useState(false)

  const handleAddNoteClick = () => {
    if (isTearing || isFormOpen) return
    setIsTearing(true)
    // Wait for the tear animation to complete before opening the form
    setTimeout(() => {
      setIsTearing(false)
      setIsFormOpen(true)
    }, 600) // 600ms matches the CSS animation duration
  }

  return (
    <>
      <main>
        {isFormOpen && (
          <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <NoteForm onClose={() => setIsFormOpen(false)} />
            </div>
          </div>
        )}

        {children}
      </main>

      <button
        className="sticky-stack-fab"
        onClick={handleAddNoteClick}
        aria-label="Write a note"
        title="Tear off a note to write"
      >
        <div className={`top-note ${isTearing ? 'tearing' : ''}`}>
          <PenLine size={24} color="#334155" />
        </div>
      </button>
    </>
  )
}
