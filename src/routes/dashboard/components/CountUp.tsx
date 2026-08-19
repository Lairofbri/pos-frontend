import { useState, useEffect, useRef } from 'react'

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  decimals?: number
}

export function CountUp({ end, duration = 800, prefix = '', decimals = 2 }: CountUpProps) {
  const [val, setVal] = useState(0)
  const raf = useRef<number>(0)
  const startTime = useRef<number>(0)
  const startVal = useRef(0)

  useEffect(() => {
    startVal.current = val
    startTime.current = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(startVal.current + (end - startVal.current) * eased)

      if (progress < 1) {
        raf.current = requestAnimationFrame(animate)
      }
    }

    raf.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, duration])

  return (
    <span className="tabular-nums">
      {prefix}{val.toFixed(decimals)}
    </span>
  )
}
