import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Slider } from '@mantine/core';

interface LunarOrbit3DProps {
  points: any[];
}

// ============================================================================
// CONSTANTS
// ============================================================================
const EARTH_RADIUS_KM = 6378.137;
const MOON_RADIUS_KM = 1737.1;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const toScene = (v: { x: number; y: number; z: number }, scale: number): [number, number, number] =>
  [v.x * scale, v.y * scale, v.z * scale];

// ============================================================================
// MOON COMPONENT
// ============================================================================
interface MoonProps {
  moonPosition: { x: number; y: number; z: number };
  earthRadius: number;
  scale: number;
}

const Moon = ({ moonPosition, earthRadius, scale }: MoonProps) => {
  const moonRadius = (MOON_RADIUS_KM / EARTH_RADIUS_KM) * earthRadius * 0.5;
  const pos = toScene(moonPosition, scale);

  return (
    <group position={pos}>
      <Sphere args={[moonRadius, 32, 32]}>
        <meshStandardMaterial
          color="#c0c0c0"
          emissive="#808080"
          emissiveIntensity={0.3}
          roughness={0.8}
        />
      </Sphere>
      <Text
        position={[moonRadius * 1.5, moonRadius * 1.5, 0]}
        fontSize={earthRadius * 0.15}
        color="#c0c0c0"
        anchorX="left"
        anchorY="middle"
      >
        ☾ Луна
      </Text>
    </group>
  );
};

// ============================================================================
// ORBIT VISUALIZATION COMPONENT
// ============================================================================
interface OrbitSceneProps {
  points: any[];
  scale: number;
  earthRadius: number;
  showMoon: boolean;
  showVectors?: boolean;
  selectedPointIndex?: number;
}

