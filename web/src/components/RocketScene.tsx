import { Canvas } from '@react-three/fiber'
import { GizmoHelper, GizmoViewport, Grid, OrbitControls, Stars } from '@react-three/drei'
import { Suspense, useMemo } from 'react'
import { Quaternion } from 'three'

import { RocketModel } from './RocketModel'

interface RocketSceneProps {
  orientation: [number, number, number, number]
  showDebug: boolean
  mirrorMode: boolean
}

export function RocketScene({ orientation, showDebug, mirrorMode }: RocketSceneProps) {
  const quaternion = useMemo(() => {
    const q = new Quaternion(orientation[1], orientation[2], orientation[3], orientation[0])
    q.normalize()
    return q
  }, [orientation])

  return (
    <Canvas
      shadows
      camera={{ position: [4, 3, 5], fov: 45, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0b1020']} />
      <fog attach="fog" args={['#0b1020', 12, 28]} />
      <ambientLight intensity={0.35} />
      <directionalLight castShadow intensity={1.2} position={[5, 8, 4]} />
      <pointLight intensity={0.6} position={[-4, 2, -3]} color="#6ea8ff" />

      <Suspense fallback={null}>
        <Stars radius={80} depth={40} count={1200} factor={3} saturation={0} fade speed={0.6} />
        <Grid
          infiniteGrid
          sectionColor="#334155"
          cellColor="#1e293b"
          fadeDistance={24}
          fadeStrength={1}
          cellSize={0.5}
          sectionSize={2}
        />
        <RocketModel orientation={orientation} />
        {showDebug && (
          <group quaternion={quaternion}>
            <axesHelper args={[1.5]} />
          </group>
        )}
      </Suspense>

      <OrbitControls
        enabled={!mirrorMode}
        enablePan={!mirrorMode}
        maxPolarAngle={Math.PI * 0.95}
        minDistance={3}
        maxDistance={14}
      />

      {showDebug && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisHeadScale={0.85} labelColor="white" />
        </GizmoHelper>
      )}
    </Canvas>
  )
}
