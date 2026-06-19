import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  DoubleSide,
  type Group,
  type PointLight,
} from 'three'

import { createGroundClipPlane } from '../services/groundClip'
import { SERVO_MAX_DEFLECT_DEG } from '../services/tvc'
import { ExhaustPlume } from './ExhaustPlume'
import { HeatShimmer } from './HeatShimmer'

const DEG_TO_RAD = Math.PI / 180
const REF_BASE_RADIUS = 0.34

/** Cardan exterior: radio mayor, grosor tubo. */
const RING_OUTER: [number, number] = [0.19, 0.018]
/** Cardan interior. */
const RING_INNER: [number, number] = [0.14, 0.014]

interface TvcGimbalProps {
  servoAngles: [number, number]
  position: [number, number, number]
  baseRadius?: number
  groundY: number
}

export function TvcGimbal({ servoAngles, position, baseRadius = REF_BASE_RADIUS, groundY }: TvcGimbalProps) {
  const outerRef = useRef<Group>(null)
  const innerRef = useRef<Group>(null)
  const exhaustLightRef = useRef<PointLight>(null)
  const anglesRef = useRef(servoAngles)

  useEffect(() => {
    anglesRef.current = servoAngles
  }, [servoAngles])

  const scale = baseRadius / REF_BASE_RADIUS

  const thrust = useMemo(() => {
    const [sx, sy] = servoAngles
    const tvc = Math.hypot(sx, sy) / SERVO_MAX_DEFLECT_DEG
    return Math.min(1, 0.42 + tvc * 0.58)
  }, [servoAngles])

  const thrustRef = useRef(thrust)

  useEffect(() => {
    thrustRef.current = thrust
  }, [thrust])

  const clipPlane = useMemo(() => createGroundClipPlane(groundY), [groundY])
  const clippingPlanes = useMemo(() => [clipPlane], [clipPlane])

  useFrame(() => {
    const [servoX, servoY] = anglesRef.current
    if (outerRef.current) {
      outerRef.current.rotation.set(servoX * DEG_TO_RAD, 0, 0)
    }
    if (innerRef.current) {
      innerRef.current.rotation.set(0, 0, servoY * DEG_TO_RAD)
    }
    if (exhaustLightRef.current) {
      const t = thrustRef.current
      exhaustLightRef.current.intensity = 0.8 + t * 2.2
      exhaustLightRef.current.distance = 1.8 + t * 1.4
    }
  })

  return (
    <group position={position} scale={scale}>
      {/* Placa de montaje: borde superior en y=0 (union con la base del fuselaje) */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 24]} />
        <meshPhysicalMaterial color="#475569" metalness={0.85} roughness={0.35} clearcoat={0.3} />
      </mesh>

      <group ref={outerRef}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[RING_OUTER[0], RING_OUTER[1], 12, 32]} />
          <meshPhysicalMaterial color="#94a3b8" metalness={0.9} roughness={0.25} clearcoat={0.4} />
        </mesh>

        <group ref={innerRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[RING_INNER[0], RING_INNER[1], 12, 32]} />
            <meshPhysicalMaterial color="#cbd5e1" metalness={0.9} roughness={0.22} clearcoat={0.45} />
          </mesh>

          <group position={[0, -0.08, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 0.06, 20]} />
              <meshPhysicalMaterial color="#64748b" metalness={0.95} roughness={0.2} clearcoat={0.5} />
            </mesh>

            <mesh position={[0, -0.12, 0]}>
              <cylinderGeometry args={[0.055, 0.13, 0.18, 28]} />
              <meshPhysicalMaterial color="#0f172a" metalness={0.92} roughness={0.28} clearcoat={0.35} />
            </mesh>

            <mesh position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.13, 0.009, 10, 32]} />
              <meshPhysicalMaterial color="#94a3b8" metalness={0.98} roughness={0.12} clearcoat={0.6} />
            </mesh>

            <mesh position={[0, -0.24, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.018, 16]} />
              <meshStandardMaterial
                color="#fffbeb"
                emissive="#ff5c1a"
                emissiveIntensity={3 + thrust * 4}
                transparent
                opacity={0.92}
                clippingPlanes={clippingPlanes}
              />
            </mesh>

            <mesh position={[0, -0.28, 0]}>
              <coneGeometry args={[0.065, 0.13, 16, 1, true]} />
              <meshBasicMaterial
                color="#ff9933"
                transparent
                opacity={0.15 + thrust * 0.1}
                blending={AdditiveBlending}
                depthWrite={false}
                side={DoubleSide}
                clippingPlanes={clippingPlanes}
              />
            </mesh>

            <pointLight
              ref={exhaustLightRef}
              position={[0, -0.23, 0]}
              intensity={1.1}
              distance={2.2}
              color="#ff5c1a"
            />
            <ExhaustPlume thrust={thrust} groundY={groundY} />
            <HeatShimmer thrust={thrust} />
          </group>
        </group>
      </group>
    </group>
  )
}
