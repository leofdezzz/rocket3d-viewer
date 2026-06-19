import { SERVO_MAX_DEFLECT_DEG } from '../services/tvc'
import type { ConnectionStatus } from '../types/orientation'

interface TelemetryRailProps {
  frameRate: number
  status: ConnectionStatus
  servoAngles: [number, number]
}

export function TelemetryRail({ frameRate, status, servoAngles }: TelemetryRailProps) {
  const tvcLoad = Math.hypot(servoAngles[0], servoAngles[1]) / SERVO_MAX_DEFLECT_DEG
  const hzNorm = Math.min(1, frameRate / 60)
  const intensity = Math.min(1, hzNorm * 0.5 + tvcLoad * 0.5)
  const isLive = status === 'live' && frameRate > 0

  return (
    <div
      className={`telemetry-rail ${isLive ? 'telemetry-rail--live' : ''}`}
      style={{
        ['--rail-intensity' as string]: intensity,
        ['--rail-hue' as string]: tvcLoad > 0.3 ? '24' : '210',
      }}
      aria-hidden
    />
  )
}
