import React from "react"

export function Header() {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-[90%] max-w-3xl shrink-0 pointer-events-none">
      <div className="flex items-center justify-between px-5 sm:px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] rounded-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-yellow-300 to-yellow-500 shadow-inner font-black text-yellow-950 text-lg sm:text-xl border border-white/50">
            W
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] tracking-tight">
            WALL OF <span className="text-yellow-300">NOTES</span>
          </h1>
        </div>
      </div>
    </header>
  )
}
