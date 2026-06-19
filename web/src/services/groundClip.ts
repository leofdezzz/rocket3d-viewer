import { Plane, Vector3 } from 'three'

const _up = new Vector3(0, 1, 0)

/** Recorta geometria por debajo del suelo (y >= groundY). */
export function createGroundClipPlane(groundY: number): Plane {
  return new Plane(_up.clone(), -groundY)
}
