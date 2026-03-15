import { useMemo } from 'react';
import { Card, Text, Title, SimpleGrid, Badge, Group, Progress, Box } from '@mantine/core';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { IconChartBar, IconAward, IconActivity, IconInfoCircle } from '@tabler/icons-react';

interface LunarStatisticsTabProps {
  points: any[];
  orbit?: any;
}

export default function LunarStatisticsTab({ points, orbit }: LunarStatisticsTabProps) {
  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    if (!points || points.length === 0) return null;

    // Acceleration statistics
    const accelStats = {
      S: calculateComponentStats(points.map((p) => p.acceleration.S)),
      T: calculateComponentStats(points.map((p) => p.acceleration.T)),
      W: calculateComponentStats(points.map((p) => p.acceleration.W)),
      total: calculateComponentStats(points.map((p) => p.acceleration.total)),
    };

    // Orbital element variation statistics
    const elementStats = {
      a: calculateVariationStats(points.map((p) => p.orbitalElements.a)),
      e: calculateVariationStats(points.map((p) => p.orbitalElements.e)),
      i: calculateVariationStats(points.map((p) => p.orbitalElements.i)),
      Omega: calculateVariationStats(points.map((p) => p.orbitalElements.Omega)),
      omega: calculateVariationStats(points.map((p) => p.orbitalElements.omega)),
    };

    // Perturbation intensity by orbital quadrant
    const quadrantStats = calculateQuadrantStats(points);

    // RMS error estimates
    const rmsErrors = calculateRMSErrors(points);

    return {
      accelStats,
      elementStats,
      quadrantStats,
      rmsErrors,
    };
  }, [points, orbit]);

  if (!points || points.length === 0 || !stats) {
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
          📊 Нажмите "Рассчитать" для получения статистики
        </Text>
      </Card>
    );
  }

  const formatExp = (num: number) => {
    const absNum = Math.abs(num);
    if (absNum < 0.001 && num !== 0) {
      return num.toExponential(2);
    }
    return num.toFixed(6);
  };

  // Prepare data for acceleration comparison chart
  const accelChartData = [
    {
      component: 'S',
      min: stats.accelStats.S.min,
      max: stats.accelStats.S.max,
      mean: stats.accelStats.S.mean,
      rms: stats.accelStats.S.rms,
    },
    {
      component: 'T',
      min: stats.accelStats.T.min,
      max: stats.accelStats.T.max,
      mean: stats.accelStats.T.mean,
      rms: stats.accelStats.T.rms,
    },
    {
      component: 'W',
      min: stats.accelStats.W.min,
      max: stats.accelStats.W.max,
      mean: stats.accelStats.W.mean,
      rms: stats.accelStats.W.rms,
    },
  ];

  // Determine dominant component
  const dominantComponent = getDominantComponent(stats.accelStats);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '10px',
    }}>
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
          📊 Статистический анализ возмущений
        </Title>
        <Text c="gray.4" size="lg">
          Комплексный статистический анализ лунных возмущений и оценка точности интегрирования
        </Text>
      </Box>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {/* Dominant Component Card */}
        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="gray.4">Доминирующая компонента</Text>
            <Badge 
              size="lg" 
              variant="gradient"
              gradient={{ from: '#ff6b6b', to: '#ee5a6f' }}
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              {dominantComponent}
            </Badge>
          </Group>
          <Text size="lg" fw={600} c="#ff6b6b">
            {getDominantExplanation(dominantComponent)}
          </Text>
          <Text size="xs" c="gray.5" mt="xs">
            Наибольшее RMS значение
          </Text>
        </Card>

        {/* Maximum Acceleration Card */}
        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 48px rgba(255, 169, 77, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="gray.4">Максимальное ускорение</Text>
            <Badge 
              size="lg" 
              variant="gradient"
              gradient={{ from: '#ffa94d', to: '#ff922b' }}
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              \|a\|max
            </Badge>
          </Group>
          <Text 
            size="lg" 
            fw={600}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              background: 'linear-gradient(135deg, #ffa94d 0%, #ff922b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {formatExp(stats.accelStats.total.max)} м/с²
          </Text>
          <Text size="xs" c="gray.5" mt="xs">
            Отношение к земному: {(stats.accelStats.total.max / 9.81).toExponential(2)}
          </Text>
        </Card>

        {/* Average Acceleration Card */}
        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 48px rgba(255, 212, 59, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="gray.4">Среднее ускорение</Text>
            <Badge 
              size="lg" 
              variant="gradient"
              gradient={{ from: '#ffd43b', to: '#fcc419' }}
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              \|a\|avg
            </Badge>
          </Group>
          <Text 
            size="lg" 
            fw={600}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              background: 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {formatExp(stats.accelStats.total.mean)} м/с²
          </Text>
          <Text size="xs" c="gray.5" mt="xs">
            Среднеквадратичное: {formatExp(stats.accelStats.total.rms)} м/с²
          </Text>
        </Card>

        {/* Trajectory Points Card */}
        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 48px rgba(77, 171, 247, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="gray.4">Точек траектории</Text>
            <Badge 
              size="lg" 
              variant="gradient"
              gradient={{ from: '#4dabf7', to: '#339af0' }}
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              N
            </Badge>
          </Group>
          <Text 
            size="lg" 
            fw={600}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              background: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {points.length}
          </Text>
          <Text size="xs" c="gray.5" mt="xs">
            Диапазон u: [0°, 360°]
          </Text>
        </Card>
      </SimpleGrid>

      {/* Acceleration Statistics Chart */}
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
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconChartBar size={20} color="white" />
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            Статистика компонент ускорения
          </Title>
        </Group>
        
        <Text size="sm" c="gray.4" mb="md" lh={1.6}>
          Сравнительный анализ статистических характеристик компонент возмущающего ускорения
        </Text>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={accelChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis 
              dataKey="component" 
              tick={{ fill: '#888', fontSize: 14 }}
              tickFormatter={(val) => `${val} (м/с²)`}
            />
            <YAxis
              tick={{ fill: '#888', fontSize: 12 }}
              tickFormatter={(val) => val.toExponential(1)}
              label={{ value: 'м/с²', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
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
                      }}
                    >
                      <Text fw={700} mb="xs" style={{ color: '#667eea' }}>
                        Компонента {label}
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
                            {Number(entry.value).toExponential(4)} м/с²
                          </Text>
                        </Group>
                      ))}
                    </Card>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '16px',
                fontSize: '13px',
              }}
            />
            <Bar dataKey="min" fill="#ff6b6b" name="Минимум" radius={[4, 4, 0, 0]} animationDuration={1000} />
            <Bar dataKey="max" fill="#51cf66" name="Максимум" radius={[4, 4, 0, 0]} animationDuration={1000} />
            <Bar dataKey="mean" fill="#339af0" name="Среднее" radius={[4, 4, 0, 0]} animationDuration={1000} />
            <Bar dataKey="rms" fill="#ffd43b" name="RMS" radius={[4, 4, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Variation Statistics */}
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
            <IconActivity size={20} color="white" />
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            Вариация орбитальных элементов
          </Title>
        </Group>
        
        <Text size="sm" c="gray.4" mb="md" lh={1.6}>
          Изменения элементов за время интегрирования (возмущения − начальное значение)
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Box>
            <Text fw={600} mb="xs" c="#ff6b6b">Δa (большая полуось)</Text>
            <ElementVariationBar
              value={stats.elementStats.a.range}
              unit="км"
              mean={stats.elementStats.a.mean}
            />
            <Text size="xs" c="gray.5" mt="xs">
              Начальное: {formatNumber(orbit?.a || 0, 2)} км → 
              Изменение: {formatExp(stats.elementStats.a.range)} км
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs" c="#ffd43b">Δe (эксцентриситет)</Text>
            <ElementVariationBar
              value={stats.elementStats.e.range}
              unit=""
              mean={stats.elementStats.e.mean}
            />
            <Text size="xs" c="gray.5" mt="xs">
              Начальное: {formatNumber(orbit?.e || 0, 6)} → 
              Изменение: {formatExp(stats.elementStats.e.range)}
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs" c="#4dabf7">Δi (наклонение)</Text>
            <ElementVariationBar
              value={stats.elementStats.i.range * 180 / Math.PI}
              unit="град"
              mean={stats.elementStats.i.mean * 180 / Math.PI}
            />
            <Text size="xs" c="gray.5" mt="xs">
              Начальное: {formatNumber((orbit?.i || 0), 4)}° → 
              Изменение: {formatExp(stats.elementStats.i.range * 180 / Math.PI)}°
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs" c="#8884d8">ΔΩ (долгота узла)</Text>
            <ElementVariationBar
              value={stats.elementStats.Omega.range * 180 / Math.PI}
              unit="град"
              mean={stats.elementStats.Omega.mean * 180 / Math.PI}
            />
            <Text size="xs" c="gray.5" mt="xs">
              Начальное: {formatNumber((orbit?.Omega || 0), 4)}° → 
              Изменение: {formatExp(stats.elementStats.Omega.range * 180 / Math.PI)}°
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs" c="#da77f2">Δω (аргумент перицентра)</Text>
            <ElementVariationBar
              value={stats.elementStats.omega.range * 180 / Math.PI}
              unit="град"
              mean={stats.elementStats.omega.mean * 180 / Math.PI}
            />
            <Text size="xs" c="gray.5" mt="xs">
              Начальное: {formatNumber((orbit?.omega || 0), 4)}° → 
              Изменение: {formatExp(stats.elementStats.omega.range * 180 / Math.PI)}°
            </Text>
          </Box>
        </SimpleGrid>
      </Card>

      {/* Quadrant Analysis */}
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
              background: 'linear-gradient(135deg, #69db7c 0%, #51cf66 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconAward size={20} color="white" />
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            Анализ по квадрантам орбиты
          </Title>
        </Group>
        
        <Text size="sm" c="gray.4" mb="md" lh={1.6}>
          Средние значения ускорений в разных квадрантах аргумента широты u
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {stats.quadrantStats.map((quad, idx) => (
            <Card
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(12px)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(102, 126, 234, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
            >
              <Text fw={600} mb="xs" c="#4dabf7" style={{ fontSize: '14px' }}>
                Квадрант {idx + 1}
              </Text>
              <Text size="xs" c="gray.5" mb="md" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                u ∈ [{quad.uMin}°, {quad.uMax}°]
              </Text>
              
              <Group gap="xs" mb="xs">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff6b6b' }} />
                <Text size="sm" c="gray.3">
                  <Text span fw={600}>S:</Text> {formatExp(quad.S)} м/с²
                </Text>
              </Group>
              
              <Group gap="xs" mb="xs">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4dabf7' }} />
                <Text size="sm" c="gray.3">
                  <Text span fw={600}>T:</Text> {formatExp(quad.T)} м/с²
                </Text>
              </Group>
              
              <Group gap="xs" mb="xs">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#69db7c' }} />
                <Text size="sm" c="gray.3">
                  <Text span fw={600}>W:</Text> {formatExp(quad.W)} м/с²
                </Text>
              </Group>
              
              <Group gap="xs">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffd43b' }} />
                <Text size="sm" fw={600} c="gray.2">
                  \|a\|: {formatExp(quad.total)} м/с²
                </Text>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Card>

      {/* RMS Error Analysis */}
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
            <IconInfoCircle size={20} color="white" />
          </div>
          <Title order={4} style={{ fontSize: '18px' }}>
            Оценка численной точности
          </Title>
        </Group>
        
        <Text size="sm" c="gray.4" mb="md" lh={1.6}>
          Среднеквадратичные отклонения как мера точности интегрирования
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {/* Energy Conservation */}
          <Box>
            <Text fw={600} mb="xs" c="#51cf66">
              Сохранение энергии (Δa/a)
            </Text>
            <Progress
              value={Math.min(100, Math.log10(stats.rmsErrors.energyRelativeError + 1e-16) + 16)}
              color={getEnergyColor(stats.rmsErrors.energyRelativeError)}
              size="xl"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <Text 
              size="sm" 
              fw={700}
              mt="xs"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: getEnergyColor(stats.rmsErrors.energyRelativeError),
              }}
            >
              {(stats.rmsErrors.energyRelativeError).toExponential(2)}
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              Относительное изменение большой полуоси
            </Text>
          </Box>

          {/* Smoothness */}
          <Box>
            <Text fw={600} mb="xs" c="#4dabf7">
              Гладкость траектории
            </Text>
            <Progress
              value={Math.min(100, Math.log10(stats.rmsErrors.smoothness + 1e-16) + 16)}
              color={getSmoothnessColor(stats.rmsErrors.smoothness)}
              size="xl"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <Text 
              size="sm" 
              fw={700}
              mt="xs"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: getSmoothnessColor(stats.rmsErrors.smoothness),
              }}
            >
              {formatExp(stats.rmsErrors.smoothness)} км
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              Вторая разность радиуса
            </Text>
          </Box>

          {/* RMS Omega */}
          <Box>
            <Text fw={600} mb="xs" c="#8884d8">
              RMS ошибка Ω
            </Text>
            <Box 
              style={{ 
                fontFamily: "'JetBrains Mono', monospace", 
                fontSize: 'clamp(18px, 2.5vw, 22px)', 
                fontWeight: 600,
                background: 'linear-gradient(135deg, #8884d8 0%, #339af0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {formatExp(stats.rmsErrors.rms_Omega * 180 / Math.PI)}°
            </Box>
            <Text size="xs" c="gray.5" mt="xs">
              Среднеквадратичное отклонение долготы узла
            </Text>
          </Box>

          {/* RMS i */}
          <Box>
            <Text fw={600} mb="xs" c="#82ca9d">
              RMS ошибка i
            </Text>
            <Box 
              style={{ 
                fontFamily: "'JetBrains Mono', monospace", 
                fontSize: 'clamp(18px, 2.5vw, 22px)', 
                fontWeight: 600,
                background: 'linear-gradient(135deg, #82ca9d 0%, #51cf66 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {formatExp(stats.rmsErrors.rms_i * 180 / Math.PI)}°
            </Box>
            <Text size="xs" c="gray.5" mt="xs">
              Среднеквадратичное отклонение наклонения
            </Text>
          </Box>
        </SimpleGrid>

        {/* Overall Quality Assessment */}
        <Box mt="xl">
          <Text size="sm" fw={600} mb="xs" c="gray.3">
            Общая оценка качества:
          </Text>
          <Text 
            size="lg" 
            fw={700}
            mt="xs"
            c={getOverallQualityColor(stats.rmsErrors)}
            style={{
              fontSize: 'clamp(18px, 2.5vw, 22px)',
            }}
          >
            {getOverallQuality(stats.rmsErrors)}
          </Text>
        </Box>
      </Card>
    </div>
  );
}

// Helper functions

function calculateComponentStats(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const rms = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0) / values.length);

  return { min, max, mean, rms };
}

function calculateVariationStats(values: number[]) {
  const initial = values[0];
  const final = values[values.length - 1];
  const range = Math.abs(final - initial);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length,
  );

  return { initial, final, range, mean, stdDev };
}

