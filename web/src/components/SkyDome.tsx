import { useMemo } from 'react'
import { BackSide, Color } from 'three'

export function SkyDome() {
  const uniforms = useMemo(
    () => ({
      uTopColor: { value: new Color('#0a1020') },
      uHorizonColor: { value: new Color('#1e3050') },
      uBottomColor: { value: new Color('#050810') },
    }),
    [],
  )

  return (
    <mesh scale={80} renderOrder={-10}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        side={BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uTopColor;
          uniform vec3 uHorizonColor;
          uniform vec3 uBottomColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            vec3 color;
            if (h > 0.0) {
              color = mix(uHorizonColor, uTopColor, pow(h, 0.65));
            } else {
              color = mix(uHorizonColor, uBottomColor, pow(-h, 0.8));
            }
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  )
}
