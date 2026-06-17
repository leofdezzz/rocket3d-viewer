import { parseOrientationLine, parseSerialDiagnostic } from './orientationMath'
import type { OrientationFrame } from '../types/orientation'

export type FrameHandler = (frame: OrientationFrame) => void
export type DiagnosticHandler = (message: string) => void

export class WebSerialOrientationClient {
  private port: SerialPort | null = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private keepReading = false
  private buffer = ''
  private decoder = new TextDecoder()

  async connect(
    onFrame: FrameHandler,
    onStatus: (connected: boolean, error?: string) => void,
    onDiagnostic?: DiagnosticHandler,
  ) {
    if (!navigator.serial) {
      onStatus(false, 'Web Serial no disponible en este navegador')
      return
    }

    await this.disconnect()

    try {
      this.port = await navigator.serial.requestPort()
      await this.port.open({ baudRate: 115200 })
    } catch {
      onStatus(false, 'No se pudo abrir el puerto serial')
      return
    }

    onStatus(true)
    this.keepReading = true
    void this.readLoop(onFrame, onStatus, onDiagnostic)
  }

  async sendCommand(payload: Record<string, string>) {
    if (!this.port?.writable) {
      return
    }
    const writer = this.port.writable.getWriter()
    const data = `${JSON.stringify(payload)}\n`
    await writer.write(new TextEncoder().encode(data))
    writer.releaseLock()
  }

  async disconnect() {
    this.keepReading = false
    if (this.reader) {
      await this.reader.cancel().catch(() => undefined)
      this.reader.releaseLock()
      this.reader = null
    }
    if (this.port) {
      await this.port.close().catch(() => undefined)
      this.port = null
    }
    this.buffer = ''
  }

  private async readLoop(
    onFrame: FrameHandler,
    onStatus: (connected: boolean, error?: string) => void,
    onDiagnostic?: DiagnosticHandler,
  ) {
    if (!this.port?.readable) {
      onStatus(false, 'Puerto serial no legible')
      return
    }

    this.reader = this.port.readable.getReader()

    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read()
        if (done) {
          break
        }
        if (!value) {
          continue
        }

        this.buffer += this.decoder.decode(value, { stream: true })
        const lines = this.buffer.split('\n')
        this.buffer = lines.pop() ?? ''

        for (const line of lines) {
          const frame = parseOrientationLine(line)
          if (frame) {
            onFrame(frame)
            continue
          }

          const diagnostic = parseSerialDiagnostic(line)
          if (diagnostic && onDiagnostic) {
            onDiagnostic(diagnostic)
          }
        }
      }
    } catch {
      onStatus(false, 'Lectura serial interrumpida')
    } finally {
      onStatus(false)
    }
  }
}
