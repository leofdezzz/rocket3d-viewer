import { useState } from 'react'

import { ConnectionPanel } from './components/ConnectionPanel'
import { RocketScene } from './components/RocketScene'
import { useOrientationStream } from './hooks/useOrientationStream'
import './App.css'

function App() {
  const [mirrorMode, setMirrorMode] = useState(true)
  const [showDebug, setShowDebug] = useState(true)
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

  return (
    <div className="app">
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
      />
      <main className="viewport">
        <RocketScene
          orientation={payload.orientation}
          servoAngles={payload.servoAngles}
          showDebug={showDebug}
          mirrorMode={mirrorMode}
        />
      </main>
    </div>
  )
}

export default App
