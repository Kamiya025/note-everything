"use client"

import { NoteWall } from "../components/NoteWall"
import { MainLayout } from "../layout/MainLayout"

export default function Home() {
  return (
    <MainLayout>
      <section>
        <NoteWall mode="public" />
      </section>
    </MainLayout>
  )
}
