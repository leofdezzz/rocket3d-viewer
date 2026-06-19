import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, DoubleSide, type Group } from 'three'

import { createGroundClipPlane } from '../services/groundClip'
import { SERVO_MAX_DEFLECT_DEG } from '../services/tvc'
import { ExhaustPlume } from './ExhaustPlume'

const DEG_TO_RAD = Math.PI / 180

/** Radio de referencia de la placa de montaje (escala 1). */
const REF_BASE_RADIUS = 0.34

interface TvcGimbalProps {
  /** Desvio de servos en grados [servoX, servoY]. */
  servoAngles: [number, number]
  /** Punto de montaje en el espacio local del cohete (base / motores). */
  position: [number, number, number]
  /** Radio del cuerpo en la base; escala el gimbal al cohete. */
  baseRadius?: number
  /** Altura mundial del suelo para recortar la pluma. */
  groundY: number
}

/**
 * Gimbal TVC en marco MPU vertical: empuje nominal -Y, servo X -> eje X, servo Y -> eje Z.
 */
export function TvcGimbal({ servoAngles, position, baseRadius = REF_BASE_RADIUS, groundY }: TvcGimbalProps) {
  const outerRef = useRef<Group>(null)
  const innerRef = useRef<Group>(null)
  const anglesRef = useRef(servoAngles)
  anglesRef.current = servoAngles

  const scale = baseRadius / REF_BASE_RADIUS

  const thrust = useMemo(() => {
    const [sx, sy] = servoAngles
    const tvc = Math.hypot(sx, sy) / SERVO_MAX_DEFLECT_DEG
    return Math.min(1, 0.42 + tvc * 0.58)
  }, [servoAngles])

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
  })

  return (
    <group position={position} scale={scale}>
      {/* Placa de montaje: disco en XZ, normal +Y (hacia el cuerpo) */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.08, 24]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Cardan exterior: giro servo X (anillo en YZ) */}
      <group ref={outerRef}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.28, 0.028, 12, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Cardan interior: giro servo Z (anillo en XY) */}
        <group ref={innerRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.022, 12, 32]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Motor TVC: campana metalica + nucleo luminoso + pluma suave (sin doble cono) */}
          <group position={[0, -0.08, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.07, 20]} />
              <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.28} />
            </mesh>

            <mesh position={[0, -0.15, 0]}>
              <cylinderGeometry args={[0.065, 0.155, 0.22, 28]} />
              <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.35} />
            </mesh>

            <mesh position={[0, -0.27, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.155, 0.011, 10, 32]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.18} />
            </mesh>

            <mesh position={[0, -0.29, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
              <meshStandardMaterial
                color="#fffbeb"
                emissive="#ff6b00"
                emissiveIntensity={5}
                transparent
                opacity={0.92}
                clippingPlanes={clippingPlanes}
              />
            </mesh>

            <mesh position={[0, -0.34, 0]}>
              <coneGeometry args={[0.08, 0.16, 16, 1, true]} />
              <meshBasicMaterial
                color="#ff9933"
                transparent
                opacity={0.12}
                blending={AdditiveBlending}
                depthWrite={false}
                side={DoubleSide}
                clippingPlanes={clippingPlanes}
              />
            </mesh>

            <pointLight position={[0, -0.28, 0]} intensity={1.1} distance={2.2} color="#ff7a18" />
            <ExhaustPlume thrust={thrust} groundY={groundY} />
          </group>
        </group>
      </group>
    </group>
  )
}
