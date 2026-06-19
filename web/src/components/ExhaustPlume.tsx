import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  DoubleSide,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three'

import { createGroundClipPlane } from '../services/groundClip'

const PARTICLE_COUNT = 220
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
  p.maxLife = 0.28 + Math.random() * 0.42
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

function lifeColor(lifeRatio: number): [number, number, number] {
  if (lifeRatio > 0.65) return [1.0, 0.95, 0.85]
  if (lifeRatio > 0.35) return [1.0, 0.55, 0.15]
  return [0.45, 0.42, 0.4]
}

interface ExhaustPlumeProps {
  thrust: number
  groundY: number
}

export function ExhaustPlume({ thrust, groundY }: ExhaustPlumeProps) {
  const thrustRef = useRef(thrust)
  const groundYRef = useRef(groundY)

  useEffect(() => {
    thrustRef.current = thrust
  }, [thrust])

  useEffect(() => {
    groundYRef.current = groundY
  }, [groundY])

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
  const colors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])
  const pointsRef = useRef<Points>(null)

  const volumetricUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0.5 },
    }),
    [],
  )
  const volumetricRef = useRef<ShaderMaterial>(null)

  /* eslint-disable react-hooks/immutability -- particle sim mutates buffers in useFrame */
  useFrame(({ clock }, delta) => {
    const t = Math.max(0.25, Math.min(1, thrustRef.current))
    const spread = 0.04 + t * 0.12
    const speed = 2.4 + t * 3.2
    const dt = Math.min(delta, 0.05)
    const floorY = groundYRef.current + 0.03

    if (volumetricRef.current) {
      volumetricRef.current.uniforms.uTime.value = clock.elapsedTime
      volumetricRef.current.uniforms.uIntensity.value = t
    }

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

      const points = pointsRef.current
      if (points) {
        _world.set(p.x, p.y, p.z)
        points.localToWorld(_world)
        if (_world.y < floorY) {
          spawnParticle(p, spread, speed)
        }
      }

      const lifeRatio = p.life / p.maxLife
      const [r, g, b] = lifeColor(lifeRatio)
      const idx = i * 3
      positions[idx] = p.x
      positions[idx + 1] = p.y
      positions[idx + 2] = p.z
      colors[idx] = r
      colors[idx + 1] = g
      colors[idx + 2] = b
    }

    const geometry = pointsRef.current?.geometry
    if (geometry) {
      const posAttr = geometry.getAttribute('position') as BufferAttribute
      const colAttr = geometry.getAttribute('color') as BufferAttribute
      posAttr.needsUpdate = true
      colAttr.needsUpdate = true
    }
  })
  /* eslint-enable react-hooks/immutability */

  return (
    <group position={[0, -0.3, 0]}>
      {/* Columna volumétrica de calor */}
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[0.14, 1.6, 16, 1, true]} />
        <shaderMaterial
          ref={volumetricRef}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
          clippingPlanes={clippingPlanes}
          uniforms={volumetricUniforms}
          vertexShader={`
            varying vec2 vUv;
            varying float vY;
            void main() {
              vUv = uv;
              vY = position.y;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform float uIntensity;
            varying vec2 vUv;
            varying float vY;
            void main() {
              float radial = 1.0 - abs(vUv.x - 0.5) * 2.0;
              float vertical = smoothstep(-0.8, 0.2, vY);
              float scroll = sin(vUv.y * 8.0 - uTime * 4.0) * 0.5 + 0.5;
              float alpha = radial * vertical * scroll * uIntensity * 0.35;
              vec3 color = mix(vec3(1.0, 0.4, 0.1), vec3(1.0, 0.85, 0.6), radial);
              gl_FragColor = vec4(color, alpha);
            }
          `}
        />
      </mesh>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={PARTICLE_COUNT} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} count={PARTICLE_COUNT} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          vertexColors
          transparent
          opacity={0.8}
          blending={AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
          clippingPlanes={clippingPlanes}
          clipIntersection={false}
        />
      </points>
    </group>
  )
}
