"use client"
import React, { useEffect, useState } from "react"

interface OdometerCounterProps {
  count: number
  label?: string
}

// A single digit "wheel" that animates when value changes
function OdometerDigit({ digit, delay }: { digit: string; delay: number }) {
  const [current, setCurrent] = useState(digit)
  const [prev, setPrev] = useState(digit)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (digit !== current) {
      setPrev(current)
      setAnimating(true)
      const t = setTimeout(() => {
        setCurrent(digit)
        setAnimating(false)
      }, 350)
      return () => clearTimeout(t)
    }
  }, [digit, current])

  return (
    <span
      className="odometer-digit"
      style={{ animationDelay: `${delay}ms` }}
      data-animating={animating}
    >
      <span
        className={`odometer-digit-inner ${animating ? "odometer-flip" : ""}`}
        data-prev={prev}
        data-current={digit}
      >
        {current}
      </span>
    </span>
  )
}

export function OdometerCounter({
  count,
  label = "visitors",
}: OdometerCounterProps) {
  const digits = String(count).padStart(6, "0").split("")

  return (
    <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2">
      <div className="text-[0.65rem] uppercase tracking-[0.08em] text-white/40 font-['Outfit']">{label}</div>
      <div className="flex items-center gap-0.5">
        {digits.map((d, i) => (
          <OdometerDigit key={i} digit={d} delay={i * 30} />
        ))}
      </div>
    </div>
  )
}