const OrbitScene = ({ points, scale, earthRadius, showMoon, showVectors, selectedPointIndex }: OrbitSceneProps) => {
  // Extract satellite positions
  const satellitePositions = useMemo(
    () => points.map((p) => toScene(p.positionECI, scale)),
    [points, scale]
  );

  // Extract Moon positions (use first point's moon position)
  const moonPosition = points[0]?.moonPositionECI;
  
  // Calculate Moon distance for display
  const moonDistance = moonPosition ? Math.sqrt(
    moonPosition.x ** 2 + moonPosition.y ** 2 + moonPosition.z ** 2
  ) : 0;
  
  // Get current satellite position for vector visualization
  const currentSatPos = selectedPointIndex !== undefined ? points[selectedPointIndex]?.positionECI : null;
  const currentAccel = selectedPointIndex !== undefined ? points[selectedPointIndex]?.acceleration : null;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[50, 30, 40]}
        intensity={2.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-30, -20, -30]} intensity={0.5} color="#4488ff" />

      {/* Earth */}
      <Sphere args={[earthRadius, 64, 64]} receiveShadow>
        <meshPhongMaterial
          color="#1a3a5c"
          emissive="#0a1628"
          emissiveIntensity={0.1}
          specular="#3366aa"
          shininess={15}
        />
      </Sphere>

      {/* Atmosphere glow */}
      <Sphere args={[earthRadius * 1.05, 48, 48]}>
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Satellite orbit path */}
      <Line
        points={satellitePositions}
        color="#ffd700"
        linewidth={3}
        transparent
        opacity={0.9}
      />
      
      {/* Current satellite position marker */}
      {currentSatPos && (
        <Sphere
          args={[earthRadius * 0.15, 16, 16]}
          position={toScene(currentSatPos, scale)}
        >
          <meshStandardMaterial
            color="#ff4444"
            emissive="#ff0000"
            emissiveIntensity={0.8}
          />
        </Sphere>
      )}
      
      {/* Acceleration vectors at current position */}
      {showVectors && currentSatPos && currentAccel && (
        <group position={toScene(currentSatPos, scale)}>
          {/* Radial vector S (red) - along position vector */}
          {Math.abs(currentAccel.S) > 1e-15 && (
            <Line
              points={[
                [0, 0, 0],
                [currentAccel.S * 1e8 * scale, 0, 0]
              ]}
              color="#ff0000"
              linewidth={3}
            />
          )}
          {/* Transverse vector T (blue) - perpendicular to radius in orbital plane */}
          {Math.abs(currentAccel.T) > 1e-15 && (
            <Line
              points={[
                [0, 0, 0],
                [0, currentAccel.T * 1e8 * scale, 0]
              ]}
              color="#0066ff"
              linewidth={3}
            />
          )}
          {/* Normal vector W (green) - perpendicular to orbital plane */}
          {Math.abs(currentAccel.W) > 1e-15 && (
            <Line
              points={[
                [0, 0, 0],
                [0, 0, currentAccel.W * 1e8 * scale]
              ]}
              color="#00cc44"
              linewidth={3}
            />
          )}
          
          {/* Vector labels */}
          <Text
            position={[currentAccel.S * 1e8 * scale + earthRadius * 0.3, 0, 0]}
            fontSize={earthRadius * 0.12}
            color="#ff6666"
            anchorX="left"
          >
            S
          </Text>
          <Text
            position={[0, currentAccel.T * 1e8 * scale + earthRadius * 0.3, 0]}
            fontSize={earthRadius * 0.12}
            color="#66a3ff"
            anchorX="left"
          >
            T
          </Text>
          <Text
            position={[0, 0, currentAccel.W * 1e8 * scale + earthRadius * 0.3]}
            fontSize={earthRadius * 0.12}
            color="#66ff99"
            anchorX="left"
          >
            W
          </Text>
        </group>
      )}

      {/* Moon */}
      {showMoon && moonPosition && (
        <>
          <Moon
            moonPosition={moonPosition}
            earthRadius={earthRadius}
            scale={scale}
          />
          {/* Moon distance indicator */}
          <Text
            position={[0, -earthRadius * 6, 0]}
            fontSize={earthRadius * 0.15}
            color="#c0c0c0"
            anchorX="center"
            anchorY="top"
          >
            Rₗ={(moonDistance / 1000).toFixed(1)} тыс. км
          </Text>
          {/* Moon orbit path (approximate circle) */}
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
            color="#888888"
            linewidth={1}
            transparent
            opacity={0.3}
          />
        </>
      )}

      {/* Coordinate axes */}
      <group>
        <Line
          points={[
            [-earthRadius * 8, 0, 0],
            [earthRadius * 8, 0, 0],
          ]}
          color="#ff6666"
          linewidth={2}
        />
        <Line
          points={[
            [0, -earthRadius * 8, 0],
            [0, earthRadius * 8, 0],
          ]}
          color="#6666ff"
          linewidth={2}
        />
        <Line
          points={[
            [0, 0, -earthRadius * 8],
            [0, 0, earthRadius * 8],
          ]}
          color="#66ff66"
          linewidth={2}
        />
        <Text
          position={[earthRadius * 8.5, 0, 0]}
          fontSize={earthRadius * 0.2}
          color="#ff6666"
          anchorX="left"
        >
          X
        </Text>
        <Text
          position={[0, earthRadius * 8.5, 0]}
          fontSize={earthRadius * 0.2}
          color="#6666ff"
          anchorX="left"
        >
          Y
        </Text>
        <Text
          position={[0, 0, earthRadius * 8.5]}
          fontSize={earthRadius * 0.2}
          color="#66ff66"
          anchorX="left"
        >
          Z
        </Text>
      </group>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={3 * earthRadius}
        maxDistance={100 * earthRadius}
        target={[0, 0, 0]}
        autoRotate
        autoRotateSpeed={0.2}
      />
    </>
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
    if (!points.length) return 1 / 10000;

    // Find maximum distance from Earth
    let maxR = 0;
    for (const p of points) {
      const r = Math.sqrt(
        p.positionECI.x ** 2 + p.positionECI.y ** 2 + p.positionECI.z ** 2
      );
      maxR = Math.max(maxR, r);
    }

    // Also consider Moon distance
    if (points[0]?.moonPositionECI) {
      const moonR = Math.sqrt(
        points[0].moonPositionECI.x ** 2 +
          points[0].moonPositionECI.y ** 2 +
          points[0].moonPositionECI.z ** 2
      );
      maxR = Math.max(maxR, moonR);
    }

    return 15 / maxR;
  }, [points]);

  const earthRadius = EARTH_RADIUS_KM * scale;

  // Calculate statistics for display
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
    };
  }, [points]);

  // Animation loop
  useMemo(() => {
    if (isAnimating && points.length > 0) {
      const interval = setInterval(() => {
        setSelectedPointIndex((prev) => {
          const next = prev + Math.max(1, Math.floor(animationSpeed));
          return next >= points.length ? 0 : next;
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [isAnimating, animationSpeed, points.length]);

  if (!points.length) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#888',
        }}
      >
        <div>
          ⚠ Нет данных для отображения<br />
          Загрузите результаты расчёта орбиты
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 200px)', position: 'relative' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{
          position: [0, -40 * EARTH_RADIUS_KM * scale, 20 * EARTH_RADIUS_KM * scale],
          fov: 45,
          near: 0.1,
          far: 500,
        }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0a0e17']} />
        <fog attach="fog" args={['#0a0e17', 50, 150]} />

        <OrbitScene
          points={points}
          scale={scale}
          earthRadius={earthRadius}
          showMoon={showMoon}
          showVectors={showVectors}
          selectedPointIndex={selectedPointIndex}
        />
      </Canvas>
      
      {/* Point selection slider */}
      {points.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
          }}
        >
          <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
            🛰 Положение спутника на орбите
          </div>
          <Slider
            value={selectedPointIndex}
            onChange={(value) => setSelectedPointIndex(value as number)}
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
          <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Точка: {selectedPointIndex + 1} из {points.length}</span>
            <span>
              Время: {(points[selectedPointIndex]?.t / 3600).toFixed(3)} ч |
              Высота: {(Math.sqrt(
                points[selectedPointIndex].positionECI.x ** 2 +
                points[selectedPointIndex].positionECI.y ** 2 +
                points[selectedPointIndex].positionECI.z ** 2
              ) - EARTH_RADIUS_KM).toFixed(0)} км
            </span>
          </div>
        </div>
      )}

      {/* Control panel */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '12px 15px',
          borderRadius: '8px',
          color: 'white',
          fontSize: '13px',
          maxWidth: '280px',
        }}
      >
        <div style={{ marginBottom: '10px', fontWeight: 'bold', borderBottom: '1px solid #444', paddingBottom: '6px' }}>
          🌍 3D Визуализация
        </div>
        
        {/* Animation controls */}
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            style={{
              padding: '6px 12px',
              marginRight: '8px',
              backgroundColor: isAnimating ? '#e03131' : '#2b8a3e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {isAnimating ? '⏸ Пауза' : '▶ Старт'}
          </button>
          <button
            onClick={() => {
              setIsAnimating(false);
              setSelectedPointIndex(0);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1971c2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            ⏮ Сброс
          </button>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Скорость анимации:</div>
          <input
            type="range"
            min="1"
            max="10"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '10px', color: '#888', textAlign: 'right' }}>{animationSpeed}x</div>
        </div>
        
        {/* Orbit statistics */}
        {stats && (
          <div style={{ marginBottom: '10px', fontSize: '12px' }}>
            <div style={{ color: '#aaa', marginBottom: '4px' }}>Орбита ИСЗ:</div>
            <div>h_min: {stats.minHeight} км | h_max: {stats.maxHeight} км</div>
            <div>h_avg: {stats.avgHeight} км</div>
          </div>
        )}
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '6px' }}>
          <input
            type="checkbox"
            checked={showMoon}
            onChange={(e) => setShowMoon(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Показать Луну
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showVectors}
            onChange={(e) => setShowVectors(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Векторы ускорений
        </label>
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px 15px',
          borderRadius: '8px',
          color: 'white',
          fontSize: '13px',
          maxWidth: '220px',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Легенда</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#1a3a5c',
                border: '1px solid #4488ff',
              }}
            />
            Земля
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#c0c0c0',
              }}
            />
            Луна
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '16px',
                height: '2px',
                backgroundColor: '#ffd700',
              }}
            />
            Орбита ИСЗ
          </div>
          {showVectors && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '16px',
                    height: '2px',
                    backgroundColor: '#ff0000',
                  }}
                />
                S (радиальное)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '16px',
                    height: '2px',
                    backgroundColor: '#0066ff',
                  }}
                />
                T (трансверс.)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '16px',
                    height: '2px',
                    backgroundColor: '#00cc44',
                  }}
                />
                W (бинорм.)
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 12px',
          borderRadius: '8px',
          color: '#aaa',
          fontSize: '12px',
        }}
      >
        <div>🖱 ЛКМ: вращение | ПКМ: панорама | Колесо: зум</div>
        <div style={{ marginTop: '4px' }}>🔄 Двойной клик: сброс камеры</div>
      </div>
    </div>
  );
}