function calculateQuadrantStats(points: any[]) {
  const quadrants = [[0, 90], [90, 180], [180, 270], [270, 360]];

  return quadrants.map(([uMin, uMax]) => {
    const quadPoints = points.filter(
      (p) => (p.u * 180 / Math.PI) % 360 >= uMin && (p.u * 180 / Math.PI) % 360 < uMax,
    );

    if (quadPoints.length === 0) {
      return { uMin, uMax, S: 0, T: 0, W: 0, total: 0 };
    }

    const avgAccel = {
      S: quadPoints.reduce((sum, p) => sum + p.acceleration.S, 0) / quadPoints.length,
      T: quadPoints.reduce((sum, p) => sum + p.acceleration.T, 0) / quadPoints.length,
      W: quadPoints.reduce((sum, p) => sum + p.acceleration.W, 0) / quadPoints.length,
      total: quadPoints.reduce((sum, p) => sum + p.acceleration.total, 0) / quadPoints.length,
    };

    return { uMin, uMax, ...avgAccel };
  });
}

function calculateRMSErrors(points: any[]) {
  const aValues = points.map((p) => p.orbitalElements.a);
  const aMean = aValues.reduce((sum, a) => sum + a, 0) / aValues.length;
  const energyRelativeError = Math.sqrt(
    aValues.reduce((sum, a) => sum + Math.pow(a - aMean, 2), 0) / aValues.length,
  ) / aMean;

  // Smoothness via second differences
  let smoothnessSum = 0;
  for (let i = 1; i < points.length - 1; i++) {
    smoothnessSum += Math.abs(points[i + 1].r - 2 * points[i].r + points[i - 1].r);
  }
  const smoothness = smoothnessSum / (points.length - 2);

  // RMS errors in elements
  const OmegaValues = points.map((p) => p.orbitalElements.Omega);
  const iValues = points.map((p) => p.orbitalElements.i);

  const rms_Omega = Math.sqrt(
    OmegaValues.reduce((sum, val) => sum + Math.pow(val - OmegaValues[0], 2), 0) /
      OmegaValues.length,
  );

  const rms_i = Math.sqrt(
    iValues.reduce((sum, val) => sum + Math.pow(val - iValues[0], 2), 0) / iValues.length,
  );

  return {
    energyRelativeError,
    smoothness,
    rms_Omega,
    rms_i,
  };
}

