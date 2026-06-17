export type ConnectionMode = 'websocket' | 'serial' | 'simulator'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'live' | 'error'

export interface OrientationFrame {
  t: number
  q: [number, number, number, number]
}

export interface OrientationPayload {
  orientation: [number, number, number, number]
  frameRate: number
  status: ConnectionStatus
  mode: ConnectionMode
  error: string | null
}
