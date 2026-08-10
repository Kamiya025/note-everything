"use client"

import React, { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      // Update UI notify the user they can install the PWA
      setIsVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    // Show the install prompt
    deferredPrompt.prompt()
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-fade-in bg-[#fef9e7] p-4 rounded-lg shadow-xl border border-[rgba(0,0,0,0.1)] flex flex-col gap-3 max-w-[320px]" style={{fontFamily: "'Segoe UI', 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive"}}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-[#1c2b3a] text-[1.05rem]">Cài đặt ứng dụng</h3>
          <p className="text-[0.85rem] text-[#78909c] mt-1 italic">
            Thêm ứng dụng vào màn hình chính để ghi chú nhanh hơn.
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-[#78909c] hover:text-red-500 transition-colors p-1"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="w-full bg-[#1e293b] hover:bg-[#334155] text-white font-semibold text-[0.95rem] py-2 px-4 flex items-center justify-center gap-2 transition-colors shadow-md"
      >
        <Download size={18} />
        <span>Cài đặt PWA</span>
      </button>
    </div>
  )
}