function getDominantComponent(accelStats: any): string {
  const rmsValues = {
    S: Math.abs(accelStats.S.rms),
    T: Math.abs(accelStats.T.rms),
    W: Math.abs(accelStats.W.rms),
  };

  if (rmsValues.W > rmsValues.S && rmsValues.W > rmsValues.T) return 'W';
  if (rmsValues.T > rmsValues.S && rmsValues.T > rmsValues.W) return 'T';
  return 'S';
}

function getDominantExplanation(component: string): string {
  switch (component) {
    case 'W':
      return 'Бинормальная (прецессия)';
    case 'T':
      return 'Трансверсальная (форма)';
    case 'S':
      return 'Радиальная (размер)';
    default:
      return 'Неизвестно';
  }
}

function formatNumber(num: number, decimals: number): string {
  return num.toFixed(decimals);
}

function ElementVariationBar({ value, unit, mean }: { value: number; unit: string; mean: number }) {
  const normalizedValue = Math.min(100, Math.log10(Math.abs(value) + 1e-16) + 16);

  return (
    <div>
      <Progress
        value={normalizedValue}
        color={value > 0.01 ? 'red' : value > 0.001 ? 'yellow' : 'green'}
        size="lg"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
        }}
      />
      <Text size="xs" c="gray.5" mt="xs">
        Величина: {value.toExponential(2)} {unit}
      </Text>
      <Text size="xs" c="gray.5" mt="xs">
        Среднее отклонение: {mean.toExponential(2)} {unit}
      </Text>
    </div>
  );
}

