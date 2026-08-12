"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type NotifyFn = (title: string, body: string) => void

interface UseNotificationsReturn {
  permission: NotificationPermission | "unsupported"
  requestPermission: () => Promise<void>
  notify: NotifyFn
  enabled: boolean
  setEnabled: (v: boolean) => void
}

const STORAGE_KEY = "notificationsEnabled"

export function useNotifications(): UseNotificationsReturn {
  const supported = typeof window !== "undefined" && "Notification" in window

  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    supported ? Notification.permission : "unsupported"
  )
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEY) === "true"
  })

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v)
    localStorage.setItem(STORAGE_KEY, String(v))
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supported) return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === "granted") setEnabled(true)
  }, [supported, setEnabled])

  const notify = useCallback<NotifyFn>(
    (title, body) => {
      if (!supported || permission !== "granted" || !enabled) return
      try {
        const n = new Notification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
          tag: "wall-of-notes-new",
        })
        n.onclick = () => {
          window.focus()
          n.close()
        }
      } catch {
        // Notifications may be blocked by policy — ignore
      }
    },
    [supported, permission, enabled]
  )

  return { permission, requestPermission, notify, enabled, setEnabled }
}
