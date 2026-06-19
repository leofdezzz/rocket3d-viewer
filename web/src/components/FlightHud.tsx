import { useMemo } from 'react'
import { Quaternion } from 'three'

import { rocketAxisTilt, SERVO_MAX_DEFLECT_DEG } from '../services/tvc'
import type { ConnectionStatus } from '../types/orientation'

interface FlightHudProps {
  orientation: [number, number, number, number]
  frameRate: number
  status: ConnectionStatus
  servoAngles: [number, number]
}

const PITCH_LADDER = [-40, -30, -20, -10, 10, 20, 30, 40]
const ROLL_MARKS = [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]
const HORIZON_RADIUS = 58

export function FlightHud({ orientation, frameRate, status, servoAngles }: FlightHudProps) {
  const [pitch, roll] = useMemo(() => {
    const q = new Quaternion(orientation[1], orientation[2], orientation[3], orientation[0]).normalize()
    return rocketAxisTilt(q)
  }, [orientation])

  const tvcLoad = Math.hypot(servoAngles[0], servoAngles[1])
  const tvcPct = Math.min(100, (tvcLoad / SERVO_MAX_DEFLECT_DEG) * 100)
  const isLive = status === 'live' && frameRate > 0
  const pitchPx = pitch * 2.1
  const statusLabel =
    isLive ? 'LINK OK' : status === 'connecting' ? 'SYNC' : status === 'error' ? 'FAULT' : 'STBY'

  return (
    <div className="flight-hud" aria-hidden>
      <div className="flight-hud__frame">
        <span className="flight-hud__corner flight-hud__corner--tl" />
        <span className="flight-hud__corner flight-hud__corner--tr" />
        <span className="flight-hud__corner flight-hud__corner--bl" />
        <span className="flight-hud__corner flight-hud__corner--br" />

        <header className="flight-hud__header">
          <div className="flight-hud__title">
            <span className="flight-hud__label">ATTITUDE</span>
            <span className="flight-hud__subtitle">ROCKET · IMU</span>
          </div>
          <div className={`flight-hud__status ${isLive ? 'flight-hud__status--live' : ''}`}>
            <span className="flight-hud__status-dot" />
            {statusLabel}
          </div>
        </header>

        <div className="flight-hud__body">
          <div className="flight-hud__horizon-shell">
            <div className="flight-hud__roll-pointer" style={{ transform: `rotate(${roll}deg)` }} />

            <div className="flight-hud__roll-scale">
              {ROLL_MARKS.map((deg) => (
                <span
                  key={deg}
                  className={`flight-hud__roll-tick ${deg === 0 ? 'flight-hud__roll-tick--center' : ''}`}
                  style={{ transform: `rotate(${deg}deg) translateY(-${HORIZON_RADIUS}px)` }}
                >
                  {Math.abs(deg) >= 30 ? Math.abs(deg) : ''}
                </span>
              ))}
            </div>

            <div className="flight-hud__horizon-mask">
              <div className="flight-hud__scanlines" />
              <div
                className="flight-hud__horizon-disk"
                style={{ transform: `rotate(${-roll}deg) translateY(${pitchPx}px)` }}
              >
                <div className="flight-hud__sky">
                  <div className="flight-hud__sky-glow" />
                </div>
                <div className="flight-hud__ground">
                  <div className="flight-hud__ground-grid" />
                </div>
                <div className="flight-hud__horizon-line" />
                {PITCH_LADDER.map((deg) => (
                  <div
                    key={deg}
                    className={`flight-hud__pitch-line ${deg === 0 ? 'flight-hud__pitch-line--zero' : ''}`}
                    style={{ top: `calc(50% - ${deg * 2.1}px)` }}
                  >
                    <span className="flight-hud__pitch-left">{deg > 0 ? `+${deg}` : deg}</span>
                    <span className="flight-hud__pitch-right">{deg > 0 ? `+${deg}` : deg}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flight-hud__aircraft">
              <span className="flight-hud__reticle-h" />
              <span className="flight-hud__reticle-v" />
              <span className="flight-hud__dot" />
            </div>
          </div>

          <div className="flight-hud__metrics">
            <div className="flight-hud__metric flight-hud__metric--pitch">
              <span>PIT</span>
              <strong>{pitch >= 0 ? '+' : ''}{pitch.toFixed(1)}°</strong>
              <div className="flight-hud__bar">
                <i style={{ transform: `translateY(${Math.max(-100, Math.min(100, pitch * 2))}%)` }} />
              </div>
            </div>
            <div className="flight-hud__metric flight-hud__metric--roll">
              <span>ROL</span>
              <strong>{roll >= 0 ? '+' : ''}{roll.toFixed(1)}°</strong>
              <div className="flight-hud__bar flight-hud__bar--horizontal">
                <i style={{ transform: `translateX(${Math.max(-100, Math.min(100, roll * 2))}%)` }} />
              </div>
            </div>
            <div className="flight-hud__metric">
              <span>TVC</span>
              <strong>{tvcPct.toFixed(0)}%</strong>
            </div>
            <div className="flight-hud__metric">
              <span>Hz</span>
              <strong>{frameRate}</strong>
            </div>
          </div>
        </div>

        <footer className="flight-hud__footer">
          <span>TVC LOAD</span>
          <div className="flight-hud__tvc-track">
            <div className="flight-hud__tvc-fill" style={{ width: `${tvcPct}%` }} />
          </div>
          <span className="flight-hud__tvc-value">{tvcLoad.toFixed(1)}°</span>
        </footer>
      </div>
    </div>
  )
}
