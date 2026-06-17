import { Euler, Quaternion } from 'three'

import type { OrientationFrame } from '../types/orientation'

export const SLERP_ALPHA = 0.15

// Remap MPU6050 frame (X right, Y forward, Z up when flat) to Three.js Y-up.
const IMU_TO_THREE = new Quaternion().setFromEuler(
  new Euler(-Math.PI / 2, 0, 0, 'XYZ'),
)

// Tras calibrar cero, nariz del cohete hacia +Y (arriba), no hacia abajo.
const UPRIGHT_CORRECTION = new Quaternion().setFromEuler(
  new Euler(Math.PI, 0, 0, 'XYZ'),
)

const _raw = new Quaternion()
const _calibrated = new Quaternion()
const _remapped = new Quaternion()

export function parseOrientationLine(line: string): OrientationFrame | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{')) {
    return null
  }

  try {
    const data = JSON.parse(trimmed) as {
      t?: number
      q?: number[]
      error?: string
      hint?: string
      status?: string
    }

    if (typeof data.error === 'string') {
      return null
    }

    if (!Array.isArray(data.q) || data.q.length !== 4) {
      return null
    }

    const [w, x, y, z] = data.q
    if ([w, x, y, z].some((value) => typeof value !== 'number' || Number.isNaN(value))) {
      return null
    }

    return {
      t: typeof data.t === 'number' ? data.t : Date.now(),
      q: [w, x, y, z],
    }
  } catch {
    return null
  }
}

export function parseSerialDiagnostic(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{')) {
    return null
  }

  try {
    const data = JSON.parse(trimmed) as {
      error?: string
      hint?: string
      status?: string
      i2c?: number[]
    }

    if (typeof data.error === 'string') {
      const hint = typeof data.hint === 'string' ? ` ${data.hint}` : ''
      const devices = Array.isArray(data.i2c) ? ` Dispositivos I2C: [${data.i2c.join(', ')}]` : ''
      return `${data.error}${hint}${devices}`
    }

    if (data.status === 'mpu6050_ok' || data.status === 'ready') {
      return null
    }

    if (typeof data.status === 'string') {
      return data.status
    }

    if (Array.isArray(data.i2c)) {
      return `Dispositivos I2C detectados: [${data.i2c.join(', ')}]`
    }

    return null
  } catch {
    return null
  }
}

export function createOffsetFromFrame(frame: OrientationFrame): Quaternion {
  _raw.set(frame.q[1], frame.q[2], frame.q[3], frame.q[0]).normalize()
  return _raw.clone().invert()
}

export function applyOrientationPipeline(
  frame: OrientationFrame,
  offset: Quaternion,
  target: Quaternion,
): Quaternion {
  _raw.set(frame.q[1], frame.q[2], frame.q[3], frame.q[0]).normalize()
  _calibrated.copy(offset).multiply(_raw)
  _remapped.copy(UPRIGHT_CORRECTION).multiply(IMU_TO_THREE).multiply(_calibrated)
  target.slerp(_remapped, SLERP_ALPHA)
  return target
}

export function quaternionToTuple(q: Quaternion): [number, number, number, number] {
  return [q.w, q.x, q.y, q.z]
}

export function createSimulatorQuaternion(timeSeconds: number): [number, number, number, number] {
  const pitch = Math.sin(timeSeconds * 0.7) * 0.35
  const roll = Math.sin(timeSeconds * 0.5) * 0.25
  const yaw = Math.sin(timeSeconds * 0.3) * 0.4
  const q = new Quaternion().setFromEuler(new Euler(pitch, yaw, roll, 'YXZ'))
  return [q.w, q.x, q.y, q.z]
}
