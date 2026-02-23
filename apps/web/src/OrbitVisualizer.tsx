import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Sphere, Text, Html } from '@react-three/drei';
import { useMemo, useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { OrbitPoint, Vector3 } from '@lab/shared';

// ============================================================================
// КОНСТАНТЫ
// ============================================================================
const EARTH_R0_KM = 6378.137;
// const OMEGA_E = 7.292115e-5;

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================
const toScene = (v: Vector3, scale: number): [number, number, number] =>
  [v.x * scale, v.y * scale, v.z * scale];

const computeTangent = (positions: [number, number, number][], idx: number): [number, number, number] => {
  if (positions.length < 2) return [1, 0, 0];
  const prev = positions[(idx - 1 + positions.length) % positions.length];
  const next = positions[(idx + 1) % positions.length];
  const tangent: [number, number, number] = [
    next[0] - prev[0],
    next[1] - prev[1],
    next[2] - prev[2],
  ];
  const norm = Math.hypot(...tangent) || 1;
  return [tangent[0] / norm, tangent[1] / norm, tangent[2] / norm];
};

const computeRTNAxes = (
  position: [number, number, number],
  tangent: [number, number, number]
) => {
  const rNorm = Math.hypot(...position) || 1;
  const R: [number, number, number] = [
    position[0] / rNorm,
    position[1] / rNorm,
    position[2] / rNorm,
  ];

  const W: [number, number, number] = [
    R[1] * tangent[2] - R[2] * tangent[1],
    R[2] * tangent[0] - R[0] * tangent[2],
    R[0] * tangent[1] - R[1] * tangent[0],
  ];
  const wNorm = Math.hypot(...W) || 1;
  const W_norm: [number, number, number] = [W[0] / wNorm, W[1] / wNorm, W[2] / wNorm];

  const T: [number, number, number] = [
    W_norm[1] * R[2] - W_norm[2] * R[1],
    W_norm[2] * R[0] - W_norm[0] * R[2],
    W_norm[0] * R[1] - W_norm[1] * R[0],
  ];

  return { R, T, W: W_norm };
};

// ============================================================================
// КОМПОНЕНТ: СТРЕЛКА (улучшенная)
// ============================================================================
interface ArrowProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  shaftRadius?: number;
  headLength?: number;
  headRadius?: number;
  opacity?: number;
}

const Arrow = ({
  start,
  end,
  color = '#ffffff',
  shaftRadius = 0.05,
  headLength = 0.3,
  headRadius = 0.15,
  opacity = 1,
}: ArrowProps) => {
  const dir = new THREE.Vector3(...end).sub(new THREE.Vector3(...start));
  const length = dir.length();
  if (length < 0.001) return null;

  const direction = dir.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction
  );

  // Длина цилиндра = общая длина минус длина головки
  const shaftLength = Math.max(length - headLength, 0);

  return (
    <group position={start} quaternion={quaternion}>
      {/* Цилиндр: смещён так, чтобы занимать интервал [0, shaftLength] по Y */}
      {shaftLength > 0 && (
        <mesh position={[0, shaftLength / 2, 0]}>
          <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 8]} />
          <meshStandardMaterial
            color={color}
            metalness={0.5}
            roughness={0.5}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
      )}
      {/* Конус: располагается от shaftLength до length по Y */}
      <mesh position={[0, shaftLength + headLength / 2, 0]}>
        <coneGeometry args={[headRadius, headLength, 8]} />
        <meshStandardMaterial
          color={color}
          metalness={0.5}
          roughness={0.5}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
};

// ============================================================================
// КОМПОНЕНТ: СПУТНИК (исправленный)
// ============================================================================
interface SatelliteProps {
  point: OrbitPoint;
  position: [number, number, number];
  earthRadius: number;
  allPositions: [number, number, number][];
  vectorScale: number;
  showComponents: boolean;
}

