import { Card, Text, SimpleGrid, Group, Box, Badge, Title, Divider } from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import type { OrbitPoint } from '@lab/shared';
import { IconChartArea, IconTarget } from '@tabler/icons-react';

interface AnomalyTabProps {
  points: OrbitPoint[];
  perigee: OrbitPoint | null;
  apogee: OrbitPoint | null;
  coordinateSystem: 'ECI' | 'ECEF';
}

export default function AnomalyTab({ points, coordinateSystem }: AnomalyTabProps) {
  // const heights = points.map((p) => p.height);
  const total = points.map((p) => p.acceleration.total);
  const Svals = points.map((p) => p.acceleration.S);
  const Tvals = points.map((p) => p.acceleration.T);
  const Wvals = points.map((p) => p.acceleration.W);
  const thetaDeg = points.map((p) => (p.theta * 180) / Math.PI);

  // Prepare chart data for acceleration vs true anomaly
  const anomalyChartData = useMemo(() => {
    return points.map((p, idx) => ({
      theta_deg: thetaDeg[idx],
      height: p.height,
      S: p.acceleration.S,
      T: p.acceleration.T,
      W: p.acceleration.W,
      total: p.acceleration.total,
    }));
  }, [points, thetaDeg]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!points || points.length === 0) return null;

    const getStats = (arr: number[]) => ({
      min: Math.min(...arr),
      max: Math.max(...arr),
      avg: arr.reduce((sum, val) => sum + val, 0) / arr.length,
      rms: Math.sqrt(arr.reduce((sum, val) => sum + val ** 2, 0) / arr.length),
    });

    return {
      S: getStats(Svals),
      T: getStats(Tvals),
      W: getStats(Wvals),
      total: getStats(total),
    };
  }, [points, Svals, Tvals, Wvals, total]);

  // Determine dominant component
  const dominantComponent = useMemo(() => {
    if (!stats) return null;
    const components = [
      { name: 'S', rms: Math.abs(stats.S.rms), color: '#ff6b6b', fullName: 'радиальная' },
      { name: 'T', rms: Math.abs(stats.T.rms), color: '#4dabf7', fullName: 'трансверсальная' },
      { name: 'W', rms: Math.abs(stats.W.rms), color: '#69db7c', fullName: 'бинормальная' },
    ];
    return components.reduce((max, curr) => curr.rms > max.rms ? curr : max);
  }, [stats]);



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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card 
          p="sm" 
          style={{
            background: 'rgba(10, 14, 23, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            fontSize: '12px',
          }}
        >
          <Text fw={700} mb="xs" style={{ color: '#667eea' }}>
            Истинная аномалия: {Number(label).toFixed(1)}°
          </Text>
          {payload.map((entry: any, index: number) => (
            <Group key={index} gap="xs" mb="xs">
              <div 
                style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  background: entry.color 
                }} 
              />
              <Text span c="gray.3">{entry.name}:</Text>
              <Text span fw={700} style={{ fontFamily: "'JetBrains Mono', monospace", color: entry.color }}>
                {typeof entry.value === 'number' ? entry.value.toExponential(4) : entry.value}
              </Text>
            </Group>
          ))}
        </Card>
      );
    }
    return null;
  };

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
          📊 Нажмите "Рассчитать" для получения данных о возмущениях
        </Text>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
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
          🌍 Возмущения от истинной аномалии
        </Title>
        <Text c="gray.4" size="lg">
          Зависимость возмущающих ускорений от положения на орбите
        </Text>
      </Box>

      {/* Dominant Component Badge */}
      {dominantComponent && stats && (
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
                {dominantComponent.name} ({dominantComponent.fullName})
              </Text>
              <Text size="sm" c="gray.4">
                RMS = {formatExp(dominantComponent.rms)} м/с²
              </Text>
            </Group>
          </Card>
        </Box>
      )}

      {/* Acceleration Cards Grid */}
      {stats && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb="xl">
          {[
            {
              name: 'Радиальная S',
              icon: '↗',
              description: 'Направлена вдоль радиус-вектора от Земли',
              gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
              glowColor: 'rgba(255, 107, 107, 0.3)',
              stats: stats.S,
              unit: 'м/с²',
              physicalMeaning: 'Влияет на величину большой полуоси и эксцентриситет',
            },
            {
              name: 'Трансверсальная T',
              icon: '→',
              description: 'Действует перпендикулярно радиус-вектору в плоскости орбиты',
              gradient: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
              glowColor: 'rgba(77, 171, 247, 0.3)',
              stats: stats.T,
              unit: 'м/с²',
              physicalMeaning: 'Изменяет орбитальную скорость и вызывает прецессию перицентра',
            },
            {
              name: 'Бинормальная W',
              icon: '↖',
              description: 'Направлена перпендикулярно плоскости орбиты',
              gradient: 'linear-gradient(135deg, #69db7c 0%, #51cf66 100%)',
              glowColor: 'rgba(105, 219, 124, 0.3)',
              stats: stats.W,
              unit: 'м/с²',
              physicalMeaning: 'Изменяет наклонение орбиты и вызывает прецессию узла Ω',
            },
            {
              name: 'Полное ускорение |a|',
              icon: '★',
              description: 'Векторная сумма всех составляющих',
              gradient: 'linear-gradient(135deg, #ffd43b 0%, #ffa94d 100%)',
              glowColor: 'rgba(255, 212, 59, 0.3)',
              stats: stats.total,
              unit: 'м/с²',
              physicalMeaning: 'Общая величина возмущения от нецентральности поля',
            },
          ].map((accel, index) => (
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
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
            >
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
                    fontSize: '24px',
                  }}
                >
                  {accel.icon}
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
      )}

      {/* Main Plot Card - Acceleration vs True Anomaly */}
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
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconChartArea size={20} color="white" />
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            |j| и составляющие в функции истинной аномалии
          </Title>
        </Group>
        
        <Text size="sm" c="gray.4" mb="md" lh={1.6}>
          Зависимость возмущающего ускорения от положения на орбите (по истинной аномалии θ).
          Расчёт выполнен в системе координат:{' '}
          <Text span fw={700} c="#667eea">{coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}</Text>
        </Text>
        
        <ResponsiveContainer width="100%" height={Math.max(320, window.innerHeight * 0.3)}>
          <LineChart data={anomalyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="theta_deg"
              label={{ value: 'θ, град', position: 'insideBottom', offset: -5, fill: '#888' }}
              tick={{ fill: '#888', fontSize: 12 }}
              tickFormatter={(val: number) => val.toFixed(0)}
            />
            <YAxis
              label={{ value: 'ускорение, м/с²', angle: -90, position: 'insideLeft', fill: '#888' }}
              tick={{ fill: '#888', fontSize: 12 }}
              tickFormatter={(val: number) => val.toExponential(1)}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(255, 255, 255, 0.5)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '16px',
                fontSize: '13px',
              }}
            />
            <Line
              type="monotone"
              dataKey="S"
              stroke="#ff6b6b"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
              name="S (радиальная)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="T"
              stroke="#4dabf7"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
              name="T (трансверсальная)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="W"
              stroke="#69db7c"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
              name="W (бинормальная)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#ffd43b"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
              name="|j| (полное)"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      
      {/* Note: 3D trajectory plot removed - Recharts doesn't support 3D plots */}
      {/* For 3D visualization, please use the 3D Orbit tab */}

      {/* Methodology Section */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: 'xl',
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
            <IconTarget size={20} color="white" />
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            Методика расчёта возмущений
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
          <Text c="gray.3" mb="xs">
            a = -∇V(r, φ, λ) + μ/r²
          </Text>
          <Text size="xs" c="gray.5">
            где V — потенциал гравитационного поля Земли с учётом зональных и секториальных гармоник
          </Text>
        </Box>
        
        <Text size="sm" c="gray.3" mb="md" lh={1.6}>
          Согласно методике ЛР, возмущающее ускорение вычисляется как разность между реальным ускорением 
          от нецентрального гравитационного поля Земли и ускорением от центрального ньютоновского поля.
        </Text>
        
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
    </div>
  );
}
