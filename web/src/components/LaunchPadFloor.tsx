import { MeshReflectorMaterial } from '@react-three/drei'

interface LaunchPadFloorProps {
  groundY: number
  presentation?: boolean
}

export function LaunchPadFloor({ groundY, presentation = false }: LaunchPadFloorProps) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, groundY, 0]}
      receiveShadow
      renderOrder={-2}
    >
      <planeGeometry args={[48, 48]} />
      <MeshReflectorMaterial
        blur={[presentation ? 400 : 280, presentation ? 120 : 80]}
        resolution={512}
        mixBlur={presentation ? 1.2 : 0.9}
        mixStrength={presentation ? 0.65 : 0.45}
        roughness={0.82}
        depthScale={1.15}
        minDepthThreshold={0.35}
        maxDepthThreshold={1.25}
        color="#070b14"
        metalness={0.4}
        mirror={presentation ? 0.52 : 0.35}
      />
    </mesh>
  )
}
