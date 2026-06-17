import type { OrientationFrame } from '../types/orientation'

export type FrameHandler = (frame: OrientationFrame) => void

export class WebSocketOrientationClient {
  private socket: WebSocket | null = null
  private onFrame: FrameHandler | null = null

  connect(url: string, onFrame: FrameHandler, onStatus: (connected: boolean, error?: string) => void) {
    this.disconnect()
    this.onFrame = onFrame

    try {
      this.socket = new WebSocket(url)
    } catch {
      onStatus(false, 'URL de WebSocket invalida')
      return
    }

    this.socket.onopen = () => onStatus(true)
    this.socket.onclose = () => onStatus(false)
    this.socket.onerror = () => onStatus(false, 'Error de conexion WebSocket')

    this.socket.onmessage = (event) => {
      if (typeof event.data !== 'string' || !this.onFrame) {
        return
      }
      const frame = parseFrame(event.data)
      if (frame) {
        this.onFrame(frame)
      }
    }
  }

  sendCommand(payload: Record<string, string>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload))
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.onopen = null
      this.socket.onclose = null
      this.socket.onerror = null
      this.socket.onmessage = null
      this.socket.close()
      this.socket = null
    }
  }
}

function parseFrame(raw: string): OrientationFrame | null {
  try {
    const data = JSON.parse(raw) as { t?: number; q?: number[] }
    if (!Array.isArray(data.q) || data.q.length !== 4) {
      return null
    }
    return {
      t: typeof data.t === 'number' ? data.t : Date.now(),
      q: data.q as [number, number, number, number],
    }
  } catch {
    return null
  }
}
