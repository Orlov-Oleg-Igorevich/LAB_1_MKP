import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere as Sphere3D, Stars, OrbitControls, Float, Line } from '@react-three/drei';
import { Container, Title, Text, Card, Group, Button, SimpleGrid, Box, Badge } from '@mantine/core';
import { IconSatellite, IconMoon, IconArrowRight, IconRocket, IconPlanet, IconStar } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

// ============================================================================
// UTILS AND CONSTANTS
// ============================================================================
const EARTH_RADIUS = 1;
const ORBIT_RADIUS = 2.5;
const SATELLITE_SIZE = 0.08;

// ============================================================================
// STARFIELD COMPONENT WITH PARALLAX
// ============================================================================
interface StarfieldProps {
  mousePos: THREE.Vector2;
}

const Starfield = ({ mousePos }: StarfieldProps) => {
  const starsRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.z = state.clock.elapsedTime * 0.02;
      // Parallax effect based on mouse position
      starsRef.current.position.x = THREE.MathUtils.lerp(
        starsRef.current.position.x,
        mousePos.x * 0.5,
        0.02
      );
      starsRef.current.position.y = THREE.MathUtils.lerp(
        starsRef.current.position.y,
        mousePos.y * 0.5,
        0.02
      );
    }
  });

  return (
    <Stars
      ref={starsRef}
      radius={50}
      depth={50}
      count={5000}
      factor={4}
      saturation={0}
      fade
      speed={1}
    />
  );
};

// ============================================================================
// EARTH COMPONENT WITH ATMOSPHERE GLOW
// ============================================================================
const Earth = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = state.clock.elapsedTime * 0.07;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <Sphere3D ref={earthRef} args={[EARTH_RADIUS, 64, 64]}>
        <meshPhongMaterial
          color="#1a5f7a"
          emissive="#0a2f3a"
          emissiveIntensity={0.2}
          specular="#2a8f9f"
          shininess={15}
          transparent
          opacity={0.95}
        />
      </Sphere3D>
      
      {/* Atmosphere glow */}
      <Sphere3D ref={atmosphereRef} args={[EARTH_RADIUS * 1.15, 64, 64]}>
        <meshPhongMaterial
          color="#4a9eff"
          emissive="#2a7fff"
          emissiveIntensity={0.4}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </Sphere3D>
      
      {/* Inner core glow */}
      <Sphere3D args={[EARTH_RADIUS * 0.3, 32, 32]}>
        <meshBasicMaterial
          color="#3a8fff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </Sphere3D>
    </group>
  );
};

// ============================================================================
// SATELLITE COMPONENT WITH ORBITAL MOTION
// ============================================================================
interface SatelliteProps {
  time: number;
  orbitRadius: number;
  speed?: number;
  inclination?: number;
}

const Satellite = ({ time, orbitRadius, speed = 0.3, inclination = 0.3 }: SatelliteProps) => {
  const satelliteRef = useRef<THREE.Group>(null);
  
  // Calculate orbital position
  const angle = time * speed;
  const x = Math.cos(angle) * orbitRadius;
  const z = Math.sin(angle) * orbitRadius * Math.cos(inclination);
  const y = Math.sin(angle) * orbitRadius * Math.sin(inclination);
  
  useFrame(() => {
    if (satelliteRef.current) {
      satelliteRef.current.position.set(x, y, z);
      // Rotate satellite along its axis
      satelliteRef.current.rotation.y += 0.02;
      satelliteRef.current.rotation.z += 0.01;
    }
  });

  return (
    <group ref={satelliteRef} position={[x, y, z]}>
      {/* Main body */}
      <Sphere3D args={[SATELLITE_SIZE, 16, 16]}>
        <meshStandardMaterial
          color="#ff6b6b"
          emissive="#ff3333"
          emissiveIntensity={0.8}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere3D>
      
      {/* Solar panels */}
      <mesh position={[SATELLITE_SIZE * 1.5, 0, 0]}>
        <boxGeometry args={[0.3, SATELLITE_SIZE * 2.5, 0.05]} />
        <meshStandardMaterial
          color="#4a9eff"
          emissive="#2a7fff"
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[-SATELLITE_SIZE * 1.5, 0, 0]}>
        <boxGeometry args={[0.3, SATELLITE_SIZE * 2.5, 0.05]} />
        <meshStandardMaterial
          color="#4a9eff"
          emissive="#2a7fff"
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Antenna */}
      <mesh position={[0, SATELLITE_SIZE * 1.2, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.2, 8]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffaa00"
          emissiveIntensity={0.6}
          metalness={1}
          roughness={0.1}
        />
      </mesh>
      
      {/* Engine glow */}
      <pointLight
        color="#ff6b6b"
        intensity={2}
        distance={3}
        decay={2}
      />
    </group>
  );
};

