import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'

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
}

/**
 * Gimbal TVC en marco MPU vertical: empuje nominal -Y, servo X -> eje X, servo Y -> eje Z.
 */
export function TvcGimbal({ servoAngles, position, baseRadius = REF_BASE_RADIUS }: TvcGimbalProps) {
  const outerRef = useRef<Group>(null)
  const innerRef = useRef<Group>(null)
  const anglesRef = useRef(servoAngles)
  anglesRef.current = servoAngles

  const scale = baseRadius / REF_BASE_RADIUS

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

          {/* Tobera: eje alineado con Y, boca hacia -Y */}
          <mesh position={[0, -0.22, 0]}>
            <coneGeometry args={[0.18, 0.38, 24, 1, true]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.5} side={2} />
          </mesh>

          {/* Llama */}
          <mesh position={[0, -0.52, 0]}>
            <coneGeometry args={[0.11, 0.42, 20]} />
            <meshStandardMaterial
              color="#ff7a18"
              emissive="#ff5500"
              emissiveIntensity={2.2}
              transparent
              opacity={0.85}
            />
          </mesh>
          <pointLight position={[0, -0.58, 0]} intensity={1.4} distance={3} color="#ff7a18" />
        </group>
      </group>
    </group>
  )
}
