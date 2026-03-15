import { Card, Text, SimpleGrid, Group, Box, Badge, Title, Divider } from '@mantine/core';
import Plot from 'react-plotly.js';
import { useCallback, useMemo } from 'react';
import type { OrbitPoint } from '@lab/shared';
import { IconChartArea, IconSphere, IconTarget } from '@tabler/icons-react';

interface AnomalyTabProps {
  points: OrbitPoint[];
  perigee: OrbitPoint | null;
  apogee: OrbitPoint | null;
  coordinateSystem: 'ECI' | 'ECEF';
  onPlotRef?: (name: string, ref: any) => void;
}

export default function AnomalyTab({ points, perigee, apogee, coordinateSystem, onPlotRef }: AnomalyTabProps) {
  const heights = points.map((p) => p.height);
  const total = points.map((p) => p.acceleration.total);
  const Svals = points.map((p) => p.acceleration.S);
  const Tvals = points.map((p) => p.acceleration.T);
  const Wvals = points.map((p) => p.acceleration.W);
  const thetaDeg = points.map((p) => (p.theta * 180) / Math.PI);

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

  // Callback ref to get the underlying div element from Plot component
  const handlePlot1Ref = useCallback((node: any) => {
    if (node && node.el) {
      onPlotRef?.('anomaly-1', node.el);
    }
  }, [onPlotRef]);

  const handlePlot2Ref = useCallback((node: any) => {
    if (node && node.el) {
      onPlotRef?.('anomaly-2', node.el);
    }
  }, [onPlotRef]);

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
        
        <Plot
          ref={handlePlot1Ref}
          data={[
            { x: thetaDeg, y: Svals, type: 'scatter', mode: 'lines', name: 'S(θ)', line: { color: '#ff6b6b', width: 2.5 } },
            { x: thetaDeg, y: Tvals, type: 'scatter', mode: 'lines', name: 'T(θ)', line: { color: '#4dabf7', width: 2.5 } },
            { x: thetaDeg, y: Wvals, type: 'scatter', mode: 'lines', name: 'W(θ)', line: { color: '#69db7c', width: 2.5 } },
            {
              x: thetaDeg,
              y: total,
              type: 'scatter',
              mode: 'lines',
              name: '|j(θ)|',
              line: { color: '#ffd43b', width: 3 },
            },
            ...(perigee && apogee ? [{
              x: [(perigee.theta * 180) / Math.PI, (apogee.theta * 180) / Math.PI],
              y: [perigee.acceleration.total, apogee.acceleration.total],
              mode: 'text+markers' as const,
              type: 'scatter' as const,
              name: 'Перицентр / Апоцентр',
              text: ['Перицентр', 'Апоцентр'],
              textposition: 'top center' as const,
              marker: { color: ['#ff6b6b', '#4dabf7'], size: 10 },
              showlegend: true,
            }] : []),
          ]}
          layout={{
            autosize: true,
            height: Math.max(320, window.innerHeight * 0.3),
            margin: { l: 50, r: 10, t: 10, b: 40 },
            xaxis: { title: { text: 'θ, град' }, gridcolor: 'rgba(255,255,255,0.1)' },
            yaxis: { title: { text: 'ускорение, м/с²' }, gridcolor: 'rgba(255,255,255,0.1)' },
            legend: { orientation: 'h', bgcolor: 'rgba(0,0,0,0.3)' },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#888' },
          }}
          style={{ width: '100%' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </Card>

      {/* 3D Trajectory Plot Card */}
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
              background: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSphere size={20} color="white" />
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            Траектория в координатах (θ, h, |j|)
          </Title>
        </Group>
        
        <Text size="sm" c="gray.4" mb="md" lh={1.6}>
          Объединяет зависимость по высоте и по положению на орбите: наглядная линия, окрашенная по
          величине |j|. Расчёт выполнен в системе координат:{' '}
          <Text span fw={700} c="#667eea">{coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}</Text>
        </Text>
        
        <Plot
          ref={handlePlot2Ref}
          data={[
            {
              x: thetaDeg,
              y: heights,
              z: total,
              type: 'scatter3d',
              mode: 'lines+markers',
              name: '|j|',
              marker: {
                color: total,
                colorscale: 'Viridis',
                showscale: true,
                size: 2,
                colorbar: { 
                  title: '|j|, м/с²',
                  tickfont: { color: '#888' },
                  titlefont: { color: '#888' },
                },
              },
              line: {
                color: total,
                colorscale: 'Viridis',
                width: 4,
              },
            } as any,
          ]}
          layout={{
            autosize: true,
            height: Math.max(420, window.innerHeight * 0.4),
            margin: { l: 0, r: 0, t: 10, b: 0 },
            scene: {
              xaxis: { 
                title: { text: 'θ, град' },
                gridcolor: 'rgba(255,255,255,0.1)',
                tickfont: { color: '#888' },
              },
              yaxis: { 
                title: { text: 'h, км' },
                gridcolor: 'rgba(255,255,255,0.1)',
                tickfont: { color: '#888' },
              },
              zaxis: { 
                title: { text: '|j|, м/с²' },
                gridcolor: 'rgba(255,255,255,0.1)',
                tickfont: { color: '#888' },
              },
              bgcolor: 'rgba(0,0,0,0)',
            },
          }}
          style={{ width: '100%' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </Card>

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