const Satellite = ({
  point,
  position,
  earthRadius,
  allPositions,
  vectorScale,
  showComponents,
}: SatelliteProps) => {
  const { S, T, W } = point.acceleration;
  const tangent = computeTangent(allPositions, point.index);
  const { R, T: T_dir, W: W_dir } = computeRTNAxes(position, tangent);

  // Вектор полного возмущения
  const jVector: [number, number, number] = [
    R[0] * S + T_dir[0] * T + W_dir[0] * W,
    R[1] * S + T_dir[1] * T + W_dir[1] * W,
    R[2] * S + T_dir[2] * T + W_dir[2] * W,
  ];

  // Увеличенный масштаб для лучшей видимости
  const componentScale = vectorScale * 1.5;
  const totalScale = vectorScale * 2;

  return (
    <group position={position}>
      {/* Спутник - делаем чуть меньше */}
      <Sphere args={[earthRadius * 0.06, 24, 24]}>
        <meshStandardMaterial
          color="#ff6b6b"
          emissive="#ff3333"
          emissiveIntensity={0.6}
        />
      </Sphere>

      {/* Компоненты S, T, W */}
      {showComponents && (
        <>
          {/* S - радиальная (красная) */}
          <Arrow
            start={[0, 0, 0]}
            end={[
              R[0] * S * componentScale,
              R[1] * S * componentScale,
              R[2] * S * componentScale,
            ]}
            color="#ff4444"
            shaftRadius={0.06}
            headLength={0.3}
            headRadius={0.15}
          />
          
          {/* T - трансверсальная (зелёная) */}
          <Arrow
            start={[0, 0, 0]}
            end={[
              T_dir[0] * T * componentScale,
              T_dir[1] * T * componentScale,
              T_dir[2] * T * componentScale,
            ]}
            color="#4ade80"
            shaftRadius={0.06}
            headLength={0.3}
            headRadius={0.15}
          />
          
          {/* W - бинормальная (синяя) */}
          <Arrow
            start={[0, 0, 0]}
            end={[
              W_dir[0] * W * componentScale,
              W_dir[1] * W * componentScale,
              W_dir[2] * W * componentScale,
            ]}
            color="#60a5fa"
            shaftRadius={0.06}
            headLength={0.3}
            headRadius={0.15}
          />
        </>
      )}

      {/* Полное возмущение (жёлтая, толще и длиннее) */}
      <Arrow
        start={[0, 0, 0]}
        end={[
          jVector[0] * totalScale,
          jVector[1] * totalScale,
          jVector[2] * totalScale,
        ]}
        color="#ffd700"
        shaftRadius={0.1}
        headLength={0.5}
        headRadius={0.25}
      />

      {/* Подписи компонент (если включены) */}
      {showComponents && (
        <>
          <Text
            position={[
              R[0] * S * componentScale * 1.2,
              R[1] * S * componentScale * 1.2,
              R[2] * S * componentScale * 1.2,
            ]}
            fontSize={earthRadius * 0.02}
            color="#ff4444"
          >
            S
          </Text>
          <Text
            position={[
              T_dir[0] * T * componentScale * 1.2,
              T_dir[1] * T * componentScale * 1.2,
              T_dir[2] * T * componentScale * 1.2,
            ]}
            fontSize={earthRadius * 0.02}
            color="#4ade80"
          >
            T
          </Text>
          <Text
            position={[
              W_dir[0] * W * componentScale * 1.2,
              W_dir[1] * W * componentScale * 1.2,
              W_dir[2] * W * componentScale * 1.2,
            ]}
            fontSize={earthRadius * 0.02}
            color="#60a5fa"
          >
            W
          </Text>
        </>
      )}
    </group>
  );
};

// ============================================================================
// КОМПОНЕНТ: ОСИ КООРДИНАТ (ДОБАВЛЕН!)
// ============================================================================
const CoordinateAxes = ({
  earthRadius,
  system,
}: {
  earthRadius: number;
  system: 'ECI' | 'ECEF';
}) => {
  const axisLen = 3 * earthRadius;
  const labelOffset = 3.4 * earthRadius;
  const fontSize = 0.18 * earthRadius;
  const labels = system === 'ECI'
    ? { x: 'X (ECI)', y: 'Y (ECI)', z: 'Z (ECI)' }
    : { x: 'X (ECEF)', y: 'Y (ECEF)', z: 'Z (ECEF)' };

  return (
    <group>
      <Line points={[[-axisLen, 0, 0], [axisLen, 0, 0]]} color="#ff6666" linewidth={1.5} />
      <Text position={[labelOffset, 0, 0]} fontSize={fontSize} color="#ff6666" anchorX="left">
        {labels.x}
      </Text>

      <Line points={[[0, -axisLen, 0], [0, axisLen, 0]]} color="#6666ff" linewidth={1.5} />
      <Text position={[0, labelOffset, 0]} fontSize={fontSize} color="#6666ff" anchorX="left">
        {labels.y}
      </Text>

      <Line points={[[0, 0, -axisLen], [0, 0, axisLen]]} color="#66ff66" linewidth={1.5} />
      <Text position={[0, 0, labelOffset]} fontSize={fontSize} color="#66ff66" anchorX="left">
        {labels.z}
      </Text>

      <Text position={[-axisLen, -axisLen * 0.9, axisLen * 0.5]} fontSize={fontSize * 0.9} color="#aaa" anchorX="left">
        СК: {system}
      </Text>
    </group>
  );
};

