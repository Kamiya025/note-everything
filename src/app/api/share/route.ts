// ── Bidirectional LAN Sync Session Store ─────────────────────────
// A session holds the merged notes from all participants.
// POST  → create session (Device A uploads its notes)
// GET   → fetch current merged notes (for polling)
// PATCH → merge more notes into session (Device B joins)

import { NextRequest, NextResponse } from "next/server"
import os from "os"
import type { Note } from "../../../types"

interface SyncSession {
  notes: Map<string, Note>  // keyed by note.id for deduplication
  expiresAt: number
  createdAt: number
}

// Module-level store — persists across requests in same process
const sessions = new Map<string, SyncSession>()

function purgeExpired() {
  const now = Date.now()
  for (const [token, s] of sessions) {
    if (s.expiresAt < now) sessions.delete(token)
  }
}

function getLocalIP(): string {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address
    }
  }
  return "localhost"
}

function sessionToResponse(token: string, session: SyncSession) {
  return {
    token,
    notes: Array.from(session.notes.values()),
    count: session.notes.size,
    expiresAt: session.expiresAt,
  }
}

// ── POST /api/share — Device A creates a session ──────────────────
export async function POST(req: NextRequest) {
  purgeExpired()

  const { notes } = (await req.json()) as { notes: Note[] }
  if (!Array.isArray(notes)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16)
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

  const noteMap = new Map<string, Note>()
  for (const n of notes) {
    if (n.id) noteMap.set(n.id, n)
  }

  sessions.set(token, { notes: noteMap, expiresAt, createdAt: Date.now() })

  const ip = getLocalIP()
  const port = new URL(req.url).port || "3000"
  const url = `http://${ip}:${port}/private?share=${token}`

  return NextResponse.json({ token, url, expiresAt, ...sessionToResponse(token, sessions.get(token)!) })
}

// ── GET /api/share?token=xxx — poll for latest merged notes ────────
export async function GET(req: NextRequest) {
  purgeExpired()

  const token = req.nextUrl.searchParams.get("token") ?? ""
  const session = sessions.get(token)

  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token)
    return NextResponse.json({ error: "Session expired or not found" }, { status: 404 })
  }

  return NextResponse.json(sessionToResponse(token, session))
}

// ── PATCH /api/share — Device B joins: merges its notes in ────────
export async function PATCH(req: NextRequest) {
  purgeExpired()

  const { token, notes } = (await req.json()) as { token: string; notes: Note[] }
  const session = sessions.get(token)

  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token)
    return NextResponse.json({ error: "Session expired or not found" }, { status: 404 })
  }

  // Merge incoming notes — overwrite existing so edits are synced
  let added = 0
  for (const n of notes) {
    if (n.id) {
      if (!session.notes.has(n.id)) added++
      session.notes.set(n.id, n)
    }
  }

  return NextResponse.json({ ...sessionToResponse(token, session), added })
}
