import { SERVO_MAX_DEFLECT_DEG } from '../services/tvc'
import type { ConnectionMode, ConnectionStatus } from '../types/orientation'
import { StatusPill } from './ui/StatusPill'

interface TelemetryBarProps {
  mode: ConnectionMode
  status: ConnectionStatus
  frameRate: number
  servoAngles: [number, number]
  showHud: boolean
  showDebug: boolean
  presentationMode: boolean
  onToggleHud: () => void
  onToggleDebug: () => void
  onTogglePresentation: () => void
  onToggleDock: () => void
  dockOpen: boolean
}

const MODE_LABEL: Record<ConnectionMode, string> = {
  websocket: 'WiFi',
  serial: 'Serial',
  simulator: 'Sim',
}

const STATUS_VARIANT: Record<
  ConnectionStatus,
  'live' | 'connecting' | 'error' | 'standby'
> = {
  live: 'live',
  connecting: 'connecting',
  error: 'error',
  disconnected: 'standby',
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  live: 'En vivo',
  connecting: 'Conectando',
  error: 'Error',
  disconnected: 'Standby',
}

export function TelemetryBar({
  mode,
  status,
  frameRate,
  servoAngles,
  showHud,
  showDebug,
  presentationMode,
  onToggleHud,
  onToggleDebug,
  onTogglePresentation,
  onToggleDock,
  dockOpen,
}: TelemetryBarProps) {
  const isLive = status === 'live' && frameRate > 0

  return (
    <header className="telemetry-bar">
      <div className="telemetry-bar__brand">
        <span className="telemetry-bar__logo">R</span>
        <div>
          <strong>Rocket 3D</strong>
          <span className="telemetry-bar__mode">{MODE_LABEL[mode]}</span>
        </div>
      </div>

      <div className="telemetry-bar__center">
        <StatusPill
          variant={isLive ? 'live' : STATUS_VARIANT[status]}
          label={isLive ? 'LIVE' : STATUS_LABEL[status]}
        />
        <span className="telemetry-bar__hz">
          <span className="telemetry-bar__hz-value">{frameRate}</span>
          <span className="telemetry-bar__hz-unit">Hz</span>
        </span>
      </div>

      <div className="telemetry-bar__actions">
        {!presentationMode && (
          <>
            <button
              type="button"
              className={`telemetry-bar__icon-btn ${showHud ? 'telemetry-bar__icon-btn--active' : ''}`}
              onClick={onToggleHud}
              title={showHud ? 'Ocultar HUD' : 'Mostrar HUD'}
            >
              HUD
            </button>
            <button
              type="button"
              className={`telemetry-bar__icon-btn ${showDebug ? 'telemetry-bar__icon-btn--active' : ''}`}
              onClick={onToggleDebug}
              title={showDebug ? 'Ocultar ejes' : 'Mostrar ejes'}
            >
              XYZ
            </button>
            <button
              type="button"
              className={`telemetry-bar__icon-btn ${dockOpen ? 'telemetry-bar__icon-btn--active' : ''}`}
              onClick={onToggleDock}
              title={dockOpen ? 'Ocultar controles' : 'Mostrar controles'}
              aria-expanded={dockOpen}
            >
              ≡
            </button>
          </>
        )}
        <button
          type="button"
          className={`telemetry-bar__icon-btn ${presentationMode ? 'telemetry-bar__icon-btn--active' : ''}`}
          onClick={onTogglePresentation}
          title={presentationMode ? 'Salir presentación' : 'Modo presentación'}
        >
          ⛶
        </button>
      </div>

      <span
        className="telemetry-bar__tvc-hint"
        aria-hidden
        style={{
          opacity: Math.min(1, Math.hypot(servoAngles[0], servoAngles[1]) / SERVO_MAX_DEFLECT_DEG),
        }}
      />
    </header>
  )
}
