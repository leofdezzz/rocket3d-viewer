import { useMemo } from 'react'
import { Quaternion } from 'three'

interface RocketPlaceholderProps {
  orientation: [number, number, number, number]
}

export function RocketPlaceholder({ orientation }: RocketPlaceholderProps) {
  const quaternion = useMemo(() => {
    const q = new Quaternion(orientation[1], orientation[2], orientation[3], orientation[0])
    q.normalize()
    return q
  }, [orientation])

  return (
    <group quaternion={quaternion}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 2.4, 24]} />
        <meshStandardMaterial color="#d9dee8" metalness={0.35} roughness={0.45} />
      </mesh>

      <mesh position={[0, 2.55, 0]}>
        <coneGeometry args={[0.35, 0.9, 24]} />
        <meshStandardMaterial color="#ff5a36" metalness={0.2} roughness={0.5} />
      </mesh>

      {[0, 120, 240].map((angle) => (
        <mesh
          key={angle}
          position={[0, 0.35, 0]}
          rotation={[0, (angle * Math.PI) / 180, 0]}
          castShadow
        >
          <boxGeometry args={[0.08, 0.7, 0.45]} />
          <meshStandardMaterial color="#4a5568" metalness={0.25} roughness={0.6} />
        </mesh>
      ))}

      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.5, 0.65, 0.35, 24]} />
        <meshStandardMaterial color="#718096" metalness={0.4} roughness={0.55} />
      </mesh>
    </group>
  )
}
