import { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Card, Group, ActionIcon, Slider, Stack, Text as MantineText, Title, Badge, Box } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconRotate, IconMoon, IconVector, IconZoom, IconInfoCircle } from '@tabler/icons-react';

interface LunarOrbit3DProps {
  points: any[];
}

// ============================================================================
// CONSTANTS
// ============================================================================
const EARTH_RADIUS_KM = 6378.137;
const MOON_RADIUS_KM = 1737.1;
const VECTOR_SCALE = 5e5; // Scale for acceleration vectors (reduced from 1e8 for better visualization)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const toScene = (v: { x: number; y: number; z: number }, scale: number): [number, number, number] =>
  [v.x * scale, v.y * scale, v.z * scale];

// ============================================================================
// SATELLITE COMPONENT WITH ANIMATION
// ============================================================================
interface SatelliteProps {
  position: [number, number, number];
  earthRadius: number;
  showVectors: boolean;
  acceleration?: { S: number; T: number; W: number };
}

const Satellite = ({ position, earthRadius, showVectors, acceleration }: SatelliteProps) => {
  const satelliteRef = useRef<THREE.Group>(null);

  return (
    <group ref={satelliteRef} position={position}>
      {/* Satellite body - Enlarged for better visibility */}
      <Sphere args={[earthRadius * 0.25, 24, 24]}>
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff0000"
          emissiveIntensity={1.2}
          metalness={0.9}
          roughness={0.1}
        />
      </Sphere>

      {/* Glow effect - Enhanced and larger */}
      <Sphere args={[earthRadius * 0.45, 24, 24]}>
        <meshBasicMaterial
          color="#ff4444"
          transparent
          opacity={0.5}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Acceleration vectors - Enhanced visibility */}
      {showVectors && acceleration && (
        <group>
          {/* S vector (radial) - red */}
          {Math.abs(acceleration.S) > 1e-20 && (
            <>
              <Line
                points={[
                  [0, 0, 0],
                  [acceleration.S * VECTOR_SCALE, 0, 0]
                ]}
                color="#ff6b6b"
                linewidth={6}
              />
              {/* Arrow head - Scaled with satellite size */}
              <mesh
                position={[acceleration.S * VECTOR_SCALE, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <coneGeometry args={[earthRadius * 0.15, earthRadius * 0.4, 12]} />
                <meshStandardMaterial color="#ff6b6b" emissive="#ff0000" emissiveIntensity={1.0} />
              </mesh>
              {/* Label - Positioned at end of vector */}
              <Html position={[acceleration.S * VECTOR_SCALE + earthRadius * 0.6, 0, 0]} center distanceFactor={100}>
                <div style={{ 
                  color: '#ff6b6b', 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textShadow: '0 0 4px rgba(255, 107, 107, 0.8)',
                  background: 'rgba(0, 0, 0, 0.6)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                }}>
                  S
                </div>
              </Html>
            </>
          )}

          {/* T vector (transverse) - blue */}
          {Math.abs(acceleration.T) > 1e-20 && (
            <>
              <Line
                points={[
                  [0, 0, 0],
                  [0, acceleration.T * VECTOR_SCALE, 0]
                ]}
                color="#4dabf7"
                linewidth={6}
              />
              {/* Arrow head - Scaled with satellite size */}
              <mesh
                position={[0, acceleration.T * VECTOR_SCALE, 0]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <coneGeometry args={[earthRadius * 0.15, earthRadius * 0.4, 12]} />
                <meshStandardMaterial color="#4dabf7" emissive="#0066ff" emissiveIntensity={1.0} />
              </mesh>
              {/* Label - Positioned at end of vector */}
              <Html position={[0, acceleration.T * VECTOR_SCALE + earthRadius * 0.6, 0]} center distanceFactor={100}>
                <div style={{ 
                  color: '#4dabf7', 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textShadow: '0 0 4px rgba(77, 171, 247, 0.8)',
                  background: 'rgba(0, 0, 0, 0.6)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                }}>
                  T
                </div>
              </Html>
            </>
          )}

          {/* W vector (normal) - green */}
          {Math.abs(acceleration.W) > 1e-20 && (
            <>
              <Line
                points={[
                  [0, 0, 0],
                  [0, 0, acceleration.W * VECTOR_SCALE]
                ]}
                color="#69db7c"
                linewidth={6}
              />
              {/* Arrow head - Scaled with satellite size */}
              <mesh
                position={[0, 0, acceleration.W * VECTOR_SCALE]}
              >
                <coneGeometry args={[earthRadius * 0.15, earthRadius * 0.4, 12]} />
                <meshStandardMaterial color="#69db7c" emissive="#00cc44" emissiveIntensity={1.0} />
              </mesh>
              {/* Label - Positioned at end of vector */}
              <Html position={[0, 0, acceleration.W * VECTOR_SCALE + earthRadius * 0.6]} center distanceFactor={100}>
                <div style={{ 
                  color: '#69db7c', 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textShadow: '0 0 4px rgba(105, 219, 124, 0.8)',
                  background: 'rgba(0, 0, 0, 0.6)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                }}>
                  W
                </div>
              </Html>
            </>
          )}
        </group>
      )}
    </group>
  );
};

// ============================================================================
// MOON COMPONENT
// ============================================================================
interface MoonProps {
  moonPosition: { x: number; y: number; z: number };
  earthRadius: number;
  scale: number;
}

const Moon = ({ moonPosition, earthRadius, scale }: MoonProps) => {
  const moonRadius = (MOON_RADIUS_KM / EARTH_RADIUS_KM) * earthRadius * 0.6;
  const pos = toScene(moonPosition, scale);

  return (
    <group position={pos}>
      {/* Moon sphere - Enhanced visibility */}
      <Sphere args={[moonRadius, 32, 32]}>
        <meshStandardMaterial
          color="#c0c0c0"
          emissive="#a0a0a0"
          emissiveIntensity={0.4}
          roughness={0.7}
          metalness={0.3}
        />
      </Sphere>

      {/* Moon glow - Enhanced */}
      <Sphere args={[moonRadius * 1.3, 32, 32]}>
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Label */}
      <Html position={[moonRadius * 2, moonRadius * 2, 0]} center distanceFactor={100}>
        <div style={{ 
          color: '#ffffff', 
          fontSize: '16px',
          fontWeight: 'bold',
          textShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '4px 8px',
          borderRadius: '6px',
          pointerEvents: 'none',
        }}>
          ☾ Луна
        </div>
      </Html>
    </group>
  );
};

// ============================================================================
// ORBIT SCENE COMPONENT
// ============================================================================
interface OrbitSceneProps {
  points: any[];
  scale: number;
  earthRadius: number;
  showMoon: boolean;
  showVectors: boolean;
  selectedPointIndex: number;
  isAnimating: boolean;
  animationSpeed: number;
}

const OrbitScene = ({
  points,
  scale,
  earthRadius,
  showMoon,
  showVectors,
  selectedPointIndex,
  isAnimating,
  animationSpeed,
}: OrbitSceneProps) => {
  const satelliteGroupRef = useRef<THREE.Group>(null);
  
  // Extract satellite positions
  const satellitePositions = useMemo(
    () => points.map((p) => toScene(p.positionECI, scale)),
    [points, scale]
  );

  // Extract Moon position
  const moonPosition = useMemo(() => {
    if (!points.length || selectedPointIndex === undefined) return null;
    return points[selectedPointIndex]?.moonPositionECI || points[0]?.moonPositionECI;
  }, [points, selectedPointIndex]);

  // Calculate Moon distance
  const moonDistance = moonPosition ? Math.sqrt(
    moonPosition.x ** 2 + moonPosition.y ** 2 + moonPosition.z ** 2
  ) : 0;

  // Get current satellite data
  const currentPoint = points[selectedPointIndex];
  const currentSatPos = currentPoint ? toScene(currentPoint.positionECI, scale) : null;
  const currentAccel = currentPoint?.acceleration;

  // Smooth animation with interpolation - useFrame is inside Canvas context
  useFrame((state, delta) => {
    if (isAnimating && satelliteGroupRef.current && currentSatPos) {
      // Smooth follow with lerp
      const targetPos = new THREE.Vector3(...currentSatPos);
      satelliteGroupRef.current.position.lerp(
        targetPos,
        Math.min(delta * animationSpeed * 2, 1)
      );
    }
  });

  return (
    <group>
      {/* Lighting - Enhanced for better visibility */}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[100, 50, 80]}
        intensity={5.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-50, -30, -50]} intensity={2.0} color="#4488ff" />
      <pointLight position={[50, 30, 50]} intensity={1.5} color="#ffaa88" />

      {/* Stars background - Using custom Points component for better compatibility */}
      {useMemo(() => {
        try {
          const stars: [number, number, number][] = [];
          for (let i = 0; i < 3000; i++) {
            const x = (Math.random() - 0.5) * 300;
            const y = (Math.random() - 0.5) * 300;
            const z = (Math.random() - 0.5) * 300;
            stars.push([x, y, z]);
          }
          return (
            <PointsComponent
              positions={stars}
              color="#ffffff"
              size={0.2}
              transparent
              opacity={0.8}
            />
          );
        } catch (error) {
          console.error('❌ Error rendering stars:', error);
          return null;
        }
      }, [])}

      {/* Earth with proper size */}
      <Sphere args={[earthRadius, 64, 64]} receiveShadow>
        <meshPhongMaterial
          color="#1a3a5c"
          emissive="#0a1628"
          emissiveIntensity={0.2}
          specular="#3366aa"
          shininess={30}
        />
      </Sphere>

      {/* Atmosphere glow - slightly larger than Earth */}
      <Sphere args={[earthRadius * 1.1, 48, 48]}>
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Satellite orbit path - ensure visibility */}
      {satellitePositions.length > 1 && (
        <Line
          points={satellitePositions}
          color="#ffd700"
          linewidth={4}
          transparent
          opacity={1.0}
          dashed
          dashScale={0.8}
        />
      )}

      {/* Animated satellite with initial position */}
      <group ref={satelliteGroupRef} position={currentSatPos || [0, earthRadius * 2, 0]}>
        <Satellite
          position={[0, 0, 0]}
          earthRadius={earthRadius}
          showVectors={showVectors}
          acceleration={currentAccel}
        />
      </group>

      {/* Moon */}
      {showMoon && moonPosition && (
        <>
          <Moon
            moonPosition={moonPosition}
            earthRadius={earthRadius}
            scale={scale}
          />
          {/* Moon orbit path */}
          <Line
            points={(() => {
              const moonOrbitPoints: [number, number, number][] = [];
              const moonOrbitScale = scale * moonDistance;
              for (let i = 0; i <= 64; i++) {
                const angle = (i / 64) * 2 * Math.PI;
                moonOrbitPoints.push([
                  Math.cos(angle) * moonOrbitScale,
                  Math.sin(angle) * moonOrbitScale,
                  0
                ]);
              }
              return moonOrbitPoints;
            })()}
            color="#aaaaaa"
            linewidth={2}
            transparent
            opacity={0.4}
            dashed
            dashScale={0.8}
          />
        </>
      )}

      {/* Coordinate axes - Larger and more visible */}
      <group>
        <Line
          points={[
            [-earthRadius * 10, 0, 0],
            [earthRadius * 10, 0, 0],
          ]}
          color="#ff6b6b"
          linewidth={3}
        />
        <Line
          points={[
            [0, -earthRadius * 10, 0],
            [0, earthRadius * 10, 0],
          ]}
          color="#4dabf7"
          linewidth={3}
        />
        <Line
          points={[
            [0, 0, -earthRadius * 10],
            [0, 0, earthRadius * 10],
          ]}
          color="#69db7c"
          linewidth={3}
        />
        <Html position={[earthRadius * 11, 0, 0]} center distanceFactor={100}>
          <div style={{ color: '#ff6b6b', fontSize: '18px', fontWeight: 'bold' }}>X</div>
        </Html>
        <Html position={[0, earthRadius * 11, 0]} center distanceFactor={100}>
          <div style={{ color: '#4dabf7', fontSize: '18px', fontWeight: 'bold' }}>Y</div>
        </Html>
        <Html position={[0, 0, earthRadius * 11]} center distanceFactor={100}>
          <div style={{ color: '#69db7c', fontSize: '18px', fontWeight: 'bold' }}>Z</div>
        </Html>
      </group>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={2 * earthRadius}
        maxDistance={150 * earthRadius}
        target={[0, 0, 0]}
        autoRotate={false}
        autoRotateSpeed={0.2}
      />
    </group>
  );
};

// ============================================================================
// POINTS COMPONENT FOR STARS
// ============================================================================
interface PointsProps {
  positions: [number, number, number][];
  color: string;
  size: number;
  transparent?: boolean;
  opacity?: number;
}

const PointsComponent = ({ positions, color, size, transparent = false, opacity = 1 }: PointsProps) => {
  const pointsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(positions.flatMap(p => p));
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }, [positions]);

  return (
    <points geometry={pointsGeometry}>
      <pointsMaterial
        color={color}
        size={size}
        transparent={transparent}
        opacity={opacity}
        sizeAttenuation
      />
    </points>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LunarOrbit3D({ points }: LunarOrbit3DProps) {
  const [showMoon, setShowMoon] = useState(true);
  const [showVectors, setShowVectors] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  const scale = useMemo(() => {
    if (!points.length) return 0.0001;

    let maxR = 0;
    for (const p of points) {
      const r = Math.sqrt(
        p.positionECI.x ** 2 + p.positionECI.y ** 2 + p.positionECI.z ** 2
      );
      if (r > maxR) maxR = r;
    }

    if (points[0]?.moonPositionECI) {
      const moonR = Math.sqrt(
        points[0].moonPositionECI.x ** 2 +
          points[0].moonPositionECI.y ** 2 +
          points[0].moonPositionECI.z ** 2
      );
      if (moonR > maxR) maxR = moonR;
    }

    // Scale to fit orbit in view with margin
    const calculatedScale = 20 / maxR;
    const finalScale = Math.max(1e-7, Math.min(calculatedScale, 1e-4));
    
    console.log('📏 Scale calculation:', {
      maxR,
      calculatedScale,
      finalScale,
      earthRadiusResult: EARTH_RADIUS_KM * finalScale
    });
    
    return finalScale;
  }, [points]);

  const earthRadius = EARTH_RADIUS_KM * scale;

  // Calculate statistics
  const stats = useMemo(() => {
    if (!points.length) return null;
    
    const heights = points.map(p => {
      const r = Math.sqrt(
        p.positionECI.x ** 2 + p.positionECI.y ** 2 + p.positionECI.z ** 2
      );
      return r - EARTH_RADIUS_KM;
    });
    
    return {
      minHeight: Math.min(...heights).toFixed(0),
      maxHeight: Math.max(...heights).toFixed(0),
      avgHeight: (heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(0),
      totalPoints: points.length,
    };
  }, [points]);

  // Debug logging
  useMemo(() => {
    if (points.length > 0) {
      console.log('🛰 LunarOrbit3D Debug:', {
        pointsCount: points.length,
        scale: scale.toExponential(4),
        earthRadius: earthRadius.toExponential(4),
        firstPoint: points[0].positionECI,
        firstPointScene: toScene(points[0].positionECI, scale),
        hasMoon: !!points[0]?.moonPositionECI,
        cameraPosition: [0, -50 * earthRadius, 30 * earthRadius],
        containerHeight: 'calc(100vh - 180px)',
      });
    }
  }, [points, scale, earthRadius]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating || points.length === 0) return;
    
    const intervalId = setInterval(() => {
      setSelectedPointIndex((prev) => {
        const increment = Math.max(1, Math.floor(animationSpeed));
        const next = prev + increment;
        return next >= points.length ? 0 : next;
      });
    }, 50);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isAnimating, animationSpeed, points.length]);

  // Get current point data
  const currentPoint = points[selectedPointIndex];
  const currentTime = currentPoint?.t || 0;
  const currentHeight = currentPoint ? 
    Math.sqrt(
      currentPoint.positionECI.x ** 2 +
      currentPoint.positionECI.y ** 2 +
      currentPoint.positionECI.z ** 2
    ) - EARTH_RADIUS_KM : 0;

  if (!points.length) {
    return (
      <Card
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10, 14, 23, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛰</div>
          <MantineText size="lg" c="gray.4">
            ⚠ Нет данных для отображения
          </MantineText>
          <MantineText size="sm" c="gray.5" mt="xs">
            Загрузите результаты расчёта орбиты
          </MantineText>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: 'calc(100vh - 180px)', 
      position: 'relative',
      background: 'linear-gradient(180deg, #0a0e17 0%, #1a1f2e 100%)',
      borderRadius: '16px',
      overflow: 'hidden',
      minHeight: '600px',
      display: 'block',
      visibility: 'visible',
      opacity: 1,
    }}>
      {/* 3D Canvas with error boundary */}
      <Canvas
        camera={{
          position: [0, -50 * earthRadius, 30 * earthRadius],
          fov: 60,
          near: 0.1,
          far: 10000,
        }}
        shadows
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
        onCreated={(state) => {
          console.log('🎨 Canvas created, camera position:', state.camera.position);
          console.log('🎨 Earth radius:', earthRadius);
        }}
        onError={(error) => {
          console.error('❌ Canvas error:', error);
        }}
      >
        <color attach="background" args={['#0a0e17']} />
        <fog attach="fog" args={['#0a0e17', 150, 400]} />

        <OrbitScene
          points={points}
          scale={scale}
          earthRadius={earthRadius}
          showMoon={showMoon}
          showVectors={showVectors}
          selectedPointIndex={selectedPointIndex}
          isAnimating={isAnimating}
          animationSpeed={animationSpeed}
        />
      </Canvas>

      {/* Top Control Panel */}
      <Card
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: '320px',
          background: 'rgba(10, 14, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px',
        }}
      >
        <Group justify="space-between" mb="md">
          <Title order={5} style={{ color: '#ffffff', fontSize: '16px' }}>
            🌍 3D Визуализация
          </Title>
          <Badge 
            variant="light" 
            color="blue"
            style={{ fontSize: '11px' }}
          >
            Интерактив
          </Badge>
        </Group>

        <Stack gap="md">
          {/* Animation controls */}
          <Group gap="xs">
            <ActionIcon
              onClick={() => setIsAnimating(!isAnimating)}
              variant={isAnimating ? 'filled' : 'light'}
              color={isAnimating ? 'red' : 'green'}
              size="lg"
              radius="md"
              style={{ transition: 'all 0.2s' }}
            >
              {isAnimating ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
            </ActionIcon>
            
            <ActionIcon
              onClick={() => {
                setIsAnimating(false);
                setSelectedPointIndex(0);
              }}
              variant="light"
              color="blue"
              size="lg"
              radius="md"
              style={{ transition: 'all 0.2s' }}
              title="Сброс к началу"
            >
              <IconRotate size={20} />
            </ActionIcon>

            <Box style={{ flex: 1 }}>
              <MantineText size="xs" c="gray.4" mb="xs">Скорость анимации</MantineText>
              <Slider
                value={animationSpeed}
                onChange={(value) => setAnimationSpeed(value as number)}
                min={0.5}
                max={5}
                step={0.5}
                marks={[
                  { value: 0.5, label: '0.5×' },
                  { value: 2.5, label: '2.5×' },
                  { value: 5, label: '5×' },
                ]}
                size="sm"
                color="yellow"
              />
            </Box>
          </Group>

          {/* Toggle options */}
          <Group gap="xs">
            <ActionIcon
              onClick={() => setShowMoon(!showMoon)}
              variant={showMoon ? 'filled' : 'light'}
              color="gray"
              size="md"
              radius="md"
              title="Показать Луну"
            >
              <IconMoon size={18} />
            </ActionIcon>
            
            <ActionIcon
              onClick={() => setShowVectors(!showVectors)}
              variant={showVectors ? 'filled' : 'light'}
              color="blue"
              size="md"
              radius="md"
              title="Векторы ускорений"
            >
              <IconVector size={18} />
            </ActionIcon>

            <ActionIcon
              variant="light"
              color="cyan"
              size="md"
              radius="md"
              title="Масштабирование"
            >
              <IconZoom size={18} />
            </ActionIcon>
          </Group>

          {/* Statistics */}
          {stats && (
            <Box
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <MantineText size="xs" c="gray.4" mb="xs" fw={600}>
                Параметры орбиты:
              </MantineText>
              <Group gap="xs" style={{ fontSize: '12px' }}>
                <Badge variant="light" color="orange" size="sm">
                  h_min: {stats.minHeight} км
                </Badge>
                <Badge variant="light" color="red" size="sm">
                  h_max: {stats.maxHeight} км
                </Badge>
                <Badge variant="light" color="green" size="sm">
                  h_avg: {stats.avgHeight} км
                </Badge>
              </Group>
            </Box>
          )}
        </Stack>
      </Card>

      {/* Bottom Info Panel */}
      <Card
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70%',
          maxWidth: '800px',
          background: 'rgba(10, 14, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px',
        }}
      >
        <Group justify="space-between" mb="sm">
          <Title order={6} style={{ color: '#ffffff', fontSize: '14px' }}>
            🛰 Положение спутника
          </Title>
          <Badge variant="light" color="yellow" size="sm">
            Точка {selectedPointIndex + 1} из {points.length}
          </Badge>
        </Group>

        <Slider
          value={selectedPointIndex}
          onChange={(value) => {
            setSelectedPointIndex(value as number);
            setIsAnimating(false);
          }}
          min={0}
          max={points.length - 1}
          step={1}
          marks={[
            { value: 0, label: 'Старт' },
            { value: Math.floor(points.length / 2), label: '½' },
            { value: points.length - 1, label: 'Конец' },
          ]}
          size="md"
          color="yellow"
        />

        <Group justify="space-between" mt="sm">
          <MantineText size="xs" c="gray.4">
            Время: {(currentTime / 3600).toFixed(3)} ч
          </MantineText>
          <MantineText size="xs" c="gray.4">
            Высота: {currentHeight.toFixed(0)} км
          </MantineText>
          {showVectors && currentPoint?.acceleration && (
            <MantineText size="xs" c="gray.4">
              Ускорения: S={currentPoint.acceleration.S.toExponential(2)} | 
              T={currentPoint.acceleration.T.toExponential(2)} | 
              W={currentPoint.acceleration.W.toExponential(2)} м/с²
            </MantineText>
          )}
        </Group>
      </Card>

      {/* Legend Panel */}
      <Card
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          width: '240px',
          background: 'rgba(10, 14, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px',
        }}
      >
        <Group gap="xs" mb="sm">
          <IconInfoCircle size={18} color="#667eea" />
          <Title order={6} style={{ color: '#ffffff', fontSize: '13px' }}>
            Легенда
          </Title>
        </Group>

        <Stack gap="xs" style={{ fontSize: '12px' }}>
          <Group gap="xs">
            <Box
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a3a5c 0%, #2d5a87 100%)',
                border: '2px solid #4488ff',
                boxShadow: '0 0 8px rgba(68, 136, 255, 0.6)',
              }}
            />
            <MantineText c="gray.3">Земля</MantineText>
          </Group>

          <Group gap="xs">
            <Box
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c0c0c0 0%, #e0e0e0 100%)',
              }}
            />
            <MantineText c="gray.3">Луна</MantineText>
          </Group>

          <Group gap="xs">
            <Box
              style={{
                width: '20px',
                height: '3px',
                background: 'linear-gradient(90deg, #ffd700 0%, #ffb700 100%)',
                borderRadius: '2px',
              }}
            />
            <MantineText c="gray.3">Орбита ИСЗ</MantineText>
          </Group>

          {showVectors && (
            <>
              <Group gap="xs">
                <Box
                  style={{
                    width: '20px',
                    height: '3px',
                    background: '#ff6b6b',
                    borderRadius: '2px',
                  }}
                />
                <MantineText c="gray.3">S (радиальное)</MantineText>
              </Group>

              <Group gap="xs">
                <Box
                  style={{
                    width: '20px',
                    height: '3px',
                    background: '#4dabf7',
                    borderRadius: '2px',
                  }}
                />
                <MantineText c="gray.3">T (трансверс.)</MantineText>
              </Group>

              <Group gap="xs">
                <Box
                  style={{
                    width: '20px',
                    height: '3px',
                    background: '#69db7c',
                    borderRadius: '2px',
                  }}
                />
                <MantineText c="gray.3">W (бинорм.)</MantineText>
              </Group>
            </>
          )}
        </Stack>
      </Card>

      {/* Controls hint */}
      <Card
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: 'rgba(10, 14, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 14px',
        }}
      >
        <MantineText size="xs" c="gray.4" lh={1.6}>
          <span style={{ color: '#667eea' }}>🖱</span> ЛКМ: вращение | ПКМ: панорама | Колесо: зум<br />
          <span style={{ color: '#667eea' }}>🔄</span> Двойной клик: сброс камеры
        </MantineText>
      </Card>
    </div>
  );
}
