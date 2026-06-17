import { useGLTF } from '@react-three/drei'
import { useLayoutEffect, useMemo } from 'react'
import { Box3, Mesh, Quaternion, Vector3 } from 'three'

export const ROCKET_MODEL_URL = '/models/spacex_starship_spacecraft.glb'

/** Altura objetivo del modelo en unidades de escena (similar al placeholder). */
const TARGET_HEIGHT = 3

/**
 * Rotación fija del mesh exportado → eje largo del cohete alineado con +Y (Three.js).
 * Ajusta si la nariz apunta en otra dirección en reposo.
 */
const MODEL_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0]

interface RocketModelProps {
  orientation: [number, number, number, number]
}

export function RocketModel({ orientation }: RocketModelProps) {
  const { scene } = useGLTF(ROCKET_MODEL_URL)
  const model = useMemo(() => scene.clone(true), [scene])

  useLayoutEffect(() => {
    model.rotation.set(...MODEL_ROTATION)

    const box = new Box3().setFromObject(model)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())

    model.position.sub(center)

    const height = Math.max(size.x, size.y, size.z)
    if (height > 0) {
      model.scale.setScalar(TARGET_HEIGHT / height)
    }

    model.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [model])

  const quaternion = useMemo(() => {
    const q = new Quaternion(orientation[1], orientation[2], orientation[3], orientation[0])
    q.normalize()
    return q
  }, [orientation])

  return (
    <group quaternion={quaternion}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload(ROCKET_MODEL_URL)
