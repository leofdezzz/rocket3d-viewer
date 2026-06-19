import { Canvas } from '@react-three/fiber'
import { GizmoHelper, GizmoViewport, Grid, OrbitControls, Stars } from '@react-three/drei'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { ACESFilmicToneMapping, Quaternion } from 'three'

import type { RocketLayoutResult } from '../services/rocketLayout'
import { SERVO_MAX_DEFLECT_DEG } from '../services/tvc'
import { LaunchPadFloor } from './LaunchPadFloor'
import { PadMarkings } from './PadMarkings'
import { RocketModel } from './RocketModel'
import { SceneLighting } from './SceneLighting'
import { SkyDome } from './SkyDome'

interface RocketSceneProps {
  orientation: [number, number, number, number]
  servoAngles: [number, number]
  showDebug: boolean
  mirrorMode: boolean
  presentationMode: boolean
}

function PostEffects({
  presentation,
  tvcLoad,
}: {
  presentation: boolean
  tvcLoad: number
}) {
  const aberrationOffset = useMemo(() => {
    const x = 0.0008 + tvcLoad * 0.002
    return [x, x * 0.6] as [number, number]
  }, [tvcLoad])

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={presentation ? 0.55 : 0.6}
        luminanceSmoothing={0.35}
        intensity={presentation ? 1.65 : 1.45}
        mipmapBlur
      />
      <ChromaticAberration
        offset={aberrationOffset}
        radialModulation
        modulationOffset={0.12}
      />
      <Noise opacity={0.04} premultiply />
      <Vignette eskil={false} offset={0.18} darkness={presentation ? 0.65 : 0.48} />
    </EffectComposer>
  )
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

  const tvcLoad = useMemo(
    () => Math.min(1, Math.hypot(servoAngles[0], servoAngles[1]) / SERVO_MAX_DEFLECT_DEG),
    [servoAngles],
  )

  const showSceneDebug = showDebug && !presentationMode
  const [groundY, setGroundY] = useState(-1.65)

  const handleLayout = useCallback((layout: RocketLayoutResult) => {
    setGroundY(layout.groundY)
  }, [])

  const gridY = groundY + 0.015
  const fogNear = presentationMode ? 14 : 10
  const fogFar = presentationMode ? 38 : 30

  return (
    <Canvas
      shadows
      gl={{
        localClippingEnabled: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: presentationMode ? 1.15 : 1.08,
      }}
      camera={{
        position: [4, 3, 5],
        fov: presentationMode ? 42 : 45,
        near: 0.1,
        far: 100,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#04060d']} />
      <fog attach="fog" args={['#04060d', fogNear, fogFar]} />

      <SceneLighting presentation={presentationMode} />

      <Suspense fallback={null}>
        <SkyDome />
        <Stars radius={80} depth={50} count={800} factor={2.5} saturation={0} fade speed={0.4} />
        <LaunchPadFloor groundY={groundY} presentation={presentationMode} />
        <PadMarkings groundY={groundY} />
        {!presentationMode && (
          <Grid
            infiniteGrid
            sectionColor="#2a3344"
            cellColor="#121824"
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

      <PostEffects presentation={presentationMode} tvcLoad={tvcLoad} />

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
