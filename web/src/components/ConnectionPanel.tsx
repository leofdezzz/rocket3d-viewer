import type { ConnectionMode, ConnectionStatus } from '../types/orientation'

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
  onWsUrlChange: (url: string) => void
  onConnectWebSocket: () => void
  onConnectSerial: () => void
  onUseSimulator: () => void
  onDisconnect: () => void
  onCalibrate: () => void
  onToggleMirror: () => void
  onToggleDebug: () => void
}

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
  onWsUrlChange,
  onConnectWebSocket,
  onConnectSerial,
  onUseSimulator,
  onDisconnect,
  onCalibrate,
  onToggleMirror,
  onToggleDebug,
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
        </div>
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
