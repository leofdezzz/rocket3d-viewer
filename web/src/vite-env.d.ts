/// <reference types="vite/client" />

interface SerialPort {
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
}

interface SerialOptions {
  baudRate: number
}

interface Serial {
  requestPort(): Promise<SerialPort>
}

interface Navigator {
  serial?: Serial
}