// ============================================================================
// ORBITAL PATH VISUALIZATION
// ============================================================================
interface OrbitPathProps {
  radius: number;
  inclination?: number;
}

const OrbitPath = ({ radius, inclination = 0.3 }: OrbitPathProps) => {
  const points = useMemo(() => {
    const curvePoints = [];
    for (let i = 0; i <= 128; i++) {
      const t = (i / 128) * Math.PI * 2;
      const x = Math.cos(t) * radius;
      const z = Math.sin(t) * radius * Math.cos(inclination);
      const y = Math.sin(t) * radius * Math.sin(inclination);
      curvePoints.push([x, y, z] as [number, number, number]);
    }
    return curvePoints;
  }, [radius, inclination]);

  return (
    <Line
      points={points}
      color="#4a9eff"
      lineWidth={2}
      transparent
      opacity={0.3}
    />
  );
};

// ============================================================================
// FLOATING PARTICLES
// ============================================================================
interface ParticlesProps {
  count?: number;
}

const Particles = ({ count = 200 }: ParticlesProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, [count]);

  const positionAttribute = useMemo(
    () => new THREE.BufferAttribute(positions, 3),
    [positions]
  );

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry attach="geometry">
        <primitive
          attach="attributes-position"
          object={positionAttribute}
        />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={0.05}
        color="#ffffff"
        sizeAttenuation
      />
    </points>
  );
};

// ============================================================================
// CAMERA RIG WITH MOUSE FOLLOWING
// ============================================================================
interface CameraRigProps {
  mousePos: THREE.Vector2;
}

const CameraRig = ({ mousePos }: CameraRigProps) => {
  const { camera } = useThree();
  
  useFrame(() => {
    // Smooth camera movement based on mouse position
    const targetX = mousePos.x * 0.5;
    const targetY = mousePos.y * 0.5 + 3;
    const targetZ = 8 + mousePos.x * 0.3;
    
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.02);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.02);
    camera.lookAt(0, 0, 0);
  });

  return null;
};

// ============================================================================
// MAIN 3D SCENE
// ============================================================================
interface SpaceSceneProps {
  mousePos: THREE.Vector2;
}

const SpaceScene = ({ mousePos }: SpaceSceneProps) => {
  const [time, setTime] = useState(0);

  useFrame((state) => {
    setTime(state.clock.elapsedTime);
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4a9eff" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.5}
        penumbra={1}
        intensity={2}
        castShadow
      />
      
      <CameraRig mousePos={mousePos} />
      <Starfield mousePos={mousePos} />
      <Particles count={300} />
      
      <Float
        speed={2}
        rotationIntensity={0.5}
        floatIntensity={0.3}
      >
        <Earth />
      </Float>
      
      <OrbitPath radius={ORBIT_RADIUS} inclination={0.3} />
      <Satellite time={time} orbitRadius={ORBIT_RADIUS} speed={0.4} inclination={0.3} />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        minDistance={5}
        maxDistance={12}
      />
    </>
  );
};

// ============================================================================
// TYPEWRITER EFFECT HOOK
// ============================================================================
const useTypewriter = (text: string, speed: number = 50, delay: number = 500) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started || currentIndex >= text.length) return;

    const timeout = setTimeout(() => {
      setDisplayText(text.slice(0, currentIndex + 1));
      setCurrentIndex(currentIndex + 1);
    }, speed);

    return () => clearTimeout(timeout);
  }, [currentIndex, started, text, speed]);

  return displayText;
};

// ============================================================================
// ANIMATED CARD COMPONENT
// ============================================================================
interface AnimatedCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  onClick: () => void;
  gradient: string;
  delay: number;
}