// ============================================================================
// КОМПОНЕНТ: ЭЛЕМЕНТЫ ОРБИТЫ (ИСПРАВЛЕННЫЙ)
// ============================================================================
interface OrbitalElementsDisplayProps {
  orbitalElements: { a: number; e: number; i: number; Omega: number; omega: number };
  earthRadius: number;
}

const OrbitalElementsDisplay = ({
  orbitalElements,
  earthRadius,
}: OrbitalElementsDisplayProps) => {
  const { i, Omega, omega } = orbitalElements;
  const r = earthRadius * 2.5;          // радиус отображения дуг
  const segments = 48;

  // Направления (единичные векторы)
  const X = new THREE.Vector3(1, 0, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  const U = new THREE.Vector3(Math.cos(Omega), Math.sin(Omega), 0); // на восходящий узел
  // Нормаль к орбите
  const W = new THREE.Vector3(
    Math.sin(i) * Math.sin(Omega),
    -Math.sin(i) * Math.cos(Omega),
    Math.cos(i)
  );
  // Направление на перицентр
  const P = new THREE.Vector3(
    Math.cos(Omega) * Math.cos(omega) - Math.sin(Omega) * Math.sin(omega) * Math.cos(i),
    Math.sin(Omega) * Math.cos(omega) + Math.cos(Omega) * Math.sin(omega) * Math.cos(i),
    Math.sin(omega) * Math.sin(i)
  );

  // Вспомогательная функция: дуга на сфере
  const getArcPoints = (start: THREE.Vector3, axis: THREE.Vector3, angle: number, radius: number, segments: number) => {
    const points: THREE.Vector3[] = [];
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const theta = t * angle;
      const v = start.clone().applyAxisAngle(axis, theta).multiplyScalar(radius);
      points.push(v);
    }
    return points;
  };

  // Дуги
  const omegaArcPoints = getArcPoints(X, Z, Omega, r, segments);
  const iArcPoints = getArcPoints(Z, U, i, r, segments);
  const wArcPoints = getArcPoints(U, W, omega, r, segments);

  // Середины дуг для подписей
  const midOmega = X.clone().applyAxisAngle(Z, Omega / 2).multiplyScalar(r * 1.1);
  const midI = Z.clone().applyAxisAngle(U, i / 2).multiplyScalar(r * 1.1);
  const midW = U.clone().applyAxisAngle(W, omega / 2).multiplyScalar(r * 1.1);

  // Точки на концах дуг (на сфере)
  const pointU = U.clone().multiplyScalar(r);
  const pointP = P.clone().multiplyScalar(r);
  const pointZ = Z.clone().multiplyScalar(r);
  const pointW = W.clone().multiplyScalar(r);

  // Линия узлов
  const nodeLinePoints: [number, number, number][] = [
    [-r * 0.9 * Math.cos(Omega), -r * 0.9 * Math.sin(Omega), 0],
    [ r * 0.9 * Math.cos(Omega),  r * 0.9 * Math.sin(Omega), 0],
  ];

  return (
    <group>
      {/* Точка весеннего равноденствия */}
      <group position={X.clone().multiplyScalar(r * 1.2).toArray()}>
        <Sphere args={[earthRadius * 0.05, 16, 16]}>
          <meshBasicMaterial color="#ff6666" />
        </Sphere>
        <Text position={[earthRadius * 0.2, 0, 0]} fontSize={earthRadius * 0.12} color="#ff6666" anchorX="left">♈</Text>
      </group>

      {/* Линия узлов */}
      <Line points={nodeLinePoints} color="#888" lineWidth={1.5} dashed dashScale={2} />

      {/* Восходящий узел */}
      <group position={pointU.toArray()}>
        <Sphere args={[earthRadius * 0.06, 16, 16]}>
          <meshBasicMaterial color="#4488ff" />
        </Sphere>
        <Html position={[0, 0, earthRadius * 0.15]} center style={{ color: '#4488ff', fontSize: '24px', fontWeight: 'bold', textShadow: '1px 1px 2px black', userSelect: 'none', pointerEvents: 'none' }}>☊</Html>
      </group>

      {/* Дуга Ω */}
      <Line points={omegaArcPoints.map(p => p.toArray())} color="#4488ff" lineWidth={2} transparent opacity={0.7} />
      <Text position={midOmega.toArray()} fontSize={earthRadius * 0.1} color="#4488ff" anchorX="center" anchorY="middle">Ω</Text>

      {/* Дуга i */}
      <Line points={iArcPoints.map(p => p.toArray())} color="#66ff66" lineWidth={2} transparent opacity={0.7} />
      <Text position={midI.toArray()} fontSize={earthRadius * 0.1} color="#66ff66" anchorX="center" anchorY="middle">i</Text>

      {/* Дуга ω */}
      <Line points={wArcPoints.map(p => p.toArray())} color="#ffaa00" lineWidth={2} transparent opacity={0.7} />
      <Text position={midW.toArray()} fontSize={earthRadius * 0.1} color="#ffaa00" anchorX="center" anchorY="middle">ω</Text>

      {/* Пунктирные линии для i: от центра к Z и к W */}
      <Line points={[[0, 0, 0], pointZ.toArray()]} color="#66ff66" lineWidth={1.5} dashed dashScale={4} transparent opacity={0.5} />
      <Line points={[[0, 0, 0], pointW.toArray()]} color="#66ff66" lineWidth={1.5} dashed dashScale={4} transparent opacity={0.5} />

      {/* Пунктирные линии для ω: от центра к U и к P */}
      <Line points={[[0, 0, 0], pointU.toArray()]} color="#ffaa00" lineWidth={1.5} dashed dashScale={4} transparent opacity={0.5} />
      <Line points={[[0, 0, 0], pointP.toArray()]} color="#ffaa00" lineWidth={1.5} dashed dashScale={4} transparent opacity={0.5} />

      {/* Акцент на точках перицентра и нормали */}
      <group position={pointP.toArray()}>
        <Sphere args={[earthRadius * 0.03, 8, 8]}>
          <meshBasicMaterial color="#ffaa00" />
        </Sphere>
      </group>
      <group position={pointW.toArray()}>
        <Sphere args={[earthRadius * 0.03, 8, 8]}>
          <meshBasicMaterial color="#66ff66" />
        </Sphere>
      </group>
    </group>
  );
};