function getEnergyColor(error: number): string {
  if (error < 1e-10) return '#51cf66';
  if (error < 1e-8) return '#ffd43b';
  if (error < 1e-6) return '#ffa94d';
  return '#ff6b6b';
}

function getSmoothnessColor(smoothness: number): string {
  if (smoothness < 1e-6) return '#51cf66';
  if (smoothness < 1e-4) return '#ffd43b';
  if (smoothness < 1e-2) return '#ffa94d';
  return '#ff6b6b';
}

function getOverallQualityColor(rmsErrors: any): string {
  const quality = getOverallQuality(rmsErrors);
  if (quality.includes('✅')) return '#51cf66';
  if (quality.includes('👍')) return '#4dabf7';
  if (quality.includes('⚠️')) return '#ffd43b';
  return '#ff6b6b';
}

function getOverallQuality(rmsErrors: any): string {
  if (rmsErrors.energyRelativeError < 1e-10 && rmsErrors.smoothness < 1e-6) {
    return '✅ Отличное (высокая точность)';
  }
  if (rmsErrors.energyRelativeError < 1e-8 && rmsErrors.smoothness < 1e-4) {
    return '👍 Хорошее (приемлемая точность)';
  }
  if (rmsErrors.energyRelativeError < 1e-6 && rmsErrors.smoothness < 1e-2) {
    return '⚠️ Удовлетворительное (требуется внимание)';
  }
  return '❌ Низкое (рекомендуется уменьшить шаг)';
}
