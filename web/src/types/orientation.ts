export type ConnectionMode = 'websocket' | 'serial' | 'simulator'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'live' | 'error'

export interface OrientationFrame {
  t: number
  q: [number, number, number, number]
  /** Desvio de los servos TVC en grados [servoX, servoY] (si lo envia el firmware). */
  s?: [number, number]
}

export interface PidGains {
  kp: number
  ki: number
  kd: number
}

export interface OrientationPayload {
  orientation: [number, number, number, number]
  /** Desvio actual de los servos TVC en grados [servoX, servoY]. */
  servoAngles: [number, number]
  pidGains: PidGains
  frameRate: number
  status: ConnectionStatus
  mode: ConnectionMode
  error: string | null
}