const AnimatedCard = ({
  icon,
  title,
  description,
  features,
  buttonText,
  onClick,
  gradient,
  delay,
}: AnimatedCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <Card
      ref={cardRef}
      shadow="xl"
      radius="xl"
      padding="xl"
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        border: `1px solid rgba(255, 255, 255, 0.15)`,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.95)',
        opacity: isVisible ? 1 : 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 20px 60px ${gradient.replace('linear-gradient', 'rgba').replace(/[\d%,]/g, (match) => {
          if (!isNaN(parseInt(match))) return match;
          return match;
        })}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
      }}
    >
      {/* Holographic border effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 'var(--card-radius)',
          background: gradient,
          opacity: 0.1,
          transition: 'opacity 0.3s ease',
          zIndex: -1,
        }}
      />
      
      <Group gap="sm" mb="md">
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: gradient,
            display: 'inline-flex',
          }}
        >
          {icon}
        </div>
        <Title order={2} style={{ fontSize: '26px', fontWeight: 700 }}>
          {title}
        </Title>
      </Group>
      
      <Text c="gray.3" mb="md" style={{ lineHeight: 1.7, fontSize: '15px' }}>
        {description}
      </Text>

      <Box mt="md" mb="xl">
        <Text fw={600} mb="xs" c="gray.2" style={{ fontSize: '14px' }}>
          🔬 Что можно исследовать:
        </Text>
        <ul style={{ paddingLeft: '20px', marginBottom: '0', color: '#b0b0b0' }}>
          {features.map((feature, index) => (
            <li key={index} style={{ marginBottom: '8px', lineHeight: 1.6 }}>
              <Text span size="sm">{feature}</Text>
            </li>
          ))}
        </ul>
      </Box>

      <Button
        rightSection={<IconArrowRight size={18} />}
        size="lg"
        fullWidth
        variant="gradient"
        gradient={{ from: gradient.split(',')[0].replace('linear-gradient(', ''), to: gradient.split(',')[1].split(')')[0] }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        style={{
          transition: 'all 0.3s ease',
          fontWeight: 600,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(5px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        {buttonText}
      </Button>
    </Card>
  );
};

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================
export default function LandingPage() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState(new THREE.Vector2());
  const [loaded, setLoaded] = useState(false);

  const mainTitle = useTypewriter(
    'Лабораторный практикум по механике космического полёта',
    40,
    300
  );

  const subTitle = useTypewriter(
    'Исследование возмущений в движении искусственных спутников Земли',
    35,
    2000
  );

  useEffect(() => {
    setLoaded(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePos(new THREE.Vector2(x, y));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Box style={{ 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 3D Background Scene */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}>
        <Canvas
          camera={{ position: [0, 3, 8], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <SpaceScene mousePos={mousePos} />
        </Canvas>
      </div>

      {/* Gradient overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, transparent 0%, rgba(10, 14, 23, 0.6) 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Main content */}
      <Container size="lg" style={{ position: 'relative', zIndex: 2, paddingTop: '60px', paddingBottom: '60px' }}>
        
        {/* Header Section */}
        <Card
          shadow="xl"
          radius="xl"
          mb="xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            padding: '40px 30px',
            transform: loaded ? 'translateY(0)' : 'translateY(-50px)',
            opacity: loaded ? 1 : 0,
            transition: 'all 0.8s ease-out',
            transitionDelay: '0.3s',
          }}
        >
          <Badge
            size="lg"
            variant="gradient"
            gradient={{ from: '#667eea', to: '#764ba2' }}
            mb="xl"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              padding: '12px 24px',
              borderRadius: '30px',
            }}
          >
            <IconRocket size={16} style={{ marginRight: '8px' }} />
            Научно-исследовательский проект
          </Badge>

          <Title
            order={1}
            mb="lg"
            style={{
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
              fontFamily: "'Exo 2', sans-serif",
              minHeight: '3.6em',
            }}
          >
            {mainTitle}
            <span style={{ animation: 'blink 1s infinite' }}>|</span>
          </Title>

          <Text
            size="xl"
            c="gray.3"
            style={{
              fontSize: 'clamp(18px, 3vw, 22px)',
              lineHeight: 1.6,
              maxWidth: '800px',
              margin: '0 auto',
              minHeight: '3.4em',
            }}
          >
            {subTitle}
          </Text>

          {/* Decorative elements */}
          <Group justify="center" gap="xl" mt="xl">
            <Group gap="xs">
              <IconPlanet size={24} color="#667eea" />
              <Text size="sm" c="gray.4">Гравитационное поле Земли</Text>
            </Group>
            <Group gap="xs">
              <IconMoon size={24} color="#764ba2" />
              <Text size="sm" c="gray.4">Лунные возмущения</Text>
            </Group>
            <Group gap="xs">
              <IconStar size={24} color="#f093fb" />
              <Text size="sm" c="gray.4">Орбитальная механика</Text>
            </Group>
          </Group>
        </Card>

        {/* Research Modules */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="xl" mb="xl">
          {/* Geopotential Module */}
          <AnimatedCard
            icon={<IconSatellite size={32} color="#ffffff" />}
            title="Нецентральность гравитационного поля"
            description="Изучение влияния нецентральности гравитационного поля Земли на движение ИСЗ. Анализ гармонических разложений геопотенциала и их влияния на орбитальные элементы."
            features={[
              'Возмущающие ускорения от гармоник геопотенциала',
              'Влияние зональных и секториальных гармоник',
              'Эволюцию орбитальных элементов',
              'Сравнение моделей J₂-only и полной модели',
            ]}
            buttonText="Перейти к исследованию"
            onClick={() => navigate('/geopotential')}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            delay={500}
          />

          {/* Lunar Module */}
          <AnimatedCard
            icon={<IconMoon size={32} color="#ffffff" />}
            title="Лунные возмущения"
            description="Исследование гравитационного воздействия Луны на орбиту ИСЗ. Анализ влияния третьего тела на эволюцию орбитальных параметров спутника."
            features={[
              'Возмущения от притяжения Луны',
              'Изменение элементов орбиты под действием Луны',
              'Радиальную, трансверсальную и бинормальную составляющие',
              'Долгосрочную эволюцию орбиты',
            ]}
            buttonText="Перейти к исследованию"
            onClick={() => navigate('/lunar')}
            gradient="linear-gradient(135deg, #764ba2 0%, #f093fb 100%)"
            delay={700}
          />
        </SimpleGrid>

        {/* Info Cards Row */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
          <Card
            shadow="lg"
            radius="lg"
            padding="lg"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <IconRocket size={40} color="#667eea" style={{ marginBottom: '15px' }} />
            <Title order={4} mb="sm" c="white">Научная методология</Title>
            <Text size="sm" c="gray.4">
              Математическое моделирование и численное интегрирование уравнений движения
            </Text>
          </Card>

          <Card
            shadow="lg"
            radius="lg"
            padding="lg"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <IconSatellite size={40} color="#764ba2" style={{ marginBottom: '15px' }} />
            <Title order={4} mb="sm" c="white">Визуализация данных</Title>
            <Text size="sm" c="gray.4">
              Интерактивные 3D модели и графики для анализа результатов
            </Text>
          </Card>

          <Card
            shadow="lg"
            radius="lg"
            padding="lg"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <IconStar size={40} color="#f093fb" style={{ marginBottom: '15px' }} />
            <Title order={4} mb="sm" c="white">Точные расчёты</Title>
            <Text size="sm" c="gray.4">
              Высокая точность вычислений с использованием современных методов
            </Text>
          </Card>
        </SimpleGrid>

        {/* Footer */}
        <Card
          shadow="xl"
          radius="xl"
          mt="xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            padding: '30px',
          }}
        >
          <Text c="gray.3" size="lg" mb="md" style={{ fontWeight: 600 }}>
            Российский университет дружбы народов имени Патриса Лумумбы
          </Text>
          <Text c="gray.4" size="md">
            Кафедра механики и процессов управления
          </Text>
          <Group justify="center" gap="lg" mt="lg">
            <Badge variant="light" color="blue" size="sm">
              Механика космического полёта
            </Badge>
            <Badge variant="light" color="violet" size="sm">
              Орбитальная динамика
            </Badge>
            <Badge variant="light" color="pink" size="sm">
              Возмущающие ускорения
            </Badge>
          </Group>
        </Card>
      </Container>

      {/* CSS Animations */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;800&display=swap');
      `}</style>
    </Box>
  );
}
