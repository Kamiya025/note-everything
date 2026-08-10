"use client"

import { isSupabaseConfigured } from "../lib/supabase"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { Main } from "./Main"

export function MainLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="setup-card glass-panel">
          <h2>⚠️ Setup Required</h2>
          <p>
            It looks like Supabase is not configured yet. To get your Wall of
            Notes working, please replace the placeholder values in
            <code>src/lib/supabase.ts</code> or add them to your{" "}
            <code>.env.local</code> file.
          </p>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Note: The app needs a real Supabase database to store and display
            the notes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Header />
      <Main>
        {children}
      </Main>
      <Footer />
    </div>
  )
}
