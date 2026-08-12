"use client"

import { useEffect } from "react"

interface QRScannerProps {
  onScanSuccess: (token: string) => void
  onError: (msg: string) => void
}

export function QRScanner({ onScanSuccess, onError }: QRScannerProps) {
  useEffect(() => {
    let isMounted = true
    let html5QrCode: any = null

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode")
        if (!isMounted) return

        html5QrCode = new Html5Qrcode("qr-reader")
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text: string) => {
            if (html5QrCode?.isScanning) {
              html5QrCode.stop().catch(() => {})
            }
            const match = text.match(/share=([a-zA-Z0-9]+)/)
            if (match && match[1]) {
              onScanSuccess(match[1])
            } else {
              onError(
                "Invalid QR code! Doesn't seem to be a Note Everything session."
              )
            }
          },
          () => {}, // ignore scan errors (they happen every frame)
        )
      } catch (err) {
        console.error("Camera error", err)
        if (isMounted) {
          onError(
            "Could not start camera. Make sure you granted permissions and are using HTTPS or localhost."
          )
        }
      }
    }

    // Small delay to ensure #qr-reader is in the DOM
    setTimeout(startScanner, 100)

    return () => {
      isMounted = false
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch(() => {})
      }
    }
  }, [onScanSuccess, onError])

  return <div id="qr-reader" style={{ width: "100%", border: "none" }} />
}
