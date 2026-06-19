import { Canvas } from '@react-three/fiber'
import { Environment, GizmoHelper, GizmoViewport, Grid, OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { Quaternion } from 'three'

import type { RocketLayoutResult } from '../services/rocketLayout'
import { LaunchPadFloor } from './LaunchPadFloor'
import { RocketModel } from './RocketModel'

interface RocketSceneProps {
  orientation: [number, number, number, number]
  servoAngles: [number, number]
  showDebug: boolean
  mirrorMode: boolean
  presentationMode: boolean
}

export function RocketScene({
  orientation,
  servoAngles,
  showDebug,
  mirrorMode,
  presentationMode,
}: RocketSceneProps) {
  const quaternion = useMemo(() => {
    const q = new Quaternion(orientation[1], orientation[2], orientation[3], orientation[0])
    q.normalize()
    return q
  }, [orientation])

  const showSceneDebug = showDebug && !presentationMode
  const vignetteDarkness = presentationMode ? 0.65 : 0.5
  const [groundY, setGroundY] = useState(-1.65)

  const handleLayout = useCallback((layout: RocketLayoutResult) => {
    setGroundY(layout.groundY)
  }, [])

  const gridY = groundY + 0.015

  return (
    <Canvas
      shadows
      gl={{ localClippingEnabled: true }}
      camera={{ position: [4, 3, 5], fov: presentationMode ? 42 : 45, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0b1020']} />
      <fog attach="fog" args={['#0b1020', presentationMode ? 16 : 12, presentationMode ? 32 : 28]} />
      <ambientLight intensity={presentationMode ? 0.28 : 0.35} />
      <directionalLight castShadow intensity={presentationMode ? 1.35 : 1.2} position={[5, 8, 4]} />
      <pointLight intensity={0.6} position={[-4, 2, -3]} color="#6ea8ff" />

      <Suspense fallback={null}>
        <Stars radius={80} depth={40} count={1200} factor={3} saturation={0} fade speed={0.6} />
        <Environment preset="night" environmentIntensity={presentationMode ? 0.35 : 0.2} />
        <LaunchPadFloor groundY={groundY} presentation={presentationMode} />
        {!presentationMode && (
          <Grid
            infiniteGrid
            sectionColor="#334155"
            cellColor="#1e293b"
            fadeDistance={24}
            fadeStrength={1}
            cellSize={0.5}
            sectionSize={2}
            position={[0, gridY, 0]}
          />
        )}
        <RocketModel
          orientation={orientation}
          servoAngles={servoAngles}
          groundY={groundY}
          onLayout={handleLayout}
        />
        {showSceneDebug && (
          <group quaternion={quaternion}>
            <axesHelper args={[1.5]} />
          </group>
        )}
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.72}
          luminanceSmoothing={0.35}
          intensity={presentationMode ? 1.55 : 1.4}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.18} darkness={vignetteDarkness} />
      </EffectComposer>

      <OrbitControls
        enabled={!mirrorMode && !presentationMode}
        enablePan={!mirrorMode && !presentationMode}
        maxPolarAngle={Math.PI * 0.95}
        minDistance={3}
        maxDistance={14}
      />

      {showSceneDebug && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisHeadScale={0.85} labelColor="white" />
        </GizmoHelper>
      )}
    </Canvas>
  )
}
