import { Card, Text, Title, SimpleGrid, Group, Box, Divider } from '@mantine/core';
import { IconPlanet, IconFocusCentered, IconCircle, IconRotate, IconCompass, IconMap2 } from '@tabler/icons-react';

interface LunarElementsTabProps {
  points: any[];
}

export default function LunarElementsTab({ points }: LunarElementsTabProps) {
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
          🛰 Нажмите "Рассчитать" для получения данных
        </Text>
      </Card>
    );
  }

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  // Calculate changes in orbital elements
  const deltaOmega = (lastPoint.orbitalElements.Omega - firstPoint.orbitalElements.Omega) * (180 / Math.PI);
  const deltaI = (lastPoint.orbitalElements.i - firstPoint.orbitalElements.i) * (180 / Math.PI);
  const deltaP = lastPoint.orbitalElements.p - firstPoint.orbitalElements.p;
  const deltaE = lastPoint.orbitalElements.e - firstPoint.orbitalElements.e;
  const deltaOmega_arg = (lastPoint.orbitalElements.omega - firstPoint.orbitalElements.omega) * (180 / Math.PI);
  const deltaA = lastPoint.orbitalElements.a - firstPoint.orbitalElements.a;

  const formatDelta = (value: number, unit: string) => {
    const absValue = Math.abs(value);
    let color: string;
    let icon: string;
    
    if (absValue < 0.001) {
      color = '#51cf66';
      icon = '→';
    } else if (value > 0) {
      color = '#ff6b6b';
      icon = '↗';
    } else {
      color = '#4dabf7';
      icon = '↘';
    }
    
    return (
      <Text size="xs" style={{ color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>{icon}</span>
        <span>Δ: {Math.abs(value).toFixed(unit === 'град' ? 6 : unit === '' ? 8 : 4)} {unit}</span>
      </Text>
    );
  };

  const elementCards = [
    {
      icon: IconPlanet,
      title: 'Большая полуось a',
      value: lastPoint.orbitalElements.a.toFixed(2),
      unit: 'км',
      delta: deltaA,
      deltaUnit: 'км',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #fa5252 100%)',
      description: 'Среднее расстояние от центра Земли',
    },
    {
      icon: IconFocusCentered,
      title: 'Фокальный параметр p',
      value: lastPoint.orbitalElements.p.toFixed(2),
      unit: 'км',
      delta: deltaP,
      deltaUnit: 'км',
      gradient: 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)',
      description: 'Расстояние от фокуса до орбиты',
    },
    {
      icon: IconCircle,
      title: 'Эксцентриситет e',
      value: lastPoint.orbitalElements.e.toFixed(6),
      unit: '',
      delta: deltaE,
      deltaUnit: '',
      gradient: 'linear-gradient(135deg, #ffa94d 0%, #ff922b 100%)',
      description: 'Мера вытянутости орбиты',
    },
    {
      icon: IconCompass,
      title: 'Наклонение i',
      value: (lastPoint.orbitalElements.i * 180 / Math.PI).toFixed(4),
      unit: 'град',
      delta: deltaI,
      deltaUnit: 'град',
      gradient: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
      description: 'Угол наклона к экватору',
    },
    {
      icon: IconRotate,
      title: 'Долгота узла Ω',
      value: (lastPoint.orbitalElements.Omega * 180 / Math.PI).toFixed(4),
      unit: 'град',
      delta: deltaOmega,
      deltaUnit: 'град',
      gradient: 'linear-gradient(135deg, #63e6be 0%, #38d9a9 100%)',
      description: 'Положение восходящего узла',
    },
    {
      icon: IconMap2,
      title: 'Аргумент перицентра ω',
      value: (lastPoint.orbitalElements.omega * 180 / Math.PI).toFixed(4),
      unit: 'град',
      delta: deltaOmega_arg,
      deltaUnit: 'град',
      gradient: 'linear-gradient(135deg, #da77f2 0%, #be4bdb 100%)',
      description: 'Ориентация орбиты в плоскости',
    },
  ];

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
          🌌 Элементы орбиты ИСЗ
        </Title>
        <Text c="gray.4" size="lg">
          Результаты интегрирования уравнений возмущённого движения
        </Text>
      </Box>

      {/* Element Cards Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mb="xl">
        {elementCards.map((element, index) => (
          <Card
            key={index}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderRadius: '16px',
              padding: '20px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(102, 126, 234, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            {/* Gradient overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: element.gradient,
              }}
            />
            
            {/* Icon and Title */}
            <Group gap="sm" mb="md">
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: element.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <element.icon size={24} color="white" />
              </div>
              <div>
                <Text size="sm" c="gray.4" fw={500}>
                  {element.title}
                </Text>
                <Text 
                  size="xl" 
                  fw={700}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 'clamp(20px, 3vw, 26px)',
                    background: element.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {element.value} <span style={{ fontSize: '0.7em', opacity: 0.7 }}>{element.unit}</span>
                </Text>
              </div>
            </Group>
            
            {/* Delta */}
            {formatDelta(element.delta, element.deltaUnit)}
            
            {/* Description */}
            <Text size="xs" c="gray.5" mt="sm">
              {element.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Analysis Section */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
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
            <IconPlanet size={20} color="white" />
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            Физическая интерпретация результатов
          </Title>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Box>
            <Text size="sm" mb="xs" style={{ color: '#ff6b6b', fontWeight: 600 }}>
              🔴 Долгота восходящего узла (Ω)
            </Text>
            <Text size="sm" c="gray.3" mb="md" lh={1.6}>
              Прецессия узла орбиты вызвана бинормальной составляющей W возмущающего ускорения от притяжения Луны. 
              Скорость прецессии зависит от взаимной ориентации орбит спутника и Луны.
            </Text>
            
            <Text size="sm" mb="xs" style={{ color: '#4dabf7', fontWeight: 600 }}>
              🔵 Наклонение (i)
            </Text>
            <Text size="sm" c="gray.3" mb="md" lh={1.6}>
              Периодические изменения наклонения также определяются W-составляющей. 
              Амплитуда зависит от аргумента широты u = ω + ϑ.
            </Text>
            
            <Text size="sm" mb="xs" style={{ color: '#ffd43b', fontWeight: 600 }}>
              🟡 Эксцентриситет (e)
            </Text>
            <Text size="sm" c="gray.3" mb="md" lh={1.6}>
              Изменяется под действием радиальной S и трансверсальной T составляющих,
              что приводит к периодическому изменению формы орбиты.
            </Text>
          </Box>
          
          <Box>
            <Text size="sm" mb="xs" style={{ color: '#da77f2', fontWeight: 600 }}>
              🟣 Аргумент перицентра (ω)
            </Text>
            <Text size="sm" c="gray.3" mb="md" lh={1.6}>
              Наиболее сложное поведение — зависит от всех трёх составляющих (S, T, W).
              Вызывает вращение линии апсид в плоскости орбиты.
            </Text>
            
            <Divider my="md" style={{ background: 'rgba(255,255,255,0.1)' }} />
            
            <Text size="sm" c="gray.4" mb="xs" fw={600}>
              📊 Диапазон изменений за период:
            </Text>
            <SimpleGrid cols={2} spacing="xs">
              <Box>
                <Text size="xs" c="gray.5">ΔΩ =</Text>
                <Text size="sm" c={deltaOmega > 0 ? 'red.4' : deltaOmega < 0 ? 'blue.4' : 'gray.4'} fw={600}>
                  {deltaOmega > 0 ? '+' : ''}{deltaOmega.toFixed(6)}°
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="gray.5">Δi =</Text>
                <Text size="sm" c={deltaI > 0 ? 'red.4' : deltaI < 0 ? 'blue.4' : 'gray.4'} fw={600}>
                  {deltaI > 0 ? '+' : ''}{deltaI.toFixed(6)}°
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="gray.5">Δe =</Text>
                <Text size="sm" c={deltaE > 0 ? 'red.4' : deltaE < 0 ? 'blue.4' : 'gray.4'} fw={600}>
                  {deltaE > 0 ? '+' : ''}{deltaE.toExponential(4)}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="gray.5">Δω =</Text>
                <Text size="sm" c={deltaOmega_arg > 0 ? 'red.4' : deltaOmega_arg < 0 ? 'blue.4' : 'gray.4'} fw={600}>
                  {deltaOmega_arg > 0 ? '+' : ''}{deltaOmega_arg.toFixed(6)}°
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
        </SimpleGrid>
      </Card>
    </div>
  );
}
