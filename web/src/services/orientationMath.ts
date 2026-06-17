import { Euler, Quaternion, Vector3 } from 'three'

import type { OrientationFrame } from '../types/orientation'

export const SLERP_ALPHA = 1

// MPU montado en vertical dentro del cohete: +Y = eje largo (nariz), +X y +Z = inclinacion.
// Three.js Y-up coincide con MPU +Y; no hace falta remapeo extra.
const IMU_TO_THREE = new Quaternion()

const _raw = new Quaternion()
const _calibrated = new Quaternion()
const _swing = new Quaternion()
const _twist = new Quaternion()
const _remapped = new Quaternion()

const _eulerYXZ = new Euler(0, 0, 0, 'YXZ')

/** Invierte el sentido de rotacion alrededor de +Z (roll). */
function invertRollAroundZ(q: Quaternion, out: Quaternion): Quaternion {
  _eulerYXZ.setFromQuaternion(q, 'YXZ')
  _eulerYXZ.z = -_eulerYXZ.z
  out.setFromEuler(_eulerYXZ)
  return out
}

/** Quita el giro sobre el eje largo (+Y): solo muestra inclinacion (X/Z), no roll sobre nariz. */
function removeTwistAroundBodyY(q: Quaternion, out: Quaternion): Quaternion {
  const twistNorm = Math.hypot(q.y, q.w)
  if (twistNorm < 1e-6) {
    out.copy(q)
    return out
  }
  _twist.set(0, q.y / twistNorm, 0, q.w / twistNorm)
  out.copy(q).multiply(_twist.invert())
  return out
}

export function parseOrientationLine(line: string): OrientationFrame | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{')) {
    return null
  }

  try {
    const data = JSON.parse(trimmed) as {
      t?: number
      q?: number[]
      s?: number[]
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

    const frame: OrientationFrame = {
      t: typeof data.t === 'number' ? data.t : Date.now(),
      q: [w, x, y, z],
    }
    if (Array.isArray(data.s) && data.s.length === 2) {
      frame.s = [data.s[0], data.s[1]]
    }
    return frame
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

/**
 * Offset de calibracion: inversa de la lectura cruda en el momento de calibrar.
 * Asi `offset * raw` da la orientacion relativa a la pose calibrada (identidad al calibrar).
 */
export function createOffsetFromFrame(frame: OrientationFrame): Quaternion {
  _raw.set(frame.q[1], frame.q[2], frame.q[3], frame.q[0]).normalize()
  return _raw.clone().invert()
}

/**
 * Orientacion calibrada en el marco MPU (+Y = eje largo), relativa a la pose de calibrado.
 * Usada por gimbal/TVC: servos en ejes X y Z del cuerpo.
 */
export function calibratedOrientation(
  frame: OrientationFrame,
  offset: Quaternion,
  out: Quaternion,
): Quaternion {
  out.set(frame.q[1], frame.q[2], frame.q[3], frame.q[0]).normalize()
  out.premultiply(offset)
  return out
}

/**
 * Orientacion final para Three.js: sin giro sobre eje largo, luego remap MPU->Three.
 * display = IMU_TO_THREE * swing(offset * raw)
 */
export function applyOrientationPipeline(
  frame: OrientationFrame,
  offset: Quaternion,
  target: Quaternion,
  options?: { snap?: boolean },
): Quaternion {
  calibratedOrientation(frame, offset, _calibrated)
  invertRollAroundZ(_calibrated, _calibrated)
  removeTwistAroundBodyY(_calibrated, _swing)
  _remapped.copy(IMU_TO_THREE).multiply(_swing)
  if (target.dot(_remapped) < 0) {
    _remapped.set(-_remapped.x, -_remapped.y, -_remapped.z, -_remapped.w)
  }
  if (options?.snap) {
    target.copy(_remapped)
  } else {
    target.slerp(_remapped, SLERP_ALPHA)
  }
  return target
}

export function quaternionToTuple(q: Quaternion): [number, number, number, number] {
  return [q.w, q.x, q.y, q.z]
}

const _axisX = new Vector3(1, 0, 0)
const _axisZ = new Vector3(0, 0, 1)
const _qx = new Quaternion()
const _qz = new Quaternion()

/**
 * Simula inclinacion en marco MPU: pitch=X, roll=Z (giro sobre +Y ignorado en display).
 */
export function createSimulatorQuaternion(timeSeconds: number): [number, number, number, number] {
  const pitch = Math.sin(timeSeconds * 0.7) * 0.35
  const roll = -Math.sin(timeSeconds * 0.5) * 0.25
  _qx.setFromAxisAngle(_axisX, pitch)
  _qz.setFromAxisAngle(_axisZ, roll)
  const q = _qz.multiply(_qx)
  return [q.w, q.x, q.y, q.z]
}
