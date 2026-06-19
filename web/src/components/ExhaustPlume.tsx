import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, Points, Vector3 } from 'three'

import { createGroundClipPlane } from '../services/groundClip'

const PARTICLE_COUNT = 140
const _world = new Vector3()

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
}

function spawnParticle(p: Particle, spread: number, speed: number) {
  const angle = Math.random() * Math.PI * 2
  const radius = Math.random() * spread
  p.x = Math.cos(angle) * radius * 0.25
  p.z = Math.sin(angle) * radius * 0.25
  p.y = -Math.random() * 0.02
  p.vx = (Math.random() - 0.5) * spread * 0.45
  p.vy = -(speed + Math.random() * speed * 0.35)
  p.vz = (Math.random() - 0.5) * spread * 0.45
  p.maxLife = 0.28 + Math.random() * 0.38
  p.life = p.maxLife
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    maxLife: 1,
  }))
}

interface ExhaustPlumeProps {
  /** 0–1: base + correccion TVC. */
  thrust: number
  /** Altura mundial del suelo; las particulas no la atraviesan. */
  groundY: number
}

export function ExhaustPlume({ thrust, groundY }: ExhaustPlumeProps) {
  const thrustRef = useRef(thrust)
  thrustRef.current = thrust
  const groundYRef = useRef(groundY)
  groundYRef.current = groundY

  const clipPlane = useMemo(() => createGroundClipPlane(groundY), [groundY])
  const clippingPlanes = useMemo(() => [clipPlane], [clipPlane])

  const particles = useMemo(() => {
    const arr = createParticles()
    for (const p of arr) {
      spawnParticle(p, 0.12, 2.8)
    }
    return arr
  }, [])
  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])
  const pointsRef = useRef<Points>(null)

  useFrame((_, delta) => {
    const t = Math.max(0.25, Math.min(1, thrustRef.current))
    const spread = 0.04 + t * 0.1
    const speed = 2.4 + t * 2.8
    const dt = Math.min(delta, 0.05)
    const floorY = groundYRef.current + 0.03
    const points = pointsRef.current

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i]
      p.life -= dt
      if (p.life <= 0) {
        spawnParticle(p, spread, speed)
      }

      p.vy -= dt * (0.8 + t * 1.2)
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt

      if (points) {
        _world.set(p.x, p.y, p.z)
        points.localToWorld(_world)
        if (_world.y < floorY) {
          spawnParticle(p, spread, speed)
        }
      }

      const idx = i * 3
      positions[idx] = p.x
      positions[idx + 1] = p.y
      positions[idx + 2] = p.z
    }

    const geometry = points?.geometry
    const attr = geometry?.getAttribute('position') as BufferAttribute | undefined
    if (attr) {
      attr.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef} position={[0, -0.3, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={PARTICLE_COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        color="#ffd080"
        transparent
        opacity={0.75}
        blending={AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        clippingPlanes={clippingPlanes}
        clipIntersection={false}
      />
    </points>
  )
}
