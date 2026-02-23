import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Sphere } from '@react-three/drei';
import type { OrbitPoint } from '@lab/shared';

interface OrbitVisualizerProps {
  points: OrbitPoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  useECEF: boolean;
}

const SCALE = 1 / 10000; // 10 000 км -> 1 unit
const EARTH_R0_KM = 6378.137;

export default function OrbitVisualizer({
  points,
  selectedIndex,
  onSelect,
  useECEF,
}: OrbitVisualizerProps) {
  if (!points.length) {
    return null;
  }

  const positions = points.map((p) => {
    const src = useECEF ? p.positionECEF : p.positionECI;
    return [src.x * SCALE, src.y * SCALE, src.z * SCALE] as [number, number, number];
  });

  const earthRadius = EARTH_R0_KM * SCALE;

  return (
    <Canvas camera={{ position: [0, -10 * earthRadius, 4 * earthRadius], fov: 40 }}>
      <color attach="background" args={['#050816']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 10]} intensity={1.2} />

      {/* Земля */}
      <Sphere args={[earthRadius, 32, 32]}>
        <meshStandardMaterial color="#1e90ff" wireframe />
      </Sphere>

      {/* Орбита */}
      <Line points={positions} color="#ffcc00" linewidth={2} />

      <AnimatedSatellite
        positions={positions}
        selectedIndex={selectedIndex}
        onSelect={onSelect}
        earthRadius={earthRadius}
        points={points}
      />

      {/* Оси координат (X,Y,Z) */}
      <Line
        points={[
          [-2 * earthRadius, 0, 0],
          [2 * earthRadius, 0, 0],
        ]}
        color="#ff4444"
      />
      <Line
        points={[
          [0, -2 * earthRadius, 0],
          [0, 2 * earthRadius, 0],
        ]}
        color="#4488ff"
      />
      <Line
        points={[
          [0, 0, -2 * earthRadius],
          [0, 0, 2 * earthRadius],
        ]}
        color="#00ff99"
      />

      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  );
}

interface AnimatedSatelliteProps {
  positions: [number, number, number][];
  selectedIndex: number;
  onSelect: (index: number) => void;
  earthRadius: number;
  points: OrbitPoint[];
}

function AnimatedSatellite({
  positions,
  selectedIndex,
  onSelect,
  earthRadius,
  points,
}: AnimatedSatelliteProps) {
  const idx = Math.max(0, Math.min(selectedIndex, positions.length - 1));
  const current = positions[idx];
  const acc = points[idx]?.acceleration.total ?? 0;

  // Нормируем длину вектора для визуализации
  const vecLen = Math.min(earthRadius * 1.2, Math.max(acc * 5e4 * SCALE, earthRadius * 0.1));

  const origin = current;
  const dir = [
    -origin[0],
    -origin[1],
    -origin[2],
  ] as [number, number, number];
  const norm = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  const unit = [dir[0] / norm, dir[1] / norm, dir[2] / norm] as [number, number, number];
  const tip: [number, number, number] = [
    origin[0] + unit[0] * vecLen,
    origin[1] + unit[1] * vecLen,
    origin[2] + unit[2] * vecLen,
  ];

  useFrame((state) => {
    const speed = 0.2; // витков/сек
    const t = state.clock.getElapsedTime() * speed;
    const nextIndex = Math.floor(t * positions.length) % positions.length;
    if (nextIndex !== selectedIndex) {
      onSelect(nextIndex);
    }
  });

  return (
    <>
      <Sphere
        args={[earthRadius * 0.15, 24, 24]}
        position={origin}
        onClick={() => {
          const next = (selectedIndex + 1) % positions.length;
          onSelect(next);
        }}
      >
        <meshStandardMaterial color="#ff3366" />
      </Sphere>

      {/* Вектор возмущающего ускорения — стрелка вдоль -r̂ */}
      <Line points={[origin, tip]} color="#ff8800" linewidth={3} />
    </>
  );
}
