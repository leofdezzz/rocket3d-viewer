import { useCallback, useEffect, useRef, useState } from 'react'
import { Quaternion } from 'three'

import {
  applyOrientationPipeline,
  calibratedOrientation,
  createOffsetFromFrame,
  createSimulatorQuaternion,
  quaternionToTuple,
} from '../services/orientationMath'
import { TvcController, DEFAULT_PID_GAINS, gimbalDeflectionFromOrientation, SERVO_MAX_DEFLECT_DEG } from '../services/tvc'
import { WebSerialOrientationClient } from '../services/webSerialClient'
import { WebSocketOrientationClient } from '../services/websocketClient'
import type {
  ConnectionMode,
  ConnectionStatus,
  OrientationFrame,
  OrientationPayload,
  PidGains,
} from '../types/orientation'

const DEFAULT_WS_URL = 'ws://192.168.4.1:81/'

function clampServo(v: number): number {
  return Math.max(-SERVO_MAX_DEFLECT_DEG, Math.min(SERVO_MAX_DEFLECT_DEG, v))
}

export function useOrientationStream() {
  const [mode, setMode] = useState<ConnectionMode>('simulator')
  const [status, setStatus] = useState<ConnectionStatus>('live')
  const [error, setError] = useState<string | null>(null)
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS_URL)
  const [frameRate, setFrameRate] = useState(0)
  const [orientation, setOrientation] = useState<[number, number, number, number]>([1, 0, 0, 0])
  const [servoAngles, setServoAngles] = useState<[number, number]>([0, 0])
  const [pidGains, setPidGainsState] = useState<PidGains>(DEFAULT_PID_GAINS)
  const [diagnostic, setDiagnostic] = useState<string | null>(null)
  const [waitingForData, setWaitingForData] = useState(false)

  const wsClient = useRef(new WebSocketOrientationClient())
  const serialClient = useRef(new WebSerialOrientationClient())
  const offsetRef = useRef(new Quaternion())
  const displayRef = useRef(new Quaternion())
  const calibratedRef = useRef(new Quaternion())
  const lastFrameRef = useRef<OrientationFrame | null>(null)
  const frameTimesRef = useRef<number[]>([])
  const tvcRef = useRef(new TvcController(DEFAULT_PID_GAINS))
  const lastTickRef = useRef<number | null>(null)

  const handleFrame = useCallback((frame: OrientationFrame) => {
    lastFrameRef.current = frame
    applyOrientationPipeline(frame, offsetRef.current, displayRef.current)
    setOrientation(quaternionToTuple(displayRef.current))

    const now = performance.now()

    calibratedOrientation(frame, offsetRef.current, calibratedRef.current)
    const [servoX, servoY] = gimbalDeflectionFromOrientation(calibratedRef.current)
    setServoAngles([clampServo(servoX), clampServo(servoY)])
    lastTickRef.current = now

    frameTimesRef.current.push(now)
    frameTimesRef.current = frameTimesRef.current.filter((t) => now - t <= 1000)
    setFrameRate(frameTimesRef.current.length)
    setWaitingForData(false)
    setDiagnostic(null)
  }, [])

  const setPidGains = useCallback(
    (gains: PidGains) => {
      setPidGainsState(gains)
      tvcRef.current.setGains(gains)
      const payload = { cmd: 'pid', kp: gains.kp, ki: gains.ki, kd: gains.kd }
      if (mode === 'websocket') {
        wsClient.current.sendCommand(payload)
      } else if (mode === 'serial') {
        void serialClient.current.sendCommand(payload)
      }
    },
    [mode],
  )

  const disconnect = useCallback(async () => {
    wsClient.current.disconnect()
    await serialClient.current.disconnect()
    setStatus('disconnected')
    setError(null)
    setFrameRate(0)
    setWaitingForData(false)
  }, [])

  const connectWebSocket = useCallback(async () => {
    await disconnect()
    setMode('websocket')
    setStatus('connecting')
    setError(null)

    wsClient.current.connect(
      wsUrl,
      handleFrame,
      (connected, message) => {
        if (connected) {
          setStatus('live')
          setError(null)
        } else {
          setStatus(message ? 'error' : 'disconnected')
          setError(message ?? null)
        }
      },
    )
  }, [disconnect, handleFrame, wsUrl])

  const connectSerial = useCallback(async () => {
    await disconnect()
    setMode('serial')
    setStatus('connecting')
    setError(null)

    await serialClient.current.connect(
      handleFrame,
      (connected, message) => {
        if (connected) {
          setStatus('live')
          setError(null)
          setWaitingForData(true)
        } else {
          setStatus(message ? 'error' : 'disconnected')
          setError(message ?? null)
          setWaitingForData(false)
        }
      },
      (message) => {
        setDiagnostic(message)
        if (message.includes('mpu6050_init_failed') || message.includes('failed')) {
          setError(message)
          setWaitingForData(false)
        }
      },
    )
  }, [disconnect, handleFrame])

  const useSimulator = useCallback(async () => {
    await disconnect()
    setMode('simulator')
    setStatus('live')
    setError(null)
  }, [disconnect])

  const calibrateZero = useCallback(() => {
    tvcRef.current.reset()
    lastTickRef.current = null
    setServoAngles([0, 0])
    if (lastFrameRef.current) {
      offsetRef.current.copy(createOffsetFromFrame(lastFrameRef.current))
      applyOrientationPipeline(lastFrameRef.current, offsetRef.current, displayRef.current, {
        snap: true,
      })
      setOrientation(quaternionToTuple(displayRef.current))
    } else {
      offsetRef.current.identity()
      displayRef.current.identity()
      setOrientation([1, 0, 0, 0])
    }
  }, [])

  const sendZeroCommand = useCallback(async () => {
    calibrateZero()
    if (mode === 'websocket') {
      wsClient.current.sendCommand({ cmd: 'zero' })
    } else if (mode === 'serial') {
      await serialClient.current.sendCommand({ cmd: 'zero' })
    }
  }, [calibrateZero, mode])

  useEffect(() => {
    if (mode !== 'simulator' || status !== 'live') {
      return
    }

    let frameId = 0
    const tick = (time: number) => {
      const seconds = time / 1000
      const q = createSimulatorQuaternion(seconds)
      handleFrame({ t: Date.now(), q })
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [handleFrame, mode, status])

  useEffect(() => {
    if (mode !== 'serial' || status !== 'live' || !waitingForData) {
      return
    }

    const timer = window.setTimeout(() => {
      setError(
        'Puerto abierto pero sin datos del ESP32. Pulsa RESET en la placa, cierra otros monitores seriales y vuelve a conectar.',
      )
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [frameRate, mode, status, waitingForData])

  useEffect(() => {
    return () => {
      wsClient.current.disconnect()
      void serialClient.current.disconnect()
    }
  }, [])

  const payload: OrientationPayload = {
    orientation,
    servoAngles,
    pidGains,
    frameRate,
    status,
    mode,
    error,
  }

  return {
    payload,
    wsUrl,
    setWsUrl,
    connectWebSocket,
    connectSerial,
    useSimulator,
    disconnect,
    calibrateZero: sendZeroCommand,
    setPidGains,
    diagnostic,
    waitingForData,
  }
}
