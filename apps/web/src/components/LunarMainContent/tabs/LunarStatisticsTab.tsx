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
      <Card withBorder>
        <Text c="dimmed" ta="center">
          Нажмите "Рассчитать" для получения статистики
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
    <div>
      <Title order={3} mb="md">
        Статистический анализ возмущений
      </Title>

      {/* Summary cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="md">
        <Card withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Доминирующая компонента</Text>
            <Badge color="red">{dominantComponent}</Badge>
          </Group>
          <Text size="lg" fw={600}>
            {getDominantExplanation(dominantComponent)}
          </Text>
        </Card>

        <Card withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Максимальное ускорение</Text>
            <Badge color="orange">|a|max</Badge>
          </Group>
          <Text size="lg" fw={600} style={{ fontFamily: 'monospace' }}>
            {formatExp(stats.accelStats.total.max)} м/с²
          </Text>
          <Text size="xs" c="dimmed">
            Отношение к земному: {(stats.accelStats.total.max / 9.81).toExponential(2)}
          </Text>
        </Card>

        <Card withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Среднее ускорение</Text>
            <Badge color="yellow">|a|avg</Badge>
          </Group>
          <Text size="lg" fw={600} style={{ fontFamily: 'monospace' }}>
            {formatExp(stats.accelStats.total.mean)} м/с²
          </Text>
          <Text size="xs" c="dimmed">
            Среднеквадратичное: {formatExp(stats.accelStats.total.rms)} м/с²
          </Text>
        </Card>

        <Card withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Точек траектории</Text>
            <Badge color="blue">N</Badge>
          </Group>
          <Text size="lg" fw={600}>
            {points.length}
          </Text>
          <Text size="xs" c="dimmed">
            Диапазон u: [0°, 360°]
          </Text>
        </Card>
      </SimpleGrid>

      {/* Acceleration statistics chart */}
      <Card withBorder mb="md">
        <Title order={4} mb="md">
          Статистика компонент ускорения
        </Title>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={accelChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="component" />
            <YAxis
              tickFormatter={(val) => val.toExponential(1)}
              label={{ value: 'м/с²', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: any) => Number(value).toExponential(4)}
              labelFormatter={(label: any) => `Компонента ${label}`}
            />
            <Legend />
            <Bar dataKey="min" fill="#ff6b6b" name="Минимум" />
            <Bar dataKey="max" fill="#51cf66" name="Максимум" />
            <Bar dataKey="mean" fill="#339af0" name="Среднее" />
            <Bar dataKey="rms" fill="#ffd43b" name="RMS" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Variation statistics by orbital element */}
      <Card withBorder mb="md">
        <Title order={4} mb="md">
          Вариация орбитальных элементов
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Изменения элементов за время интегрирования (возмущения - начальное значение)
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Box>
            <Text fw={600} mb="xs">Δa (большая полуось)</Text>
            <ElementVariationBar
              value={stats.elementStats.a.range}
              unit="км"
              mean={stats.elementStats.a.mean}
            />
            <Text size="xs" c="dimmed" mt="xs">
              Начальное: {formatNumber(orbit?.a || 0, 2)} км → 
              Изменение: {formatExp(stats.elementStats.a.range)} км
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs">Δe (эксцентриситет)</Text>
            <ElementVariationBar
              value={stats.elementStats.e.range}
              unit=""
              mean={stats.elementStats.e.mean}
            />
            <Text size="xs" c="dimmed" mt="xs">
              Начальное: {formatNumber(orbit?.e || 0, 6)} → 
              Изменение: {formatExp(stats.elementStats.e.range)}
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs">Δi (наклонение)</Text>
            <ElementVariationBar
              value={stats.elementStats.i.range * 180 / Math.PI}
              unit="град"
              mean={stats.elementStats.i.mean * 180 / Math.PI}
            />
            <Text size="xs" c="dimmed" mt="xs">
              Начальное: {formatNumber((orbit?.i || 0), 4)}° → 
              Изменение: {formatExp(stats.elementStats.i.range * 180 / Math.PI)}°
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs">ΔΩ (долгота узла)</Text>
            <ElementVariationBar
              value={stats.elementStats.Omega.range * 180 / Math.PI}
              unit="град"
              mean={stats.elementStats.Omega.mean * 180 / Math.PI}
            />
            <Text size="xs" c="dimmed" mt="xs">
              Начальное: {formatNumber((orbit?.Omega || 0), 4)}° → 
              Изменение: {formatExp(stats.elementStats.Omega.range * 180 / Math.PI)}°
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs">Δω (аргумент перицентра)</Text>
            <ElementVariationBar
              value={stats.elementStats.omega.range * 180 / Math.PI}
              unit="град"
              mean={stats.elementStats.omega.mean * 180 / Math.PI}
            />
            <Text size="xs" c="dimmed" mt="xs">
              Начальное: {formatNumber((orbit?.omega || 0), 4)}° → 
              Изменение: {formatExp(stats.elementStats.omega.range * 180 / Math.PI)}°
            </Text>
          </Box>
        </SimpleGrid>
      </Card>

      {/* Quadrant analysis */}
      <Card withBorder mb="md">
        <Title order={4} mb="md">
          Анализ по квадрантам орбиты
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Средние значения ускорений в разных квадрантах аргумента широты u
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {stats.quadrantStats.map((quad, idx) => (
            <Card key={idx} withBorder p="md">
              <Text fw={600} mb="xs" c="blue">
                Квадрант {idx + 1}
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                u ∈ [{quad.uMin}°, {quad.uMax}°]
              </Text>
              <Text size="sm" mb="xs">
                <b>S:</b> {formatExp(quad.S)} м/с²
              </Text>
              <Text size="sm" mb="xs">
                <b>T:</b> {formatExp(quad.T)} м/с²
              </Text>
              <Text size="sm" mb="xs">
                <b>W:</b> {formatExp(quad.W)} м/с²
              </Text>
              <Text size="sm" fw={600}>
                |a|: {formatExp(quad.total)} м/с²
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Card>

      {/* RMS Error analysis */}
      <Card withBorder>
        <Title order={4} mb="md">
          Оценка численной точности
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Среднеквадратичные отклонения как мера точности интегрирования
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Box>
            <Text fw={600} mb="xs">
              Сохранение энергии (Δa/a)
            </Text>
            <Progress
              value={Math.min(100, Math.log10(stats.rmsErrors.energyRelativeError + 1e-16) + 16)}
              color={getEnergyColor(stats.rmsErrors.energyRelativeError)}
              size="xl"
            />
            <Text size="xs" c="dimmed" mt="xs">
              {(stats.rmsErrors.energyRelativeError).toExponential(2)}
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              Относительное изменение большой полуоси
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs">
              Гладкость траектории
            </Text>
            <Progress
              value={Math.min(100, Math.log10(stats.rmsErrors.smoothness + 1e-16) + 16)}
              color={getSmoothnessColor(stats.rmsErrors.smoothness)}
              size="xl"
            />
            <Text size="xs" c="dimmed" mt="xs">
              {formatExp(stats.rmsErrors.smoothness)} км
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              Вторая разность радиуса
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs">
              RMS ошибка Ω
            </Text>
            <Box style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 600 }}>
              {formatExp(stats.rmsErrors.rms_Omega * 180 / Math.PI)}°
            </Box>
            <Text size="xs" c="dimmed" mt="xs">
              Среднеквадратичное отклонение долготы узла
            </Text>
          </Box>

          <Box>
            <Text fw={600} mb="xs">
              RMS ошибка i
            </Text>
            <Box style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 600 }}>
              {formatExp(stats.rmsErrors.rms_i * 180 / Math.PI)}°
            </Box>
            <Text size="xs" c="dimmed" mt="xs">
              Среднеквадратичное отклонение наклонения
            </Text>
          </Box>
        </SimpleGrid>

        <Text size="sm" mt="xl" fw={600}>
          Общая оценка качества:
        </Text>
        <Text size="lg" mt="xs" c={getOverallQualityColor(stats.rmsErrors)}>
          {getOverallQuality(stats.rmsErrors)}
        </Text>
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
      />
      <Text size="xs" c="dimmed" mt="xs">
        Величина: {value.toExponential(2)} {unit}
      </Text>
      <Text size="xs" c="dimmed" mt="xs">
        Среднее отклонение: {mean.toExponential(2)} {unit}
      </Text>
    </div>
  );
}

function getEnergyColor(error: number): string {
  if (error < 1e-10) return 'green';
  if (error < 1e-8) return 'yellow';
  if (error < 1e-6) return 'orange';
  return 'red';
}

function getSmoothnessColor(smoothness: number): string {
  if (smoothness < 1e-6) return 'green';
  if (smoothness < 1e-4) return 'yellow';
  if (smoothness < 1e-2) return 'orange';
  return 'red';
}

function getOverallQualityColor(rmsErrors: any): string {
  const quality = getOverallQuality(rmsErrors);
  if (quality.includes('Отличное')) return 'green';
  if (quality.includes('Хорошее')) return 'blue';
  if (quality.includes('Удовлетворительное')) return 'yellow';
  return 'red';
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
