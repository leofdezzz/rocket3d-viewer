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
  if (flashId === 0) {
    return null
  }

  return (
    <div className="link-flash" key={flashId} aria-live="polite">
      <div className="link-flash__scan" />
      <div className="link-flash__content">
        <span className="link-flash__dot" />
        <strong>LINK OK</strong>
        <span className="link-flash__sub">{MODE_LABEL[mode]}</span>
      </div>
    </div>
  )
}
