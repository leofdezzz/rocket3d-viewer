import { Box3, Object3D, Vector3 } from 'three'

/** Altura objetivo del modelo en unidades de escena. */
export const ROCKET_TARGET_HEIGHT = 3

/**
 * Altura del MPU / centro de giro en el modelo: 0 = base, 0.5 = centro geometrico, 1 = nariz.
 * Valores bajos (~0.15–0.3) simulan el IMU montado cerca de la tobera.
 */
export const MPU_PIVOT_HEIGHT_FRAC = 0.22

/**
 * GLB con nariz en +Y: coincide con el eje largo del cohete (MPU +Y, Three +Y).
 */
export const ROCKET_MODEL_ROTATION: [number, number, number] = [0, 0, 0]

/** Radio de referencia del gimbal TVC (coincide con TvcGimbal). */
export const REF_BASE_RADIUS = 0.34

/** Caida maxima del gimbal bajo motorMount, en escala de referencia. */
const GIMBAL_HANG_BELOW_MOUNT = 0.92

export interface RocketLayoutResult {
  motorMount: Vector3
  /** Radio aproximado del cuerpo en la base (para escalar el gimbal). */
  baseRadius: number
  /** Y local del MPU: el cohete rota alrededor de este punto. */
  pivotY: number
  /** Y mundial del suelo (cohete en reposo, identidad). */
  groundY: number
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

  const modelExtent = Math.max(_size.x, _size.y, _size.z)
  if (modelExtent > 0) {
    model.scale.setScalar(ROCKET_TARGET_HEIGHT / modelExtent)
  }

  box.setFromObject(model)
  box.getSize(_size)

  const minY = box.min.y
  const maxY = box.max.y
  const height = maxY - minY

  // Radio del cuerpo en la base (~50% del fuselaje: visible pero no a todo el diametro).
  const baseRadius = (Math.min(_size.x, _size.z) / 2) * 0.5
  const motorMount = new Vector3(0, minY, 0)
  const pivotY = minY + height * MPU_PIVOT_HEIGHT_FRAC
  const gimbalScale = Math.max(baseRadius, 0.2) / REF_BASE_RADIUS
  const lowestLocal = minY - GIMBAL_HANG_BELOW_MOUNT * gimbalScale
  const groundY = lowestLocal - pivotY - 0.08

  return { motorMount, baseRadius: Math.max(baseRadius, 0.2), pivotY, groundY }
}