// ============================================================================
// КОМПОНЕНТ: ПАНЕЛЬ УПРАВЛЕНИЯ (ИСПРАВЛЕННАЯ!)
// ============================================================================
interface ControlPanelProps {
  selectedIndex: number;
  totalPoints: number;
  currentPoint: OrbitPoint;
  isPlaying: boolean;
  animationDelay: number;
  showComponents: boolean;
  useECEF: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDelayChange: (delay: number) => void;
  onToggleComponents: () => void;
}

const ControlPanel = ({
  selectedIndex,
  totalPoints,
  currentPoint,
  isPlaying,
  animationDelay,
  showComponents,
  useECEF,
  onTogglePlay,
  onPrevious,
  onNext,
  onDelayChange,
  onToggleComponents,
}: ControlPanelProps) => {
  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      fontSize: '14px',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(75, 85, 99, 0.8)',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
      minWidth: '300px',
      zIndex: 10000,
      pointerEvents: 'auto',
    }}>
      <div style={{ fontWeight: 'bold', color: '#60a5fa', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🛰 Орбитальный визуализатор</span>
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          backgroundColor: useECEF ? 'rgba(34, 197, 94, 0.2)' : 'rgba(96, 165, 250, 0.2)',
          color: useECEF ? '#4ade80' : '#60a5fa',
        }}>
          {useECEF ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}
        </span>
      </div>

      {/* Прогресс */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
          <span>Точка</span>
          <span>{selectedIndex + 1} / {totalPoints}</span>
        </div>
        <div style={{ height: '6px', backgroundColor: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            backgroundColor: 'linear-gradient(90deg, #3b82f6, #22d3ee)',
            width: `${((selectedIndex + 1) / totalPoints) * 100}%`,
            transition: 'width 0.2s',
            background: 'linear-gradient(90deg, #3b82f6, #22d3ee)',
          }} />
        </div>
      </div>

      {/* Параметры точки */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        padding: '8px 0',
        borderTop: '1px solid #374151',
        borderBottom: '1px solid #374151',
        marginBottom: '12px',
        fontSize: '12px',
      }}>
        <div>
          <span style={{ color: '#6b7280' }}>Высота</span>
          <div style={{ fontFamily: 'monospace' }}>{currentPoint.height.toFixed(0)} км</div>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>|j|</span>
          <div style={{ fontFamily: 'monospace', color: '#fbbf24' }}>
            {(currentPoint.acceleration.total * 1e6).toFixed(1)} мкм/с²
          </div>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>S</span>
          <div style={{ fontFamily: 'monospace', color: '#f87171' }}>
            {(currentPoint.acceleration.S * 1e6).toFixed(1)}
          </div>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>T/W</span>
          <div style={{ fontFamily: 'monospace' }}>
            <span style={{ color: '#4ade80' }}>{(currentPoint.acceleration.T * 1e6).toFixed(1)}</span>
            <span style={{ color: '#6b7280', margin: '0 4px' }}>/</span>
            <span style={{ color: '#60a5fa' }}>{(currentPoint.acceleration.W * 1e6).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={onTogglePlay}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isPlaying ? '#d97706' : '#059669',
            color: 'white',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = isPlaying ? '#b45309' : '#047857'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = isPlaying ? '#d97706' : '#059669'}
        >
          {isPlaying ? '⏸ Пауза' : '▶ Старт'}
        </button>
        <button
          onClick={onPrevious}
          style={{
            padding: '6px 12px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
        >
          ◀
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '6px 12px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
        >
          ▶
        </button>
      </div>

      {/* Настройки */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
          <span style={{ color: '#9ca3af' }}>Задержка, мс</span>
          <input
            type="range"
            min={200}
            max={2000}
            step={100}
            value={animationDelay}
            onChange={(e) => onDelayChange(Number(e.target.value))}
            style={{
              width: '120px',
              accentColor: '#3b82f6',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontFamily: 'monospace', width: '40px', textAlign: 'right' }}>{animationDelay}</span>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showComponents}
            onChange={onToggleComponents}
            style={{
              width: '16px',
              height: '16px',
              accentColor: '#3b82f6',
              cursor: 'pointer',
            }}
          />
          <span style={{ color: '#d1d5db' }}>Показать S/T/W компоненты</span>
        </label>
      </div>
    </div>
  );
};

