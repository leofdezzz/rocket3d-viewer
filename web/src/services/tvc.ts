import { Quaternion, Vector3 } from 'three'

import type { PidGains } from '../types/orientation'

export const DEFAULT_PID_GAINS: PidGains = { kp: 0.8, ki: 0.15, kd: 0.05 }

/** Desvio maximo del servo desde el centro, en grados (coincide con el firmware). */
export const SERVO_MAX_DEFLECT_DEG = 35

const RAD_TO_DEG = 180 / Math.PI

const _rocketAxisWorld = new Vector3()

/**
 * Inclinacion del eje +Y del cohete (MPU vertical) respecto a la vertical del mundo (MPU +Y).
 * Ignora el giro sobre el propio eje largo (+Y).
 */
export function rocketAxisTilt(bodyQ: Quaternion): [number, number] {
  _rocketAxisWorld.set(0, 1, 0).applyQuaternion(bodyQ)
  const tiltX = Math.atan2(_rocketAxisWorld.z, _rocketAxisWorld.y) * RAD_TO_DEG
  const tiltY = -Math.atan2(_rocketAxisWorld.x, _rocketAxisWorld.y) * RAD_TO_DEG
  return [tiltX, tiltY]
}

/** Desvio de gimbal: opuesto al tilt en ambos ejes (cardan X / Z). */
export function gimbalDeflectionFromOrientation(bodyQ: Quaternion): [number, number] {
  const [tiltX, tiltY] = rocketAxisTilt(bodyQ)
  return [tiltX, -tiltY]
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/** PID simple con anti-windup, identico en comportamiento al del firmware. */
export class Pid {
  private integral = 0
  private prevError = 0
  private hasPrev = false
  private gains: PidGains
  private outMax: number

  constructor(gains: PidGains, outMax: number) {
    this.gains = gains
    this.outMax = outMax
  }

  setGains(gains: PidGains) {
    this.gains = gains
  }

  reset() {
    this.integral = 0
    this.prevError = 0
    this.hasPrev = false
  }

  compute(error: number, dt: number): number {
    const { kp, ki, kd } = this.gains
    if (dt <= 0) {
      return clamp(kp * error, -this.outMax, this.outMax)
    }

    this.integral += error * dt
    if (ki > 0) {
      const intLimit = this.outMax / ki
      this.integral = clamp(this.integral, -intLimit, intLimit)
    } else {
      this.integral = 0
    }

    let derivative = 0
    if (this.hasPrev) {
      derivative = (error - this.prevError) / dt
    }
    this.prevError = error
    this.hasPrev = true

    const out = kp * error + ki * this.integral + kd * derivative
    return clamp(out, -this.outMax, this.outMax)
  }
}

/** Dos PID (eje X / eje Y) que convierten inclinacion en desvio de servos. */
export class TvcController {
  private pidX: Pid
  private pidY: Pid

  constructor(gains: PidGains = DEFAULT_PID_GAINS) {
    this.pidX = new Pid(gains, SERVO_MAX_DEFLECT_DEG)
    this.pidY = new Pid(gains, SERVO_MAX_DEFLECT_DEG)
  }

  setGains(gains: PidGains) {
    this.pidX.setGains(gains)
    this.pidY.setGains(gains)
  }

  reset() {
    this.pidX.reset()
    this.pidY.reset()
  }

  /** Devuelve [servoX, servoY] en grados. */
  update(bodyQ: Quaternion, dt: number): [number, number] {
    const [tiltX, tiltY] = rocketAxisTilt(bodyQ)
    return [this.pidX.compute(tiltX, dt), this.pidY.compute(tiltY, dt)]
  }
}
