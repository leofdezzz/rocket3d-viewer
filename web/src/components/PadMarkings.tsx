interface PadMarkingsProps {
  groundY: number
}

export function PadMarkings({ groundY }: PadMarkingsProps) {
  const y = groundY + 0.02

  return (
    <group position={[0, y, 0]}>
      {/* Anillo de retención */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.0, 64]} />
        <meshStandardMaterial color="#2a3344" metalness={0.6} roughness={0.5} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.05, 2.08, 64]} />
        <meshStandardMaterial color="#3d4a5c" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Marcas radiales */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, (i * Math.PI) / 4, 0]} position={[0, 0.005, 0]}>
          <planeGeometry args={[0.04, 2.2]} />
          <meshBasicMaterial color="#2a3344" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Cruz de referencia */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <planeGeometry args={[0.06, 3.5]} />
        <meshBasicMaterial color="#3d4a5c" transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, Math.PI / 2, 0]} position={[0, 0.008, 0]}>
        <planeGeometry args={[0.06, 3.5]} />
        <meshBasicMaterial color="#3d4a5c" transparent opacity={0.35} />
      </mesh>

      {/* Reflectores del pad */}
      <pointLight intensity={0.4} distance={8} color="#ffd4a8" position={[3.5, 0.3, 3.5]} />
      <pointLight intensity={0.4} distance={8} color="#ffd4a8" position={[-3.5, 0.3, -3.5]} />
    </group>
  )
}
