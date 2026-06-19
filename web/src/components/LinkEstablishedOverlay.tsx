import { useEffect, useState } from 'react'

import type { ConnectionMode } from '../types/orientation'

interface LinkEstablishedOverlayProps {
  flashId: number
  mode: ConnectionMode
}

const MODE_LABEL: Record<ConnectionMode, string> = {
  websocket: 'WiFi · WebSocket',
  serial: 'Serial USB',
  simulator: 'Simulador',
}

export function LinkEstablishedOverlay({ flashId, mode }: LinkEstablishedOverlayProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (flashId === 0) {
      return
    }

    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 2600)
    return () => window.clearTimeout(timer)
  }, [flashId])

  if (!visible) {
    return null
  }

  return (
    <div className="link-flash" aria-live="polite">
      <div className="link-flash__scan" />
      <div className="link-flash__content">
        <span className="link-flash__dot" />
        <strong>LINK OK</strong>
        <span className="link-flash__sub">{MODE_LABEL[mode]}</span>
      </div>
    </div>
  )
}
