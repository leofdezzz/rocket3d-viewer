import type { ConnectionMode, ConnectionStatus, PidGains } from '../types/orientation'

interface ConnectionPanelProps {
  mode: ConnectionMode
  status: ConnectionStatus
  frameRate: number
  error: string | null
  diagnostic: string | null
  waitingForData: boolean
  wsUrl: string
  mirrorMode: boolean
  showDebug: boolean
  showHud: boolean
  presentationMode: boolean
  servoAngles: [number, number]
  pidGains: PidGains
  onPidGainsChange: (gains: PidGains) => void
  onWsUrlChange: (url: string) => void
  onConnectWebSocket: () => void
  onConnectSerial: () => void
  onUseSimulator: () => void
  onDisconnect: () => void
  onCalibrate: () => void
  onToggleMirror: () => void
  onToggleDebug: () => void
  onToggleHud: () => void
  onTogglePresentation: () => void
}

const PID_SLIDERS: { key: keyof PidGains; label: string; max: number; step: number }[] = [
  { key: 'kp', label: 'Kp', max: 3, step: 0.01 },
  { key: 'ki', label: 'Ki', max: 1, step: 0.005 },
  { key: 'kd', label: 'Kd', max: 0.5, step: 0.005 },
]

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  disconnected: 'Desconectado',
  connecting: 'Conectando...',
  live: 'En vivo',
  error: 'Error',
}

export function ConnectionPanel({
  mode,
  status,
  frameRate,
  error,
  diagnostic,
  waitingForData,
  wsUrl,
  mirrorMode,
  showDebug,
  showHud,
  presentationMode,
  servoAngles,
  pidGains,
  onPidGainsChange,
  onWsUrlChange,
  onConnectWebSocket,
  onConnectSerial,
  onUseSimulator,
  onDisconnect,
  onCalibrate,
  onToggleMirror,
  onToggleDebug,
  onToggleHud,
  onTogglePresentation,
}: ConnectionPanelProps) {
  return (
    <aside className="panel">
      <header className="panel-header">
        <h1>Rocket 3D Viewer</h1>
        <p>Orientacion en tiempo real desde ESP32 + MPU6050</p>
      </header>

      <section className="panel-section">
        <h2>Conexion</h2>
        <div className="button-row">
          <button type="button" onClick={onConnectWebSocket}>
            WebSocket
          </button>
          <button type="button" onClick={onConnectSerial}>
            Serial USB
          </button>
          <button type="button" onClick={onUseSimulator}>
            Simulador
          </button>
          <button type="button" className="secondary" onClick={onDisconnect}>
            Desconectar
          </button>
        </div>

        <label className="field">
          <span>URL WebSocket</span>
          <input
            type="text"
            value={wsUrl}
            onChange={(event) => onWsUrlChange(event.target.value)}
            placeholder="ws://192.168.4.1:81/"
          />
        </label>
      </section>

      <section className="panel-section stats">
        <div>
          <span className="label">Modo</span>
          <strong>{mode}</strong>
        </div>
        <div>
          <span className="label">Estado</span>
          <strong className={`status-${status}`}>{STATUS_LABEL[status]}</strong>
        </div>
        <div>
          <span className="label">Frecuencia</span>
          <strong>{frameRate} Hz</strong>
        </div>
      </section>

      {error && <p className="error">{error}</p>}
      {diagnostic && !error && <p className="note diagnostic">{diagnostic}</p>}
      {waitingForData && frameRate === 0 && (
        <p className="note">Esperando datos del ESP32...</p>
      )}

      <section className="panel-section">
        <h2>Controles</h2>
        <div className="button-row">
          <button type="button" onClick={onCalibrate}>
            Calibrar cero
          </button>
          <button type="button" className="secondary" onClick={onToggleMirror}>
            {mirrorMode ? 'Camara libre' : 'Modo espejo'}
          </button>
          <button type="button" className="secondary" onClick={onToggleDebug}>
            {showDebug ? 'Ocultar ejes' : 'Mostrar ejes'}
          </button>
          <button type="button" className="secondary" onClick={onToggleHud}>
            {showHud ? 'Ocultar HUD' : 'Mostrar HUD'}
          </button>
          <button type="button" className="secondary" onClick={onTogglePresentation}>
            {presentationMode ? 'Salir presentacion' : 'Modo presentacion'}
          </button>
        </div>
      </section>

      <section className="panel-section">
        <h2>TVC / PID</h2>
        <div className="stats">
          <div>
            <span className="label">Servo X</span>
            <strong>{servoAngles[0].toFixed(1)}&deg;</strong>
          </div>
          <div>
            <span className="label">Servo Y</span>
            <strong>{servoAngles[1].toFixed(1)}&deg;</strong>
          </div>
        </div>
        {PID_SLIDERS.map(({ key, label, max, step }) => (
          <label className="field" key={key}>
            <span>
              {label}: {pidGains[key].toFixed(3)}
            </span>
            <input
              type="range"
              min={0}
              max={max}
              step={step}
              value={pidGains[key]}
              onChange={(event) =>
                onPidGainsChange({ ...pidGains, [key]: Number(event.target.value) })
              }
            />
          </label>
        ))}
      </section>

      <section className="panel-section note">
        <p>
          Web Serial requiere Chrome o Edge en localhost/HTTPS. Cierra `pio device monitor`
          antes de conectar desde la web: un solo programa puede usar el puerto USB.
        </p>
      </section>
    </aside>
  )
}
