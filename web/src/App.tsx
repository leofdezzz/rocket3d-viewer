import { useEffect, useRef, useState } from 'react'

import { ConnectionPanel } from './components/ConnectionPanel'
import { FlightHud } from './components/FlightHud'
import { LinkEstablishedOverlay } from './components/LinkEstablishedOverlay'
import { RocketScene } from './components/RocketScene'
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
  const [linkFlashId, setLinkFlashId] = useState(0)
  const prevStatusRef = useRef<ConnectionStatus>('live')

  const {
    payload,
    wsUrl,
    setWsUrl,
    connectWebSocket,
    connectSerial,
    useSimulator,
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
      {!presentationMode && (
        <ConnectionPanel
          mode={payload.mode}
          status={payload.status}
          frameRate={payload.frameRate}
          error={payload.error}
          diagnostic={diagnostic}
          waitingForData={waitingForData}
          wsUrl={wsUrl}
          mirrorMode={mirrorMode}
          showDebug={showDebug}
          showHud={showHud}
          presentationMode={presentationMode}
          servoAngles={payload.servoAngles}
          pidGains={payload.pidGains}
          onPidGainsChange={setPidGains}
          onWsUrlChange={setWsUrl}
          onConnectWebSocket={() => void connectWebSocket()}
          onConnectSerial={() => void connectSerial()}
          onUseSimulator={() => void useSimulator()}
          onDisconnect={() => void disconnect()}
          onCalibrate={() => void calibrateZero()}
          onToggleMirror={() => setMirrorMode((value) => !value)}
          onToggleDebug={() => setShowDebug((value) => !value)}
          onToggleHud={() => setShowHud((value) => !value)}
          onTogglePresentation={() => setPresentationMode((value) => !value)}
        />
      )}
      <main className="viewport">
        <RocketScene
          orientation={payload.orientation}
          servoAngles={payload.servoAngles}
          showDebug={showDebug}
          mirrorMode={mirrorMode}
          presentationMode={presentationMode}
        />
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
            Salir presentacion
          </button>
        )}
      </main>
    </div>
  )
}

export default App
