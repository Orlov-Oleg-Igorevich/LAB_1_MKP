import { Card, Text, Title, SimpleGrid, Group, Badge, Box, Divider, Progress } from '@mantine/core';
import { IconArrowUp, IconArrowRight, IconArrowLeft, IconTrendingUp } from '@tabler/icons-react';

interface LunarAccelerationTabProps {
  points: any[];
}

export default function LunarAccelerationTab({ points }: LunarAccelerationTabProps) {
  if (!points || points.length === 0) {
    return (
      <Card 
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center',
        }}
      >
        <Text c="gray.4" size="lg">
          🚀 Нажмите "Рассчитать" для получения данных об ускорениях
        </Text>
      </Card>
    );
  }

  // Calculate statistics
  const stats = {
    S: {
      min: Math.min(...points.map(p => p.acceleration.S)),
      max: Math.max(...points.map(p => p.acceleration.S)),
      avg: points.reduce((sum, p) => sum + p.acceleration.S, 0) / points.length,
      rms: Math.sqrt(points.reduce((sum, p) => sum + p.acceleration.S ** 2, 0) / points.length),
    },
    T: {
      min: Math.min(...points.map(p => p.acceleration.T)),
      max: Math.max(...points.map(p => p.acceleration.T)),
      avg: points.reduce((sum, p) => sum + p.acceleration.T, 0) / points.length,
      rms: Math.sqrt(points.reduce((sum, p) => sum + p.acceleration.T ** 2, 0) / points.length),
    },
    W: {
      min: Math.min(...points.map(p => p.acceleration.W)),
      max: Math.max(...points.map(p => p.acceleration.W)),
      avg: points.reduce((sum, p) => sum + p.acceleration.W, 0) / points.length,
      rms: Math.sqrt(points.reduce((sum, p) => sum + p.acceleration.W ** 2, 0) / points.length),
    },
    total: {
      min: Math.min(...points.map(p => p.acceleration.total)),
      max: Math.max(...points.map(p => p.acceleration.total)),
      avg: points.reduce((sum, p) => sum + p.acceleration.total, 0) / points.length,
      rms: Math.sqrt(points.reduce((sum, p) => sum + p.acceleration.total ** 2, 0) / points.length),
    },
  };

  // Determine dominant component
  const components = [
    { name: 'S', rms: Math.abs(stats.S.rms), color: '#ff6b6b' },
    { name: 'T', rms: Math.abs(stats.T.rms), color: '#4dabf7' },
    { name: 'W', rms: Math.abs(stats.W.rms), color: '#69db7c' },
  ];
  const dominantComponent = components.reduce((max, curr) => curr.rms > max.rms ? curr : max);

  const accelerationCards = [
    {
      name: 'Радиальная S',
      icon: IconArrowUp,
      description: 'Направлена вдоль радиус-вектора от Земли',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
      glowColor: 'rgba(255, 107, 107, 0.3)',
      stats: stats.S,
      unit: 'м/с²',
      physicalMeaning: 'Влияет на величину большой полуоси и эксцентриситет',
    },
    {
      name: 'Трансверсальная T',
      icon: IconArrowRight,
      description: 'Действует перпендикулярно радиус-вектору в плоскости орбиты',
      gradient: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
      glowColor: 'rgba(77, 171, 247, 0.3)',
      stats: stats.T,
      unit: 'м/с²',
      physicalMeaning: 'Изменяет орбитальную скорость и вызывает прецессию перицентра',
    },
    {
      name: 'Бинормальная W',
      icon: IconArrowLeft,
      description: 'Направлена перпендикулярно плоскости орбиты',
      gradient: 'linear-gradient(135deg, #69db7c 0%, #51cf66 100%)',
      glowColor: 'rgba(105, 219, 124, 0.3)',
      stats: stats.W,
      unit: 'м/с²',
      physicalMeaning: 'Изменяет наклонение орбиты и вызывает прецессию узла Ω',
    },
    {
      name: 'Полное ускорение |a|',
      icon: IconTrendingUp,
      description: 'Векторная сумма всех составляющих',
      gradient: 'linear-gradient(135deg, #ffd43b 0%, #ffa94d 100%)',
      glowColor: 'rgba(255, 212, 59, 0.3)',
      stats: stats.total,
      unit: 'м/с²',
      physicalMeaning: 'Общая величина лунного возмущения',
    },
  ];

  const formatExp = (num: number) => {
    const absNum = Math.abs(num);
    if (absNum < 0.001 && num !== 0) {
      return num.toExponential(3);
    }
    return num.toFixed(6);
  };

  const getSignIcon = (value: number) => {
    if (value > 0) return '↗ +';
    if (value < 0) return '↘ −';
    return '→ 0';
  };

  const getSignColor = (value: number) => {
    if (value > 0) return '#ff6b6b';
    if (value < 0) return '#4dabf7';
    return '#868e96';
  };

  return (
    <div>
      {/* Header */}
      <Box mb="xl">
        <Title 
          order={3} 
          style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
          }}
        >
          🚀 Возмущающие ускорения от притяжения Луны
        </Title>
        <Text c="gray.4" size="lg">
          Три составляющие возмущающего ускорения в орбитальной системе координат
        </Text>
      </Box>

      {/* Dominant Component Badge */}
      <Box mb="xl">
        <Card
          style={{
            background: `linear-gradient(135deg, ${dominantComponent.color}20 0%, ${dominantComponent.color}40 100%)`,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${dominantComponent.color}60`,
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <Group gap="sm">
            <Badge 
              size="lg" 
              variant="gradient"
              gradient={{ from: dominantComponent.color, to: `${dominantComponent.color}cc` }}
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              🎯 Доминирующая компонента
            </Badge>
            <Text size="lg" fw={600} style={{ color: dominantComponent.color }}>
              {dominantComponent.name} ({dominantComponent.name === 'S' ? 'радиальная' : dominantComponent.name === 'T' ? 'трансверсальная' : 'бинормальная'})
            </Text>
            <Text size="sm" c="gray.4">
              RMS = {formatExp(dominantComponent.rms)} м/с²
            </Text>
          </Group>
        </Card>
      </Box>

      {/* Acceleration Cards Grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb="xl">
        {accelerationCards.map((accel, index) => (
          <Card
            key={index}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderRadius: '16px',
              padding: '24px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 12px 48px ${accel.glowColor}`;
              e.currentTarget.style.borderColor = accel.gradient.replace('linear-gradient', 'rgba').replace(/[\d%,#]/g, '') + '0.5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            {/* Gradient overlay on hover */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at top right, ${accel.gradient.replace('linear-gradient(', '').replace(')', '')}15 0%, transparent 70%)`,
                opacity: 0,
                transition: 'opacity 0.3s ease',
              }}
              onMouseEnter={(e) => {
                const parent = e.currentTarget.parentElement as HTMLElement;
                if (parent) {
                  (parent.firstChild as HTMLElement).style.opacity = '1';
                }
              }}
            />
            
            {/* Icon and Title */}
            <Group gap="md" mb="lg">
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: accel.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 6px 20px ${accel.glowColor}`,
                }}
              >
                <accel.icon size={28} color="white" strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <Text size="lg" fw={700} style={{ fontSize: '18px' }}>
                  {accel.name}
                </Text>
                <Text size="xs" c="gray.4" lh={1.4}>
                  {accel.description}
                </Text>
              </div>
            </Group>
            
            {/* Statistics */}
            <SimpleGrid cols={2} spacing="sm" mb="md">
              <Box>
                <Text size="xs" c="gray.5" mb="xs">Минимум</Text>
                <Text 
                  size="sm" 
                  fw={700}
                  style={{ 
                    fontFamily: "'JetBrains Mono', monospace",
                    color: accel.stats.min < 0 ? '#ff6b6b' : '#51cf66',
                  }}
                >
                  {formatExp(accel.stats.min)} {accel.unit}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="gray.5" mb="xs">Максимум</Text>
                <Text 
                  size="sm" 
                  fw={700}
                  style={{ 
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#51cf66',
                  }}
                >
                  {formatExp(accel.stats.max)} {accel.unit}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="gray.5" mb="xs">Среднее</Text>
                <Text 
                  size="sm" 
                  fw={700}
                  style={{ 
                    fontFamily: "'JetBrains Mono', monospace",
                    color: getSignColor(accel.stats.avg),
                  }}
                >
                  {getSignIcon(accel.stats.avg)} {formatExp(Math.abs(accel.stats.avg))} {accel.unit}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="gray.5" mb="xs">RMS</Text>
                <Text 
                  size="sm" 
                  fw={700}
                  style={{ 
                    fontFamily: "'JetBrains Mono', monospace",
                    background: accel.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {formatExp(accel.stats.rms)} {accel.unit}
                </Text>
              </Box>
            </SimpleGrid>
            
            {/* Physical Meaning */}
            <Divider my="sm" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <Text size="xs" c="gray.4" mt="sm" lh={1.5}>
              💡 <Text span fw={600}>Физический смысл:</Text> {accel.physicalMeaning}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Methodology Section */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: 'xl',
        }}
      >
        <Group gap="sm" mb="lg">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '20px' }}>📐</span>
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            Методика расчёта возмущающих ускорений
          </Title>
        </Group>
        
        <Box 
          style={{
            background: 'rgba(10, 14, 23, 0.5)',
            borderRadius: '12px',
            padding: '20px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            marginBottom: 'md',
          }}
        >
          <Text c="gray.3" mb="xs">a = -μₗ [ρ/ρ³ + r₁₂/r₁₂³]</Text>
          <Text size="xs" c="gray.5">
            где μₗ = 4902.8 км³/с² — гравитационный параметр Луны
          </Text>
        </Box>
        
        <Text size="sm" c="gray.3" mb="md" lh={1.6}>
          Согласно методике ЛР2, возмущающее ускорение вычисляется как разность сил притяжения Луны к спутнику и к Земле.
        </Text>
        
        <Title order={5} mb="md" style={{ fontSize: '16px', color: '#667eea' }}>
          Проекции на орбитальную систему координат:
        </Title>
        
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Box
            style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <Text size="sm" fw={700} c="#ff6b6b" mb="xs">S = Fₓ·cos(ϑ) + Fᵧ·sin(ϑ)</Text>
            <Text size="xs" c="gray.4">радиальная составляющая</Text>
          </Box>
          
          <Box
            style={{
              background: 'rgba(77, 171, 247, 0.1)',
              border: '1px solid rgba(77, 171, 247, 0.3)',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <Text size="sm" fw={700} c="#4dabf7" mb="xs">T = -Fₓ·sin(ϑ) + Fᵧ·cos(ϑ)</Text>
            <Text size="xs" c="gray.4">трансверсальная составляющая</Text>
          </Box>
          
          <Box
            style={{
              background: 'rgba(105, 219, 124, 0.1)',
              border: '1px solid rgba(105, 219, 124, 0.3)',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <Text size="sm" fw={700} c="#69db7c" mb="xs">W = Fᵤ</Text>
            <Text size="xs" c="gray.4">бинормальная составляющая</Text>
          </Box>
        </SimpleGrid>
      </Card>

      {/* Comparison with Earth's gravity */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '32px',
        }}
      >
        <Group gap="sm" mb="lg">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ffd43b 0%, #ffa94d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '20px' }}>⚖️</span>
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            Сравнение с земным притяжением
          </Title>
        </Group>
        
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          <Box>
            <Text size="sm" c="gray.4" mb="xs">Ускорение свободного падения на Земле</Text>
            <Text size="xl" fw={700} c="gray.2">
              9.81 м/с²
            </Text>
          </Box>
          
          <Box>
            <Text size="sm" c="gray.4" mb="xs">Максимальное лунное ускорение</Text>
            <Text 
              size="xl" 
              fw={700}
              style={{
                background: 'linear-gradient(135deg, #ffd43b 0%, #ffa94d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {formatExp(stats.total.max)} м/с²
            </Text>
          </Box>
          
          <Box>
            <Text size="sm" c="gray.4" mb="xs">Отношение</Text>
            <Text 
              size="xl" 
              fw={700}
              c={stats.total.max / 9.81 < 0.001 ? 'green.4' : stats.total.max / 9.81 < 0.01 ? 'yellow.4' : 'orange.4'}
            >
              {(stats.total.max / 9.81).toExponential(2)} × g
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              ≈ 1/{Math.round(9.81 / stats.total.max)} от земного
            </Text>
          </Box>
        </SimpleGrid>
        
        <Progress 
          value={(stats.total.max / 9.81) * 100} 
          mt="lg"
          size="xl"
          color="#ffd43b"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <Text size="xs" c="gray.5" mt="xs" ta="center">
          Визуализация относительной величины лунного возмущения
        </Text>
      </Card>
    </div>
  );
}