// ============================================================================
// ОСНОВНАЯ СЦЕНА
// ============================================================================
interface OrbitSceneProps {
  points: OrbitPoint[];
  selectedIndex: number;
  useECEF: boolean;
  scale: number;
  orbitalElements?: { a: number; e: number; i: number; Omega: number; omega: number };
  vectorScale: number;
  showComponents: boolean;
}




interface AnimationControllerProps {
  points: OrbitPoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  isPlaying: boolean;
  animationDelay: number;
}

const AnimationController = ({
  points,
  selectedIndex,
  onSelect,
  isPlaying,
  animationDelay,
}: AnimationControllerProps) => {
  const lastUpdate = useRef(0);

  useFrame((state) => {
    if (animationDelay <= 0 || !points.length || !isPlaying) return;
    const elapsed = state.clock.getElapsedTime() * 1000;
    if (elapsed - lastUpdate.current >= animationDelay) {
      const nextIdx = (selectedIndex + 1) % points.length;
      onSelect(nextIdx);
      lastUpdate.current = elapsed;
    }
  });

  return null; // Этот компонент ничего не рендерит в сцену
};


const OrbitScene = ({
  points,
  selectedIndex,
  useECEF,
  scale,
  orbitalElements,
  vectorScale,
  showComponents,
}: OrbitSceneProps) => {
  const earthRadius = EARTH_R0_KM * scale;
  const positions = useMemo(
    () => points.map(p => toScene(useECEF ? p.positionECEF : p.positionECI, scale)),
    [points, useECEF, scale]
  );

  const { periIdx, apoIdx } = useMemo(() => {
    if (!points.length) return { periIdx: -1, apoIdx: -1 };
    let minR = Infinity, maxR = -Infinity;
    let peri = -1, apo = -1;
    points.forEach((p, i) => {
      if (p.r < minR) { minR = p.r; peri = i; }
      if (p.r > maxR) { maxR = p.r; apo = i; }
    });
    return { periIdx: peri, apoIdx: apo };
  }, [points]);

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[30, 20, 25]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-20, -15, -20]} intensity={0.4} color="#4488ff" />

      {/* Земля */}
      <Sphere args={[earthRadius, 64, 64]} receiveShadow>
        <meshPhongMaterial color="#1a3a5c" specular="#3366aa" shininess={15} />
      </Sphere>

      {/* Атмосфера */}
      <Sphere args={[earthRadius * 1.03, 48, 48]}>
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Орбита */}
      <Line
        points={positions}
        color="#ffd700"
        linewidth={2.5}
        transparent
        opacity={0.95}
      />

      {/* Перицентр */}
      {periIdx >= 0 && positions[periIdx] && (
        <group position={positions[periIdx]}>
          <Sphere args={[earthRadius * 0.04, 16, 16]}>
            <meshBasicMaterial color="#00ff00" />
          </Sphere>
          <Text
            position={[0, earthRadius * 0.15, 0]}
            fontSize={earthRadius * 0.08}
            color="#00ff00"
          >
            Π
          </Text>
        </group>
      )}

      {/* Апоцентр */}
      {apoIdx >= 0 && positions[apoIdx] && (
        <group position={positions[apoIdx]}>
          <Sphere args={[earthRadius * 0.04, 16, 16]}>
            <meshBasicMaterial color="#ff4444" />
          </Sphere>
          <Text
            position={[0, earthRadius * 0.15, 0]}
            fontSize={earthRadius * 0.08}
            color="#ff4444"
          >
            A
          </Text>
        </group>
      )}

      {/* Спутник */}
      {points[selectedIndex] && positions[selectedIndex] && (
        <Satellite
          point={points[selectedIndex]}
          position={positions[selectedIndex]}
          earthRadius={earthRadius}
          allPositions={positions}
          vectorScale={vectorScale}
          showComponents={showComponents}
        />
      )}

      {/* Оси координат */}
      <CoordinateAxes earthRadius={earthRadius} system={useECEF ? 'ECEF' : 'ECI'} />

      {/* Элементы орбиты (только для АГЭСК) */}
      {!useECEF && orbitalElements && (
        <OrbitalElementsDisplay
          orbitalElements={orbitalElements}
          earthRadius={earthRadius}
        />
      )}

      {/* Экватор (плоскость XY) */}
      <Line
        points={[
          [-6 * earthRadius, 0, 0],
          [6 * earthRadius, 0, 0],
          [0, -6 * earthRadius, 0],
          [0, 6 * earthRadius, 0],
          [-6 * earthRadius, 0, 0],
        ]}
        color="#335577"
        linewidth={1}
        transparent
        opacity={0.3}
      />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={2.5 * earthRadius}
        maxDistance={60 * earthRadius}
        target={[0, 0, 0]}
        autoRotate={!useECEF}
        autoRotateSpeed={0.3}
      />
    </>
  );
};


