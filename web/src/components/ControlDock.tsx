import { useState } from 'react'

import type { ConnectionMode, ConnectionStatus, PidGains } from '../types/orientation'
import { ActionButton } from './ui/ActionButton'
import { CollapsibleSection } from './ui/CollapsibleSection'
import { GlassPanel } from './ui/GlassPanel'
import { SegmentedControl } from './ui/SegmentedControl'
import { TelemetrySlider } from './ui/TelemetrySlider'

interface ControlDockProps {
  open: boolean
  mode: ConnectionMode
  status: ConnectionStatus
  error: string | null
  diagnostic: string | null
  waitingForData: boolean
  frameRate: number
  wsUrl: string
  mirrorMode: boolean
  servoAngles: [number, number]
  pidGains: PidGains
  onWsUrlChange: (url: string) => void
  onConnectWebSocket: () => void
  onConnectSerial: () => void
  onUseSimulator: () => void
  onDisconnect: () => void
  onCalibrate: () => void
  onToggleMirror: () => void
  onPidGainsChange: (gains: PidGains) => void
}

const PID_SLIDERS: { key: keyof PidGains; label: string; max: number; step: number }[] = [
  { key: 'kp', label: 'Kp', max: 3, step: 0.01 },
  { key: 'ki', label: 'Ki', max: 1, step: 0.005 },
  { key: 'kd', label: 'Kd', max: 0.5, step: 0.005 },
]

const CONNECTION_OPTIONS: { value: ConnectionMode; label: string }[] = [
  { value: 'websocket', label: 'WiFi' },
  { value: 'serial', label: 'Serial' },
  { value: 'simulator', label: 'Sim' },
]

export function ControlDock({
  open,
  mode,
  status,
  error,
  diagnostic,
  waitingForData,
  frameRate,
  wsUrl,
  mirrorMode,
  servoAngles,
  pidGains,
  onWsUrlChange,
  onConnectWebSocket,
  onConnectSerial,
  onUseSimulator,
  onDisconnect,
  onCalibrate,
  onToggleMirror,
  onPidGainsChange,
}: ControlDockProps) {
  const [selectedMode, setSelectedMode] = useState<ConnectionMode>(mode)

  const handleConnect = () => {
    if (selectedMode === 'websocket') onConnectWebSocket()
    else if (selectedMode === 'serial') onConnectSerial()
    else onUseSimulator()
  }

  if (!open) {
    return null
  }

  return (
    <div className="control-dock">
      <GlassPanel className="control-dock__panel">
        <CollapsibleSection title="Conexión" defaultOpen>
          <SegmentedControl
            options={CONNECTION_OPTIONS}
            value={selectedMode}
            onChange={setSelectedMode}
          />
          {selectedMode === 'websocket' && (
            <label className="dock-field">
              <span>URL WebSocket</span>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => onWsUrlChange(e.target.value)}
                placeholder="ws://192.168.4.1:81/"
              />
            </label>
          )}
          <div className="dock-actions">
            <ActionButton onClick={handleConnect}>Conectar</ActionButton>
            <ActionButton variant="secondary" onClick={onDisconnect}>
              Desconectar
            </ActionButton>
          </div>
          {error && <p className="dock-error">{error}</p>}
          {diagnostic && !error && <p className="dock-note dock-note--info">{diagnostic}</p>}
          {waitingForData && frameRate === 0 && status !== 'disconnected' && (
            <p className="dock-note">Esperando datos del ESP32…</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Controles">
          <div className="dock-actions">
            <ActionButton onClick={onCalibrate}>Calibrar cero</ActionButton>
            <ActionButton variant="ghost" onClick={onToggleMirror}>
              {mirrorMode ? 'Cámara libre' : 'Modo espejo'}
            </ActionButton>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="TVC / PID" defaultOpen={false}>
          <div className="dock-stats">
            <div>
              <span className="dock-stats__label">Servo X</span>
              <strong className="dock-stats__value">{servoAngles[0].toFixed(1)}°</strong>
            </div>
            <div>
              <span className="dock-stats__label">Servo Y</span>
              <strong className="dock-stats__value">{servoAngles[1].toFixed(1)}°</strong>
            </div>
          </div>
          {PID_SLIDERS.map(({ key, label, max, step }) => (
            <TelemetrySlider
              key={key}
              label={label}
              value={pidGains[key]}
              max={max}
              step={step}
              onChange={(value) => onPidGainsChange({ ...pidGains, [key]: value })}
            />
          ))}
        </CollapsibleSection>

        <CollapsibleSection title="Notas" defaultOpen={false}>
          <p className="dock-note">
            Web Serial requiere Chrome o Edge en localhost/HTTPS. Cierra{' '}
            <code>pio device monitor</code> antes de conectar: un solo programa puede usar el
            puerto USB.
          </p>
        </CollapsibleSection>
      </GlassPanel>
    </div>
  )
}
