import { Box3, Object3D, Vector3 } from 'three'

/** Altura objetivo del modelo en unidades de escena. */
export const ROCKET_TARGET_HEIGHT = 3

/**
 * GLB con nariz en +Y: coincide con el eje largo del cohete (MPU +Y, Three +Y).
 */
export const ROCKET_MODEL_ROTATION: [number, number, number] = [0, 0, 0]

export interface RocketLayoutResult {
  motorMount: Vector3
  /** Radio aproximado del cuerpo en la base (para escalar el gimbal). */
  baseRadius: number
}

const _size = new Vector3()
const _center = new Vector3()

/**
 * Centra y escala el modelo; devuelve el punto de montaje del motor (centro de la base).
 */
export function layoutRocketModel(model: Object3D): RocketLayoutResult {
  model.rotation.set(...ROCKET_MODEL_ROTATION)

  const box = new Box3().setFromObject(model)
  box.getSize(_size)
  box.getCenter(_center)
  model.position.sub(_center)

  const height = Math.max(_size.x, _size.y, _size.z)
  if (height > 0) {
    model.scale.setScalar(ROCKET_TARGET_HEIGHT / height)
  }

  box.setFromObject(model)
  box.getSize(_size)

  // Radio del cuerpo en la base (~50% del fuselaje: visible pero no a todo el diametro).
  const baseRadius = (Math.min(_size.x, _size.y) / 2) * 0.5
  const motorMount = new Vector3(0, box.min.y, 0)

  return { motorMount, baseRadius: Math.max(baseRadius, 0.2) }
}
