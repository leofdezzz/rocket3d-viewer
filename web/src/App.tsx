import { useEffect, useRef, useState } from 'react'

import { ControlDock } from './components/ControlDock'
import { FlightHud } from './components/FlightHud'
import { LinkEstablishedOverlay } from './components/LinkEstablishedOverlay'
import { RocketScene } from './components/RocketScene'
import { TelemetryBar } from './components/TelemetryBar'
import { TelemetryRail } from './components/TelemetryRail'
import { useOrientationStream } from './hooks/useOrientationStream'
import type { ConnectionMode, ConnectionStatus } from './types/orientation'
import './App.css'

function shouldCelebrateLink(mode: ConnectionMode, status: ConnectionStatus): boolean {
  return status === 'live' && (mode === 'websocket' || mode === 'serial')
}

function App() {
  const [mirrorMode, setMirrorMode] = useState(true)
  const [showDebug, setShowDebug] = useState(true)
  const [showHud, setShowHud] = useState(true)
  const [presentationMode, setPresentationMode] = useState(false)
  const [dockOpen, setDockOpen] = useState(true)
  const [linkFlashId, setLinkFlashId] = useState(0)
  const prevStatusRef = useRef<ConnectionStatus>('live')

  const {
    payload,
    wsUrl,
    setWsUrl,
    connectWebSocket,
    connectSerial,
    useSimulator: startSimulator,
    disconnect,
    calibrateZero,
    setPidGains,
    diagnostic,
    waitingForData,
  } = useOrientationStream()

  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = payload.status

    if (prev === 'connecting' && shouldCelebrateLink(payload.mode, payload.status)) {
      setLinkFlashId((id) => id + 1)
    }
  }, [payload.mode, payload.status])

  const showHudOverlay = showHud && !presentationMode

  return (
    <div className={`app ${presentationMode ? 'app--presentation' : ''}`}>
      <main className="viewport">
        <RocketScene
          orientation={payload.orientation}
          servoAngles={payload.servoAngles}
          showDebug={showDebug}
          mirrorMode={mirrorMode}
          presentationMode={presentationMode}
        />

        <TelemetryRail
          frameRate={payload.frameRate}
          status={payload.status}
          servoAngles={payload.servoAngles}
        />

        {!presentationMode && (
          <>
            <TelemetryBar
              mode={payload.mode}
              status={payload.status}
              frameRate={payload.frameRate}
              servoAngles={payload.servoAngles}
              showHud={showHud}
              showDebug={showDebug}
              presentationMode={presentationMode}
              dockOpen={dockOpen}
              onToggleHud={() => setShowHud((v) => !v)}
              onToggleDebug={() => setShowDebug((v) => !v)}
              onTogglePresentation={() => setPresentationMode((v) => !v)}
              onToggleDock={() => setDockOpen((v) => !v)}
            />
            <ControlDock
              open={dockOpen}
              mode={payload.mode}
              status={payload.status}
              error={payload.error}
              diagnostic={diagnostic}
              waitingForData={waitingForData}
              frameRate={payload.frameRate}
              wsUrl={wsUrl}
              mirrorMode={mirrorMode}
              servoAngles={payload.servoAngles}
              pidGains={payload.pidGains}
              onWsUrlChange={setWsUrl}
              onConnectWebSocket={() => void connectWebSocket()}
              onConnectSerial={() => void connectSerial()}
              onUseSimulator={() => void startSimulator()}
              onDisconnect={() => void disconnect()}
              onCalibrate={() => void calibrateZero()}
              onToggleMirror={() => setMirrorMode((v) => !v)}
              onPidGainsChange={setPidGains}
            />
          </>
        )}

        {showHudOverlay && (
          <FlightHud
            orientation={payload.orientation}
            frameRate={payload.frameRate}
            status={payload.status}
            servoAngles={payload.servoAngles}
          />
        )}

        <LinkEstablishedOverlay flashId={linkFlashId} mode={payload.mode} />

        {presentationMode && (
          <button
            type="button"
            className="presentation-exit"
            onClick={() => setPresentationMode(false)}
          >
            Salir presentación
          </button>
        )}
      </main>
    </div>
  )
}

export default App
