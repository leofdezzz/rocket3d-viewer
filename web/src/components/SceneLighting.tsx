interface SceneLightingProps {
  presentation: boolean
}

export function SceneLighting({ presentation }: SceneLightingProps) {
  const ambientIntensity = presentation ? 0.18 : 0.22
  const keyIntensity = presentation ? 1.5 : 1.25
  const rimIntensity = presentation ? 0.85 : 0.65

  return (
    <>
      <hemisphereLight args={['#1a2844', '#0a0c10', 0.35]} />
      <ambientLight intensity={ambientIntensity} color="#8899bb" />

      <directionalLight
        castShadow
        intensity={keyIntensity}
        color="#ffd4a8"
        position={[6, 7, 4]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0002}
      />

      <directionalLight intensity={rimIntensity} color="#6eb8ff" position={[-5, 4, -6]} />

      <spotLight
        castShadow
        intensity={presentation ? 1.1 : 0.85}
        angle={0.45}
        penumbra={0.6}
        color="#fff5e8"
        position={[0, 10, 2]}
      />

      <pointLight intensity={0.35} distance={12} color="#ff8a4c" position={[4, 0.5, 4]} />
      <pointLight intensity={0.25} distance={10} color="#5eb8ff" position={[-4, 0.5, -3]} />
    </>
  )
}
