import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, Text, Title, SimpleGrid, Badge, Group, Box, SegmentedControl, Divider } from '@mantine/core';
import { IconTarget, IconChartArea, IconArrowsExchange } from '@tabler/icons-react';

interface LunarComparisonTabProps {
  points: any[];
  orbit?: any;
}

// Simplified Kepler calculation for unperturbed orbit
const calculateUnperturbedOrbit = (points: any[], initialOrbit: any) => {
  if (!points || points.length === 0) return [];

  const mu = 398600.4418; // Earth gravitational parameter, km³/s²
  
  return points.map((p, idx) => {
    // For unperturbed orbit, elements remain constant
    const a = initialOrbit.a;
    const e = initialOrbit.e;
    const i = initialOrbit.i * Math.PI / 180;
    const Omega = initialOrbit.Omega * Math.PI / 180;
    const omega = initialOrbit.omega * Math.PI / 180;
    
    // Calculate mean anomaly at this time
    const n = Math.sqrt(mu / Math.pow(a, 3)); // Mean motion
    const M = initialOrbit.M * Math.PI / 180 + n * p.t;
    
    // Solve Kepler's equation for eccentric anomaly (simplified)
    let E = M;
    for (let iter = 0; iter < 10; iter++) {
      E = M + e * Math.sin(E);
    }
    
    // True anomaly
    const theta = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );
    
    // Radius
    const r = a * (1 - e * Math.cos(E));
    
    // Argument of latitude
    const u = omega + theta;
    
    return {
      index: idx,
      t: p.t,
      u_deg: u * 180 / Math.PI,
      Omega_deg: Omega * 180 / Math.PI,
      i_deg: i * 180 / Math.PI,
      e: e,
      omega_deg: omega * 180 / Math.PI,
      p: a * (1 - e * e),
      a: a,
      r: r,
      theta_deg: theta * 180 / Math.PI,
    };
  });
};

