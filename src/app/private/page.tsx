"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { Settings, Wifi } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { NoteWall } from "../../components/NoteWall"
import { MainLayout } from "../../layout/MainLayout"
import { PinLock } from "../../components/PinLock"
import { PrivateSettings } from "../../components/PrivateSettings"
import { ShareModal } from "../../components/ShareModal"
import {
  type PrivateWallConfig,
  loadConfig,
  buildBgStyle,
  isUnlocked,
} from "../../lib/privateConfig"
import { db } from "../../lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import axios from "axios"
import type { Note } from "../../types"

function PrivatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [config, setConfig] = useState<PrivateWallConfig | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinMsg, setJoinMsg] = useState("")
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const joinTokenRef = useRef<string>("")
  const knownIdsRef = useRef<Set<string>>(new Set())

  // Live query for current local notes (needed for ShareModal + join polling)
  const localNotes = useLiveQuery(() => db.notes.toArray()) ?? []

  // Load config on mount
  useEffect(() => {
    const cfg = loadConfig()
    setConfig(cfg)
    if (!cfg.pin || isUnlocked()) setUnlocked(true)
  }, [])

  // ── Device B: join sync session when ?share=token is present ─────
  useEffect(() => {
    const token = searchParams.get("share")
    if (!token || !unlocked) return

    joinTokenRef.current = token
    setJoining(true)
    setJoinMsg("Joining sync session…")

    const join = async () => {
      try {
        // 1. Fetch session notes from Device A
        const { data: session } = await axios.get(`/api/share?token=${token}`)
        const remoteNotes: Note[] = session.notes

        // 2. Determine which remote notes are new to us
        const myIds = new Set((await db.notes.toArray()).map((n) => n.id as string))
        const toImport = remoteNotes.filter((n) => n.id && !myIds.has(n.id as string))

        // 3. Import new notes into our IndexedDB
        if (toImport.length > 0) {
          await db.notes.bulkPut(toImport)
        }

        // 4. Upload OUR notes to the session (merge in the other direction)
        const myNotes = await db.notes.toArray()
        await axios.patch("/api/share", { token, notes: myNotes })

        setJoinMsg(
          toImport.length > 0
            ? `✓ Imported ${toImport.length} note${toImport.length !== 1 ? "s" : ""}. Syncing…`
            : "✓ Already up to date. Syncing…"
        )

        // 5. Initialize known IDs for ongoing polling
        knownIdsRef.current = new Set((await db.notes.toArray()).map((n) => n.id as string))

        // 6. Poll session every 5s for new notes from Device A
        pollRef.current = setInterval(async () => {
          try {
            const { data } = await axios.get(`/api/share?token=${token}`)
            const incoming: Note[] = (data.notes as Note[]).filter(
              (n) => n.id && !knownIdsRef.current.has(n.id as string)
            )
            if (incoming.length > 0) {
              await db.notes.bulkPut(incoming)
              incoming.forEach((n) => knownIdsRef.current.add(n.id as string))
              setJoinMsg(`↻ +${incoming.length} note${incoming.length !== 1 ? "s" : ""} received`)
            }
          } catch {
            // session expired
            clearInterval(pollRef.current!)
            setJoinMsg("Session expired.")
            setTimeout(() => setJoining(false), 3000)
          }
        }, 5000)

        // Clean URL so refresh doesn't re-join
        router.replace("/private", { scroll: false })
      } catch {
        setJoinMsg("Failed to join session. Session may have expired.")
        setTimeout(() => setJoining(false), 3000)
      }
    }

    join()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [unlocked, searchParams, router])

  // ── Merge incoming notes from Device B (ShareModal host side) ────
  const handleMerge = async (incoming: Note[]) => {
    await db.notes.bulkPut(incoming)
  }

  if (!config) return null

  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />
  }

  const bgStyle = buildBgStyle(config)

  return (
    <MainLayout>
      <style>{`
        body {
          background: ${bgStyle} !important;
          background-color: #eab308 !important;
        }
      `}</style>

      <section style={{ position: "relative" }}>
        <NoteWall
          mode="private"
          noteFont={config.noteFont}
          defaultNoteColor={config.defaultNoteColor}
        />
      </section>

      {/* Join status banner */}
      {joining && (
        <div className="join-banner">
          <Wifi size={12} strokeWidth={2.5} className="join-icon" />
          <span>{joinMsg}</span>
          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current)
              setJoining(false)
            }}
            className="join-dismiss"
            aria-label="Dismiss"
          >×</button>
        </div>
      )}

      {/* Settings tab */}
      <button
        onClick={() => setShowSettings(true)}
        className="settings-tab"
        title={`${config.wallName} Settings`}
        aria-label="Open wall settings"
      >
        <span className="settings-tab-pin" aria-hidden="true" />
        <Settings size={13} strokeWidth={2.5} className="settings-tab-icon" />
        <span className="settings-tab-label">Settings</span>
      </button>


      <style>{`
        @keyframes tabIn {
          from { opacity: 0; transform: translateY(10px) rotate(1deg); }
          to   { opacity: 1; transform: translateY(0)    rotate(1deg); }
        }

        /* Shared tab style */
        .settings-tab {
          position: fixed;
          bottom: 52px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px 7px;
          font-family: 'Chalkboard SE', 'Marker Felt', 'Comic Sans MS', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          color: #1c2b3a;
          background-color: #fef9c3;
          background-image: repeating-linear-gradient(
            transparent, transparent 15px,
            rgba(0,0,0,0.06) 15px, rgba(0,0,0,0.06) 16px
          );
          border: none;
          box-shadow: 2px 4px 10px rgba(0,0,0,0.25), 1px 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .settings-tab {
          left: clamp(10px, 2vw, 20px);
          transform: rotate(1deg);
          transform-origin: bottom left;
          animation: tabIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        .settings-tab:hover {
          transform: rotate(0deg) translateY(-2px);
          box-shadow: 3px 8px 18px rgba(0,0,0,0.3), 1px 2px 5px rgba(0,0,0,0.12);
        }

        /* Thumbtacks */
        .settings-tab-pin {
          position: absolute; top: -7px; left: 50%;
          transform: translateX(-50%);
          display: block; width: 12px; height: 12px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #d0d0d0 0%, #999 45%, #555 100%);
          box-shadow: 0 2px 4px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.5);
        }

        .settings-tab-icon { color: #334155; flex-shrink: 0; }
        .settings-tab-label { white-space: nowrap; }

        /* Join banner */
        .join-banner {
          position: fixed;
          top: 90px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: #dbeafe;
          border: 1px solid #93c5fd;
          border-radius: 3px;
          font-family: 'Chalkboard SE','Marker Felt','Comic Sans MS',sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          color: #1e40af;
          box-shadow: 2px 4px 12px rgba(0,0,0,0.2);
          white-space: nowrap;
        }
        .join-icon { flex-shrink: 0; }
        .join-dismiss {
          background: none; border: none; cursor: pointer;
          font-size: 1rem; color: #64748b; padding: 0 0 0 4px;
          line-height: 1; transition: color 0.15s;
        }
        .join-dismiss:hover { color: #ef4444; }
      `}</style>

      {showSettings && (
        <PrivateSettings
          config={config}
          onSave={(newConfig) => { setConfig(newConfig); setShowSettings(false) }}
          onClose={() => setShowSettings(false)}
          onOpenShare={() => {
            setShowSettings(false)
            setShowShare(true)
          }}
        />
      )}

      {showShare && (
        <ShareModal
          notes={localNotes}
          onMerge={handleMerge}
          onClose={() => setShowShare(false)}
        />
      )}
    </MainLayout>
  )
}

export default function PrivatePage() {
  return (
    <Suspense fallback={null}>
      <PrivatePageContent />
    </Suspense>
  )
}