// ============================================================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================================================
interface OrbitVisualizerProps {
  points: OrbitPoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  useECEF: boolean;
  orbitalElements?: { a: number; e: number; i: number; Omega: number; omega: number };
}

export default function OrbitVisualizer({
  points,
  selectedIndex,
  onSelect,
  useECEF,
  orbitalElements,
}: OrbitVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationDelay, setAnimationDelay] = useState(800);
  const [showComponents, setShowComponents] = useState(false);

  const scale = useMemo(() => {
    if (!points.length) return 1 / 10000;
    let maxR = 0;
    for (const p of points) {
      const src = useECEF ? p.positionECEF : p.positionECI;
      const r = Math.sqrt(src.x ** 2 + src.y ** 2 + src.z ** 2);
      maxR = Math.max(maxR, r);
    }
    return 10 / maxR;
  }, [points, useECEF]);

  const vectorScale = useMemo(() => {
    if (!points.length) return 1; // запасное значение
    const avgAccel = points.reduce((sum, p) => sum + p.acceleration.total, 0) / points.length;
    const targetLength = 1.5; // желаемая длина среднего вектора в единицах сцены
    return targetLength / Math.max(avgAccel, 1e-10);
}, [points]);

  const handleTogglePlay = useCallback(() => setIsPlaying(!isPlaying), [isPlaying]);
  const handlePrevious = useCallback(() => onSelect((selectedIndex - 1 + points.length) % points.length), [selectedIndex, points.length, onSelect]);
  const handleNext = useCallback(() => onSelect((selectedIndex + 1) % points.length), [selectedIndex, points.length, onSelect]);
  const handleDelayChange = useCallback((delay: number) => setAnimationDelay(delay), []);
  const handleToggleComponents = useCallback(() => setShowComponents(!showComponents), [showComponents]);

  if (!points.length) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '400px',
        backgroundColor: '#0a0e17',
        color: '#ef4444',
        fontSize: '16px',
      }}>
        ⚠ Нет данных для отображения<br />
        <span style={{ color: '#9ca3af', fontSize: '14px' }}>Загрузите результаты расчёта орбиты</span>
      </div>
    );
  }

  const currentPoint = points[selectedIndex];

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: '400px',
      backgroundColor: '#0a0e17',
    }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{
          position: [0, -30 * EARTH_R0_KM * scale, 15 * EARTH_R0_KM * scale],
          fov: 50,
          near: 0.1,
          far: 300,
        }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0a0e17']} />
        <fog attach="fog" args={['#0a0e17', 40, 100]} />

        <AnimationController
          points={points}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
          isPlaying={isPlaying}
          animationDelay={animationDelay}
        />


        <OrbitScene
          points={points}
          selectedIndex={selectedIndex}
          useECEF={useECEF}
          scale={scale}
          orbitalElements={orbitalElements}
          vectorScale={vectorScale}
          showComponents={showComponents}
        />
      </Canvas>

      {/* ПАНЕЛЬ УПРАВЛЕНИЯ - теперь точно видна! */}
      <ControlPanel
        selectedIndex={selectedIndex}
        totalPoints={points.length}
        currentPoint={currentPoint}
        isPlaying={isPlaying}
        animationDelay={animationDelay}
        showComponents={showComponents}
        useECEF={useECEF}
        onTogglePlay={handleTogglePlay}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onDelayChange={handleDelayChange}
        onToggleComponents={handleToggleComponents}
      />

      {/* Легенда */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '11px',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(75, 85, 99, 0.8)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        zIndex: 10000,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#d1d5db' }}>Легенда</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff6b6b' }} />
          <span>Спутник</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '2px', backgroundColor: '#ffd700' }} />
          <span>Орбита</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#00ff00' }} />
          <span>Перицентр (Π)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff4444' }} />
          <span>Апоцентр (A)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '4px', marginTop: '4px', borderTop: '1px solid #374151' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#ff6b6b' }} />
            <div style={{ width: '8px', height: '8px', backgroundColor: '#4ade80' }} />
            <div style={{ width: '8px', height: '8px', backgroundColor: '#60a5fa' }} />
          </div>
          <span>S / T / W</span>
        </div>
      </div>

      {/* Подсказка */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        fontSize: '10px',
        color: '#6b7280',
        backgroundColor: 'rgba(17, 24, 39, 0.7)',
        padding: '6px 10px',
        borderRadius: '4px',
        border: '1px solid rgba(75, 85, 99, 0.5)',
        zIndex: 10000,
      }}>
        <div>🖱 ЛКМ: вращение | ПКМ: панорама | Колесо: зум</div>
        <div style={{ marginTop: '2px' }}>🔄 Двойной клик: сброс камеры</div>
      </div>
    </div>
  );
}
