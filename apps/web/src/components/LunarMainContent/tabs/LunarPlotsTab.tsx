import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, Text, Title, SimpleGrid, Group, Box, Badge, SegmentedControl } from '@mantine/core';
import { IconChartLine } from '@tabler/icons-react';

interface LunarPlotsTabProps {
  points: any[];
}

export default function LunarPlotsTab({ points }: LunarPlotsTabProps) {
  const [selectedView, setSelectedView] = useState<'all' | 'elements' | 'acceleration' | 'delta'>('all');

  // Prepare data for charts
  const chartData = useMemo(() => {
    if (!points || points.length === 0) return [];
    
    const initialA = points[0].orbitalElements.a;
    const initialE = points[0].orbitalElements.e;
    
    return points.map((p, idx) => ({
      index: idx,
      time: p.t,
      time_hours: p.t / 3600,
      u_deg: p.u * (180 / Math.PI),
      Omega_deg: p.orbitalElements.Omega * (180 / Math.PI),
      i_deg: p.orbitalElements.i * (180 / Math.PI),
      e: p.orbitalElements.e,
      delta_e: p.orbitalElements.e - initialE, // Change in eccentricity
      omega_deg: p.orbitalElements.omega * (180 / Math.PI),
      p: p.orbitalElements.p,
      a: p.orbitalElements.a,
      delta_a: p.orbitalElements.a - initialA, // Change in semi-major axis
      deltaOmega: p.changes.deltaOmega,
      deltaI: p.changes.deltaI,
      deltaE: p.changes.deltaE,
      deltaOmega_arg: p.changes.deltaOmega_arg,
      deltaP: p.changes.deltaP,
      S_ms2: p.acceleration.S,
      T_ms2: p.acceleration.T,
      W_ms2: p.acceleration.W,
      total_ms2: p.acceleration.total,
    }));
  }, [points]);

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
          📊 Нажмите "Рассчитать" для построения графиков
        </Text>
      </Card>
    );
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const totalTime = lastPoint.t;

  // Calculate total changes
  const totalChanges = {
    deltaOmega: lastPoint.changes.deltaOmega,
    deltaI: lastPoint.changes.deltaI,
    deltaE: lastPoint.changes.deltaE,
    deltaOmega_arg: lastPoint.changes.deltaOmega_arg,
    deltaP: lastPoint.changes.deltaP,
  };

  const formatNumber = (num: number, decimals: number = 6) => {
    const absNum = Math.abs(num);
    if (absNum < 0.0001 && num !== 0) {
      return num.toExponential(3);
    }
    return num.toFixed(decimals);
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
            Время: {(Number(label) / 3600).toFixed(3)} ч
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

  // Chart common styles
  const chartGridStyle = { strokeDasharray: '3 3', stroke: 'rgba(255, 255, 255, 0.1)' };

  // Summary cards data
  const summaryCards = [
    {
      title: 'ΔΩ (узел)',
      value: totalChanges.deltaOmega,
      unit: '°',
      color: totalChanges.deltaOmega > 0 ? '#ff6b6b' : totalChanges.deltaOmega < 0 ? '#51cf66' : '#868e96',
      gradient: 'linear-gradient(135deg, #63e6be 0%, #38d9a9 100%)',
    },
    {
      title: 'Δi (наклонение)',
      value: totalChanges.deltaI,
      unit: '°',
      color: totalChanges.deltaI > 0 ? '#ff6b6b' : totalChanges.deltaI < 0 ? '#51cf66' : '#868e96',
      gradient: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
    },
    {
      title: 'Δe (эксцентриситет)',
      value: totalChanges.deltaE,
      unit: '',
      color: totalChanges.deltaE > 0 ? '#ff6b6b' : totalChanges.deltaE < 0 ? '#51cf66' : '#868e96',
      gradient: 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)',
    },
    {
      title: 'Δω (перицентр)',
      value: totalChanges.deltaOmega_arg,
      unit: '°',
      color: totalChanges.deltaOmega_arg > 0 ? '#ff6b6b' : totalChanges.deltaOmega_arg < 0 ? '#51cf66' : '#868e96',
      gradient: 'linear-gradient(135deg, #da77f2 0%, #be4bdb 100%)',
    },
    {
      title: 'Δp (фокальный)',
      value: totalChanges.deltaP,
      unit: 'км',
      color: totalChanges.deltaP > 0 ? '#ff6b6b' : totalChanges.deltaP < 0 ? '#51cf66' : '#868e96',
      gradient: 'linear-gradient(135deg, #ffa94d 0%, #ff922b 100%)',
    },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '10px',
    }}>
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
          📊 Графики изменения орбитальных элементов
        </Title>
        <Text c="gray.4" size="lg">
          Визуализация эволюции орбитальных параметров под действием лунных возмущений
        </Text>
      </Box>

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
        <Group justify="space-between" align="center">
          <SegmentedControl
            value={selectedView}
            onChange={(value) => setSelectedView(value as any)}
            data={[
              { label: '📊 Все', value: 'all' },
              { label: '🔵 Элементы', value: 'elements' },
              { label: '🔴 Ускорения', value: 'acceleration' },
              { label: '📉 Изменения', value: 'delta' },
            ]}
            style={{
              background: 'rgba(10, 14, 23, 0.5)',
              borderRadius: '10px',
            }}
          />
          
          <Group gap="xs">
            <Badge variant="light" color="blue" size="sm">
              ⏱ {(totalTime / 3600).toFixed(2)} ч
            </Badge>
            <Badge variant="light" color="violet" size="sm">
              📈 {points.length} точек
            </Badge>
          </Group>
        </Group>
      </Card>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md" mb="xl">
        {summaryCards.map((card, index) => (
          <Card
            key={index}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderRadius: '16px',
              padding: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(102, 126, 234, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            }}
          >
            {/* Gradient top border */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: card.gradient,
              }}
            />
            
            <Text size="xs" c="gray.4" mb="xs" fw={600}>
              {card.title}
            </Text>
            <Text
              size="xl"
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(18px, 2.5vw, 24px)',
                color: card.color,
                letterSpacing: '-0.5px',
              }}
            >
              {formatNumber(card.value, card.unit === '°' ? 6 : card.unit === '' ? 8 : 4)}{card.unit}
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              за {(totalTime / 3600).toFixed(2)} ч
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Acceleration Plots */}
      {(selectedView === 'all' || selectedView === 'acceleration') && (
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
              <IconChartLine size={20} color="white" />
            </div>
            <Title order={4} style={{ fontSize: '18px' }}>
              Возмущающие ускорения от притяжения Луны
            </Title>
          </Group>
          
          <Text size="sm" c="gray.4" mb="md" lh={1.6}>
            Три составляющие возмущающего ускорения в орбитальной системе координат:
            S — радиальная (красный), T — трансверсальная (синий), W — бинормальная (зелёный)
          </Text>
          
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
            {/* Radial acceleration S */}
            <Box>
              <Text size="sm" fw={700} c="#ff6b6b" mb="sm">S (радиальная)</Text>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'S, м/с²', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(val: number) => val.toExponential(1)}
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
                    dataKey="S_ms2"
                    stroke="#ff6b6b"
                    strokeWidth={2.5}
                    dot={false}
                    name="S (радиальная)"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Transverse acceleration T */}
            <Box>
              <Text size="sm" fw={700} c="#4dabf7" mb="sm">T (трансверсальная)</Text>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'T, м/с²', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(val: number) => val.toExponential(1)}
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
                    dataKey="T_ms2"
                    stroke="#4dabf7"
                    strokeWidth={2.5}
                    dot={false}
                    name="T (трансверсальная)"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Normal acceleration W */}
            <Box>
              <Text size="sm" fw={700} c="#69db7c" mb="sm">W (бинормальная)</Text>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'W, м/с²', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(val: number) => val.toExponential(1)}
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
                    dataKey="W_ms2"
                    stroke="#69db7c"
                    strokeWidth={2.5}
                    dot={false}
                    name="W (бинормальная)"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Total acceleration */}
            <Box>
              <Text size="sm" fw={700} c="#ffd43b" mb="sm">|a| (полное)</Text>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: '|a|, м/с²', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(val: number) => val.toExponential(1)}
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
                    dataKey="total_ms2"
                    stroke="#ffd43b"
                    strokeWidth={2.5}
                    dot={false}
                    name="|a| (полное)"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SimpleGrid>
        </Card>
      )}

      {/* Orbital Elements Plots */}
      {(selectedView === 'all' || selectedView === 'elements') && (
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
                background: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconChartLine size={20} color="white" />
            </div>
            <Title order={4} style={{ fontSize: '18px' }}>
              Элементы орбиты
            </Title>
          </Group>
          
          <Text size="sm" c="gray.4" mb="md" lh={1.6}>
            Изменение орбитальных элементов в течение времени интегрирования
          </Text>
          
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
            {/* Right Ascension Ω */}
            <Box>
              <Text size="sm" fw={700} c="#8884d8" mb="sm">Ω (долгота восходящего узла)</Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t) => t.toFixed(1)}
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
                  <ReferenceLine 
                    y={firstPoint.orbitalElements.Omega * (180 / Math.PI)} 
                    stroke="#888" 
                    strokeDasharray="3 3" 
                  />
                  <Line
                    type="monotone"
                    dataKey="Omega_deg"
                    stroke="#8884d8"
                    strokeWidth={2.5}
                    dot={false}
                    name="Ω (град)"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Inclination i */}
            <Box>
              <Text size="sm" fw={700} c="#82ca9d" mb="sm">i (наклонение)</Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t) => t.toFixed(1)}
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
                  <ReferenceLine 
                    y={firstPoint.orbitalElements.i * (180 / Math.PI)} 
                    stroke="#888" 
                    strokeDasharray="3 3" 
                  />
                  <Line
                    type="monotone"
                    dataKey="i_deg"
                    stroke="#82ca9d"
                    strokeWidth={2.5}
                    dot={false}
                    name="i (град)"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Eccentricity e */}
            <Box>
              <Text size="sm" fw={700} c="#ffc658" mb="sm">e (эксцентриситет)</Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'e', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(val: number) => val.toFixed(6)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '16px',
                      fontSize: '13px',
                    }}
                  />
                  <ReferenceLine 
                    y={firstPoint.orbitalElements.e} 
                    stroke="#888" 
                    strokeDasharray="3 3" 
                  />
                  <Line
                    type="monotone"
                    dataKey="e"
                    stroke="#ffc658"
                    strokeWidth={2.5}
                    dot={false}
                    name="e"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Semi-major axis change Δa */}
            <Box>
              <Text size="sm" fw={700} c="#00CED1" mb="sm">Δa (изменение большой полуоси)</Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'Δa, км', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(val: number) => val.toExponential(2)}
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
                    dataKey="delta_a"
                    stroke="#00CED1"
                    strokeWidth={2.5}
                    dot={false}
                    name="Δa (км)"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Argument of Perigee ω */}
            <Box>
              <Text size="sm" fw={700} c="#ff7300" mb="sm">ω (аргумент перицентра)</Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t) => t.toFixed(1)}
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
                  <ReferenceLine 
                    y={firstPoint.orbitalElements.omega * (180 / Math.PI)} 
                    stroke="#888" 
                    strokeDasharray="3 3" 
                  />
                  <Line
                    type="monotone"
                    dataKey="omega_deg"
                    stroke="#ff7300"
                    strokeWidth={2.5}
                    dot={false}
                    name="ω (град)"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SimpleGrid>
        </Card>
      )}

      {/* Delta Plots */}
      {(selectedView === 'all' || selectedView === 'delta') && (
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
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconChartLine size={20} color="white" />
            </div>
            <Title order={4} style={{ fontSize: '18px' }}>
              Изменения элементов орбиты (Δ от начального значения)
            </Title>
          </Group>
          
          <Text size="sm" c="gray.4" mb="md" lh={1.6}>
            Количественная мера влияния лунных возмущений на орбитальные элементы
          </Text>
          
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
            {/* ΔΩ, Δi, Δω */}
            <Box>
              <Text size="sm" fw={700} c="gray.3" mb="sm">Угловые изменения</Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
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
                    dataKey="deltaOmega"
                    stroke="#8884d8"
                    strokeWidth={2.5}
                    dot={false}
                    name="ΔΩ (град)"
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="deltaI"
                    stroke="#82ca9d"
                    strokeWidth={2.5}
                    dot={false}
                    name="Δi (град)"
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="deltaOmega_arg"
                    stroke="#ff7300"
                    strokeWidth={2.5}
                    dot={false}
                    name="Δω (град)"
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Δe */}
            <Box>
              <Text size="sm" fw={700} c="gray.3" mb="sm">Изменение эксцентриситета (Δe)</Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'Δe', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(val: number) => val.toExponential(4)}
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
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Δa */}
            <Box>
              <Text size="sm" fw={700} c="gray.3" mb="sm">Изменение большой полуоси (Δa)</Text>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGridStyle} />
                  <XAxis
                    dataKey="time_hours"
                    label={{ value: 'Время, ч', position: 'insideBottom', offset: -5, fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(t: number) => t.toFixed(1)}
                  />
                  <YAxis
                    label={{ value: 'Δa, км', angle: -90, position: 'insideLeft', fill: '#888' }}
                    tick={{ fill: '#888', fontSize: 12 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(val: number) => val.toExponential(2)}
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
                    dataKey="delta_a"
                    stroke="#00CED1"
                    strokeWidth={2.5}
                    dot={false}
                    name="Δa (км)"
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
        mt="xl"
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
            Анализ результатов
          </Title>
        </Group>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Box>
            <Text size="sm" mb="xs" style={{ color: '#8884d8', fontWeight: 600 }}>
              🔵 Долгота восходящего узла (Ω)
            </Text>
            <Text size="sm" c="gray.3" mb="md" lh={1.6}>
              Изменяется под действием бинормальной составляющей W возмущающего ускорения. 
              Скорость изменения зависит от аргумента широты u и взаимной ориентации орбит спутника и Луны.
            </Text>
            
            <Text size="sm" mb="xs" style={{ color: '#82ca9d', fontWeight: 600 }}>
              🟢 Наклонение (i)
            </Text>
            <Text size="sm" c="gray.3" mb="md" lh={1.6}>
              Периодические изменения наклонения также определяются W-составляющей. 
              Амплитуда изменений зависит от текущего положения спутника на орбите.
            </Text>
          </Box>
          
          <Box>
            <Text size="sm" mb="xs" style={{ color: '#ffc658', fontWeight: 600 }}>
              🟡 Эксцентриситет (e)
            </Text>
            <Text size="sm" c="gray.3" mb="md" lh={1.6}>
              Изменяется под действием радиальной S и трансверсальной T составляющих. 
              Форма орбиты периодически меняется, что влияет на высоты апогея и перигея.
            </Text>
            
            <Text size="sm" mb="xs" style={{ color: '#ff7300', fontWeight: 600 }}>
              🟠 Аргумент перицентра (ω)
            </Text>
            <Text size="sm" c="gray.3" lh={1.6}>
              Испыывает наиболее сложные изменения — зависит от всех трёх составляющих (S, T, W). 
              Вызывает вращение линии апсид в плоскости орбиты.
            </Text>
          </Box>
        </SimpleGrid>
      </Card>
    </div>
  );
}