export default function LunarComparisonTab({ points, orbit }: LunarComparisonTabProps) {
  const [comparisonMode, setComparisonMode] = useState<'overlay' | 'split' | 'difference'>('overlay');

  // Calculate unperturbed orbit for comparison
  const unperturbedPoints = useMemo(() => {
    if (!points || points.length === 0 || !orbit) return [];
    return calculateUnperturbedOrbit(points, orbit);
  }, [points, orbit]);

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    if (!points || !unperturbedPoints || points.length !== unperturbedPoints.length) return [];

    return points.map((p, idx) => {
      const unperturbed = unperturbedPoints[idx];
      return {
        index: idx,
        t: p.t,
        t_hours: p.t / 3600,
        
        // Perturbed elements
        Omega_perturbed: p.orbitalElements.Omega * 180 / Math.PI,
        i_perturbed: p.orbitalElements.i * 180 / Math.PI,
        e_perturbed: p.orbitalElements.e,
        omega_perturbed: p.orbitalElements.omega * 180 / Math.PI,
        a_perturbed: p.orbitalElements.a,
        
        // Unperturbed elements
        Omega_unperturbed: unperturbed.Omega_deg,
        i_unperturbed: unperturbed.i_deg,
        e_unperturbed: unperturbed.e,
        omega_unperturbed: unperturbed.omega_deg,
        a_unperturbed: unperturbed.a,
        
        // Differences (perturbed - unperturbed)
        delta_Omega: (p.orbitalElements.Omega - unperturbed.Omega_deg * Math.PI / 180) * 180 / Math.PI,
        delta_i: (p.orbitalElements.i - unperturbed.i_deg * Math.PI / 180) * 180 / Math.PI,
        delta_e: p.orbitalElements.e - unperturbed.e,
        delta_omega: (p.orbitalElements.omega - unperturbed.omega_deg * Math.PI / 180) * 180 / Math.PI,
        delta_a: p.orbitalElements.a - unperturbed.a,
        
        // Radial difference
        r_perturbed: p.r,
        r_unperturbed: unperturbed.r,
        delta_r: p.r - unperturbed.r,
      };
    });
  }, [points, unperturbedPoints]);

  // Calculate statistics on differences
  const stats = useMemo(() => {
    if (!comparisonData || comparisonData.length === 0) return null;

    const maxDeltaOmega = Math.max(...comparisonData.map(d => Math.abs(d.delta_Omega)));
    const maxDeltaI = Math.max(...comparisonData.map(d => Math.abs(d.delta_i)));
    const maxDeltaE = Math.max(...comparisonData.map(d => Math.abs(d.delta_e)));
    const maxDeltaOmega_arg = Math.max(...comparisonData.map(d => Math.abs(d.delta_omega)));
    const maxDeltaA = Math.max(...comparisonData.map(d => Math.abs(d.delta_a)));
    const maxDeltaR = Math.max(...comparisonData.map(d => Math.abs(d.delta_r)));

    return {
      maxDeltaOmega,
      maxDeltaI,
      maxDeltaE,
      maxDeltaOmega_arg,
      maxDeltaA,
      maxDeltaR,
      finalDeltaOmega: comparisonData[comparisonData.length - 1].delta_Omega,
      finalDeltaI: comparisonData[comparisonData.length - 1].delta_i,
      finalDeltaE: comparisonData[comparisonData.length - 1].delta_e,
      finalDeltaOmega_arg: comparisonData[comparisonData.length - 1].delta_omega,
      finalDeltaA: comparisonData[comparisonData.length - 1].delta_a,
    };
  }, [comparisonData]);

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
          ⚖️ Нажмите "Рассчитать" для получения данных сравнения
        </Text>
      </Card>
    );
  }

  const formatNumber = (num: number, decimals: number = 6) => {
    const absNum = Math.abs(num);
    if (absNum < 0.0001 && num !== 0) {
      return num.toExponential(3);
    }
    return num.toFixed(decimals);
  };

  // Custom tooltip
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
            Время: {Number(label).toFixed(3)} ч
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
                {typeof entry.value === 'number' ? entry.value.toFixed(entry.name.includes('Δ') ? 6 : 4) : entry.value}
              </Text>
            </Group>
          ))}
        </Card>
      );
    }
    return null;
  };

  const chartGridStyle = { strokeDasharray: '3 3', stroke: 'rgba(255, 255, 255, 0.1)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
      {/* Header */}
      <Box>
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
          ⚖️ Сравнительный анализ: Возмущённая vs Невозмущённая орбита
        </Title>
        <Text c="gray.4" size="lg">
          Количественная оценка влияния лунных возмущений путём сравнения с решением задачи Кеплера
        </Text>
      </Box>

      {/* Methodology Card */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: 'xl',
        }}
      >
        <Group gap="sm" mb="md">
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
          <Title order={4} style={{ fontSize: '16px' }}>Цель и методика сравнения</Title>
        </Group>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Box>
            <Text size="sm" mb="xs" fw={600} c="#667eea">
              🎯 Цель:
            </Text>
            <Text size="sm" c="gray.3" lh={1.6}>
              Количественная оценка влияния лунных возмущений на орбитальные элементы спутника 
              путём сравнения с идеальной кеплеровской орбитой без возмущений.
            </Text>
          </Box>
          
          <Box>
            <Text size="sm" mb="xs" fw={600} c="#764ba2">
              🔬 Метод:
            </Text>
            <Text size="sm" c="gray.3" lh={1.6}>
              Сравниваются результаты численного интегрирования с учётом лунных возмущений 
              (возмущённая орбита) с аналитическим решением задачи Кеплера (невозмущённая орбита).
            </Text>
          </Box>
        </SimpleGrid>
      </Card>

      {/* Control Panel */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: 'xl',
        }}
      >
        <Group justify="space-between">
          <SegmentedControl
            value={comparisonMode}
            onChange={(value) => setComparisonMode(value as any)}
            data={[
              { label: '📊 Наложение', value: 'overlay' },
              { label: '📈 Раздельно', value: 'split' },
              { label: '📉 Разница', value: 'difference' },
            ]}
            style={{
              background: 'rgba(10, 14, 23, 0.5)',
              borderRadius: '10px',
            }}
          />
          
          <Badge variant="light" color="violet" size="lg">
            ⏱ {(points[points.length - 1].t / 3600).toFixed(2)} ч
          </Badge>
        </Group>
      </Card>

      {/* Summary Statistics */}
      {stats && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mb="xl">
          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="gray.4">ΔΩ (узел)</Text>
              <Badge 
                size="lg" 
                variant="gradient"
                gradient={{ from: '#ff6b6b', to: '#ee5a6f' }}
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                Max
              </Badge>
            </Group>
            <Text
              size="xl"
              fw={700}
              c="#ff6b6b"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(20px, 3vw, 26px)',
              }}
            >
              {formatNumber(stats.maxDeltaOmega, 6)}°
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              Финальное: {formatNumber(stats.finalDeltaOmega, 6)}°
            </Text>
          </Card>

          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="gray.4">Δi (наклонение)</Text>
              <Badge 
                size="lg" 
                variant="gradient"
                gradient={{ from: '#ffa94d', to: '#ff922b' }}
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                Max
              </Badge>
            </Group>
            <Text
              size="xl"
              fw={700}
              c="#ffa94d"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(20px, 3vw, 26px)',
              }}
            >
              {formatNumber(stats.maxDeltaI, 6)}°
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              Финальное: {formatNumber(stats.finalDeltaI, 6)}°
            </Text>
          </Card>

          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="gray.4">Δe (эксцентриситет)</Text>
              <Badge 
                size="lg" 
                variant="gradient"
                gradient={{ from: '#ffd43b', to: '#fcc419' }}
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                Max
              </Badge>
            </Group>
            <Text
              size="xl"
              fw={700}
              c="#ffd43b"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(20px, 3vw, 26px)',
              }}
            >
              {formatNumber(stats.maxDeltaE, 8)}
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              Финальное: {formatNumber(stats.finalDeltaE, 8)}
            </Text>
          </Card>

          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="gray.4">Δω (перицентр)</Text>
              <Badge 
                size="lg" 
                variant="gradient"
                gradient={{ from: '#da77f2', to: '#be4bdb' }}
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                Max
              </Badge>
            </Group>
            <Text
              size="xl"
              fw={700}
              c="#da77f2"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(20px, 3vw, 26px)',
              }}
            >
              {formatNumber(stats.maxDeltaOmega_arg, 6)}°
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              Финальное: {formatNumber(stats.finalDeltaOmega_arg, 6)}°
            </Text>
          </Card>

          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="gray.4">Δa (большая полуось)</Text>
              <Badge 
                size="lg" 
                variant="gradient"
                gradient={{ from: '#51cf66', to: '#69db7c' }}
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                Max
              </Badge>
            </Group>
            <Text
              size="xl"
              fw={700}
              c="#51cf66"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(20px, 3vw, 26px)',
              }}
            >
              {formatNumber(stats.maxDeltaA, 4)} км
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              Финальное: {formatNumber(stats.finalDeltaA, 4)} км
            </Text>
          </Card>

          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="gray.4">Δr (радиус)</Text>
              <Badge 
                size="lg" 
                variant="gradient"
                gradient={{ from: '#4dabf7', to: '#339af0' }}
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                Max
              </Badge>
            </Group>
            <Text
              size="xl"
              fw={700}
              c="#4dabf7"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(20px, 3vw, 26px)',
              }}
            >
              {formatNumber(stats.maxDeltaR, 2)} км
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              Среднее отклонение позиции
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {/* Comparison Plots - Overlay Mode */}
      {(comparisonMode === 'overlay' || comparisonMode === 'split') && (
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
                background: 'linear-gradient(135deg, #e03131 0%, #c92a2a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconChartArea size={20} color="white" />
            </div>
            <Title order={4} style={{ fontSize: '18px' }}>
              Элементы орбиты: Возмущённая vs Невозмущённая
            </Title>
          </Group>
          
          <Text size="sm" c="gray.4" mb="md" lh={1.6}>
            <Text span c="#e03131" fw={700}>Красная линия</Text> — возмущённая орбита (с учётом Луны), 
            <Text span c="#1971c2" fw={700}> синяя пунктирная</Text> — невозмущённая (Кеплер)
          </Text>
          
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
            {/* Right Ascension Ω */}
            <Box>
              <Text size="sm" fw={700} c="#8884d8" mb="sm">Ω (долгота восходящего узла)</Text>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={comparisonData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="t_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'Ω, град', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '16px',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Omega_perturbed"
                    stroke="#e03131"
                    strokeWidth={2.5}
                    dot={false}
                    name="Ω возмущ."
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="Omega_unperturbed"
                    stroke="#1971c2"
                    strokeWidth={2.5}
                    strokeDasharray="3 3"
                    dot={false}
                    name="Ω невозм."
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Inclination i */}
            <Box>
              <Text size="sm" fw={700} c="#82ca9d" mb="sm">i (наклонение)</Text>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={comparisonData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="t_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'i, град', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '16px',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="i_perturbed"
                    stroke="#e03131"
                    strokeWidth={2.5}
                    dot={false}
                    name="i возмущ."
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="i_unperturbed"
                    stroke="#1971c2"
                    strokeWidth={2.5}
                    strokeDasharray="3 3"
                    dot={false}
                    name="i невозм."
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Eccentricity e */}
            <Box>
              <Text size="sm" fw={700} c="#ffc658" mb="sm">e (эксцентриситет)</Text>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={comparisonData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="t_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'e', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '16px',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="e_perturbed"
                    stroke="#e03131"
                    strokeWidth={2.5}
                    dot={false}
                    name="e возмущ."
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="e_unperturbed"
                    stroke="#1971c2"
                    strokeWidth={2.5}
                    strokeDasharray="3 3"
                    dot={false}
                    name="e невозм."
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Argument of Perigee ω */}
            <Box>
              <Text size="sm" fw={700} c="#ff7300" mb="sm">ω (аргумент перицентра)</Text>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={comparisonData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="t_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'ω, град', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '16px',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="omega_perturbed"
                    stroke="#e03131"
                    strokeWidth={2.5}
                    dot={false}
                    name="ω возмущ."
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="omega_unperturbed"
                    stroke="#1971c2"
                    strokeWidth={2.5}
                    strokeDasharray="3 3"
                    dot={false}
                    name="ω невозм."
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SimpleGrid>
        </Card>
      )}

      {/* Difference Plots */}
      {comparisonMode === 'difference' && (
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
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconArrowsExchange size={20} color="white" />
            </div>
            <Title order={4} style={{ fontSize: '18px' }}>
              Разница элементов (Возмущённая − Невозмущённая)
            </Title>
          </Group>
          
          <Text size="sm" c="gray.4" mb="md" lh={1.6}>
            Количественная мера влияния лунных возмущений
          </Text>
          
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
            {/* ΔΩ, Δi */}
            <Box>
              <Text size="sm" fw={700} c="gray.3" mb="sm">Угловые отклонения</Text>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={comparisonData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="t_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'Δ, град', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '16px',
                      fontSize: '13px',
                    }}
                  />
                  <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="delta_Omega"
                    stroke="#8884d8"
                    strokeWidth={2.5}
                    dot={false}
                    name="ΔΩ"
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="delta_i"
                    stroke="#82ca9d"
                    strokeWidth={2.5}
                    dot={false}
                    name="Δi"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Δe, Δa */}
            <Box>
              <Text size="sm" fw={700} c="gray.3" mb="sm">Изменение формы и размера</Text>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={comparisonData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="t_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'Δ', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '16px',
                      fontSize: '13px',
                    }}
                  />
                  <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="delta_e"
                    stroke="#ffc658"
                    strokeWidth={2.5}
                    dot={false}
                    name="Δe"
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="delta_a"
                    stroke="#008800"
                    strokeWidth={2.5}
                    dot={false}
                    name="Δa, км"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SimpleGrid>
        </Card>
      )}

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
            <span style={{ fontSize: '20px' }}>🔬</span>
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            Анализ результатов сравнения
          </Title>
        </Group>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Box>
            <Text size="sm" mb="xs" style={{ color: '#e03131', fontWeight: 600 }}>
              🔴 Долгота восходящего узла (Ω)
            </Text>
            <Text size="sm" c="gray.3" mb="md" lh={1.6}>
              Лунные возмущения вызывают прецессию узла орбиты. 
              Максимальное отклонение составляет {stats ? formatNumber(stats.maxDeltaOmega, 6) : 'N/A'}°, 
              что существенно влияет на ориентацию орбитальной плоскости в пространстве.
            </Text>

            <Text size="sm" mb="xs" style={{ color: '#ffa94d', fontWeight: 600 }}>
              🟠 Наклонение (i)
            </Text>
            <Text size="sm" c="gray.3" mb="md" lh={1.6}>
              Изменение наклонения под действием бинормальной составляющей W 
              достигает {stats ? formatNumber(stats.maxDeltaI, 6) : 'N/A'}°. 
              Это приводит к медленному повороту орбитальной плоскости.
            </Text>
          </Box>

          <Box>
            <Text size="sm" mb="xs" style={{ color: '#ffd43b', fontWeight: 600 }}>
              🟡 Эксцентриситет (e)
            </Text>
            <Text size="sm" c="gray.3" mb="md" lh={1.6}>
              Под действием радиальной S и трансверсальной T составляющих 
              форма орбиты периодически изменяется с амплитудой {stats ? formatNumber(stats.maxDeltaE, 8) : 'N/A'}. 
              Это влияет на высоты апогея и перигея.
            </Text>

            <Text size="sm" mb="xs" style={{ color: '#da77f2', fontWeight: 600 }}>
              🟣 Аргумент перицентра (ω)
            </Text>
            <Text size="sm" c="gray.3" lh={1.6}>
              Наиболее сложное поведение — зависит от всех трёх составляющих. 
              Накапливающееся отклонение достигает {stats ? formatNumber(stats.maxDeltaOmega_arg, 6) : 'N/A'}°, 
              вызывая вращение линии апсид.
            </Text>
          </Box>
        </SimpleGrid>
        
        <Divider my="lg" style={{ background: 'rgba(255,255,255,0.1)' }} />
        
        <Box>
          <Text size="sm" mb="xs" style={{ color: '#51cf66', fontWeight: 600 }}>
            🟢 Большая полуось (a)
          </Text>
          <Text size="sm" c="gray.3" lh={1.6}>
            Изменение большой полуоси ({stats ? formatNumber(stats.maxDeltaA, 4) : 'N/A'} км) 
            свидетельствует об изменении орбитальной энергии под действием возмущений. 
            Радиальное отклонение позиции достигает {stats ? formatNumber(stats.maxDeltaR, 2) : 'N/A'} км.
          </Text>
        </Box>
      </Card>
    </div>
  );
}
