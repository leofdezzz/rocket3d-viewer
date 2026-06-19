import { useGLTF } from '@react-three/drei'
import { useLayoutEffect, useMemo, useState } from 'react'
import { Mesh, Quaternion } from 'three'

import { layoutRocketModel, type RocketLayoutResult } from '../services/rocketLayout'
import { TvcGimbal } from './TvcGimbal'

export const ROCKET_MODEL_URL = '/models/spacex_starship_spacecraft.glb'

interface RocketModelProps {
  orientation: [number, number, number, number]
  servoAngles: [number, number]
  groundY: number
  onLayout?: (layout: RocketLayoutResult) => void
}

export function RocketModel({ orientation, servoAngles, groundY, onLayout }: RocketModelProps) {
  const { scene } = useGLTF(ROCKET_MODEL_URL)
  const model = useMemo(() => scene.clone(true), [scene])
  const [layout, setLayout] = useState<RocketLayoutResult | null>(null)

  useLayoutEffect(() => {
    const result = layoutRocketModel(model)
    setLayout(result)
    onLayout?.(result)

    model.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [model, onLayout])

  const quaternion = useMemo(() => {
    const q = new Quaternion(orientation[1], orientation[2], orientation[3], orientation[0])
    q.normalize()
    return q
  }, [orientation])

  return (
    <group quaternion={quaternion}>
      <group position={layout ? [0, -layout.pivotY, 0] : undefined}>
        <primitive object={model} />
        {layout && (
          <TvcGimbal
            servoAngles={servoAngles}
            position={[layout.motorMount.x, layout.motorMount.y, layout.motorMount.z]}
            baseRadius={layout.baseRadius}
            groundY={groundY}
          />
        )}
      </group>
    </group>
  )
}

useGLTF.preload(ROCKET_MODEL_URL)
