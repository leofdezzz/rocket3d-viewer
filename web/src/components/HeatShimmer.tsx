import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, DoubleSide, ShaderMaterial } from 'three'

interface HeatShimmerProps {
  thrust: number
}

export function HeatShimmer({ thrust }: HeatShimmerProps) {
  const materialRef = useRef<ShaderMaterial>(null)
  const thrustRef = useRef(thrust)

  useEffect(() => {
    thrustRef.current = thrust
  }, [thrust])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0.15 },
    }),
    [],
  )

  useFrame(({ clock }) => {
    if (!materialRef.current) return
    const t = Math.max(0.25, Math.min(1, thrustRef.current))
    materialRef.current.uniforms.uTime.value = clock.elapsedTime
    materialRef.current.uniforms.uOpacity.value = 0.05 + t * 0.18
  })

  if (thrust < 0.3) return null

  return (
    <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.55, 32]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            vec2 uv = vUv - 0.5;
            float dist = length(uv) * 2.0;
            float wave = sin(dist * 12.0 - uTime * 3.0) * 0.5 + 0.5;
            float alpha = (1.0 - dist) * wave * uOpacity;
            gl_FragColor = vec4(1.0, 0.55, 0.15, alpha * max(0.0, 1.0 - dist));
          }
        `}
      />
    </mesh>
  )
}
