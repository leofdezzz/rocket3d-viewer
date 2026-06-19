import { MeshReflectorMaterial } from '@react-three/drei'

interface LaunchPadFloorProps {
  /** Altura Y del plano reflectante (calculada desde el layout del cohete). */
  groundY: number
  /** Modo presentacion: reflejo mas marcado, sin rejilla extra. */
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
        mixStrength={presentation ? 0.55 : 0.38}
        roughness={0.85}
        depthScale={1.15}
        minDepthThreshold={0.35}
        maxDepthThreshold={1.25}
        color="#070b14"
        metalness={0.35}
        mirror={presentation ? 0.42 : 0.28}
      />
    </mesh>
  )
}
