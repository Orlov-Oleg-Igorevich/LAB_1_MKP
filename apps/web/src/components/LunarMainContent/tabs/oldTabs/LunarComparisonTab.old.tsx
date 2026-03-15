import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, Text, Title, SimpleGrid, Badge, Group } from '@mantine/core';

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
      <Card withBorder>
        <Text c="dimmed" ta="center">
          Нажмите "Рассчитать" для получения данных сравнения
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

  return (
    <div>
      <Title order={3} mb="md">
        Сравнительный анализ: Возмущённая vs Невозмущённая орбита
      </Title>

      <Card withBorder mb="md">
        <Text size="sm" mb="xs">
          <b>Цель сравнения:</b> Количественная оценка влияния лунных возмущений на орбитальные элементы спутника.
        </Text>
        <Text size="sm">
          <b>Методика:</b> Сравниваются результаты численного интегрирования с учётом лунных возмущений 
          (возмущённая орбита) с решением задачи Кеплера без возмущений (невозмущённая орбита).
        </Text>
      </Card>

      {/* Summary statistics */}
      {stats && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mb="md">
          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">ΔΩ (узел)</Text>
              <Badge color="red">Max</Badge>
            </Group>
            <Text size="xl" fw={600} c="red">
              {formatNumber(stats.maxDeltaOmega, 6)}°
            </Text>
            <Text size="xs" c="dimmed">
              Финальное: {formatNumber(stats.finalDeltaOmega, 6)}°
            </Text>
          </Card>

          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Δi (наклонение)</Text>
              <Badge color="orange">Max</Badge>
            </Group>
            <Text size="xl" fw={600} c="orange">
              {formatNumber(stats.maxDeltaI, 6)}°
            </Text>
            <Text size="xs" c="dimmed">
              Финальное: {formatNumber(stats.finalDeltaI, 6)}°
            </Text>
          </Card>

          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Δe (эксцентриситет)</Text>
              <Badge color="yellow">Max</Badge>
            </Group>
            <Text size="xl" fw={600} c="yellow">
              {formatNumber(stats.maxDeltaE, 8)}
            </Text>
            <Text size="xs" c="dimmed">
              Финальное: {formatNumber(stats.finalDeltaE, 8)}
            </Text>
          </Card>

          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Δω (перицентр)</Text>
              <Badge color="blue">Max</Badge>
            </Group>
            <Text size="xl" fw={600} c="blue">
              {formatNumber(stats.maxDeltaOmega_arg, 6)}°
            </Text>
            <Text size="xs" c="dimmed">
              Финальное: {formatNumber(stats.finalDeltaOmega_arg, 6)}°
            </Text>
          </Card>

          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Δa (большая полуось)</Text>
              <Badge color="green">Max</Badge>
            </Group>
            <Text size="xl" fw={600} c="green">
              {formatNumber(stats.maxDeltaA, 4)} км
            </Text>
            <Text size="xs" c="dimmed">
              Финальное: {formatNumber(stats.finalDeltaA, 4)} км
            </Text>
          </Card>

          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Δr (радиус)</Text>
              <Badge color="violet">Max</Badge>
            </Group>
            <Text size="xl" fw={600} c="violet">
              {formatNumber(stats.maxDeltaR, 2)} км
            </Text>
            <Text size="xs" c="dimmed">
              Среднее отклонение позиции
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {/* Comparison plots - Orbital Elements */}
      <Card withBorder mb="md">
        <Title order={4} mb="md">
          Элементы орбиты: Возмущённая vs Невозмущённая
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Красная линия - возмущённая орбита (с учётом Луны), синяя пунктирная - невозмущённая (Кеплер)
        </Text>
        
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {/* Right Ascension Ω */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t_hours"
                label={{ value: 'Время, ч', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Ω, град', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: any) => [Number(value).toFixed(6) + '°', '']}
                labelFormatter={(label: any) => `t = ${Number(label).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Omega_perturbed"
                stroke="#e03131"
                strokeWidth={2}
                dot={false}
                name="Ω возмущ."
              />
              <Line
                type="monotone"
                dataKey="Omega_unperturbed"
                stroke="#1971c2"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name="Ω невозм."
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Inclination i */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t_hours"
                label={{ value: 'Время, ч', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'i, град', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: any) => [Number(value).toFixed(6) + '°', '']}
                labelFormatter={(label: any) => `t = ${Number(label).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="i_perturbed"
                stroke="#e03131"
                strokeWidth={2}
                dot={false}
                name="i возмущ."
              />
              <Line
                type="monotone"
                dataKey="i_unperturbed"
                stroke="#1971c2"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name="i невозм."
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Eccentricity e */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t_hours"
                label={{ value: 'Время, ч', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'e', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: any) => [Number(value).toFixed(8), '']}
                labelFormatter={(label: any) => `t = ${Number(label).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="e_perturbed"
                stroke="#e03131"
                strokeWidth={2}
                dot={false}
                name="e возмущ."
              />
              <Line
                type="monotone"
                dataKey="e_unperturbed"
                stroke="#1971c2"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name="e невозм."
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Argument of Perigee ω */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t_hours"
                label={{ value: 'Время, ч', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'ω, град', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: any) => [Number(value).toFixed(6) + '°', '']}
                labelFormatter={(label: any) => `t = ${Number(label).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="omega_perturbed"
                stroke="#e03131"
                strokeWidth={2}
                dot={false}
                name="ω возмущ."
              />
              <Line
                type="monotone"
                dataKey="omega_unperturbed"
                stroke="#1971c2"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name="ω невозм."
              />
            </LineChart>
          </ResponsiveContainer>
        </SimpleGrid>
      </Card>

      {/* Difference plots */}
      <Card withBorder mb="md">
        <Title order={4} mb="md">
          Разница элементов (Возмущённая - Невозмущённая)
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Количественная мера влияния лунных возмущений
        </Text>
        
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {/* ΔΩ, Δi */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t_hours"
                label={{ value: 'Время, ч', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Δ, град', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: any, name: any) => {
                  const numValue = Number(value);
                  return [
                    numValue.toExponential(4) + '°',
                    String(name).replace('delta_', 'Δ')
                  ];
                }}
                labelFormatter={(label: any) => `t = ${Number(label).toFixed(3)} ч`}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="delta_Omega"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                name="ΔΩ"
              />
              <Line
                type="monotone"
                dataKey="delta_i"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                name="Δi"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Δe, Δa */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t_hours"
                label={{ value: 'Время, ч', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Δ', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: any, name: any) => {
                  const numValue = Number(value);
                  const label = String(name).replace('delta_', 'Δ');
                  return [
                    numValue.toExponential(4) + (label.includes('a') ? ' км' : ''),
                    label
                  ];
                }}
                labelFormatter={(label: any) => `t = ${Number(label).toFixed(3)} ч`}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="delta_e"
                stroke="#ffc658"
                strokeWidth={2}
                dot={false}
                name="Δe"
              />
              <Line
                type="monotone"
                dataKey="delta_a"
                stroke="#008800"
                strokeWidth={2}
                dot={false}
                name="Δa, км"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Δω, Δr */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t_hours"
                label={{ value: 'Время, ч', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Δ, град / км', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: any, name: any) => {
                  const numValue = Number(value);
                  const label = String(name).replace('delta_', 'Δ');
                  return [
                    numValue.toExponential(4) + (label === 'r' ? ' км' : '°'),
                    label
                  ];
                }}
                labelFormatter={(label: any) => `t = ${Number(label).toFixed(3)} ч`}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="delta_omega"
                stroke="#ff7300"
                strokeWidth={2}
                dot={false}
                name="Δω"
              />
              <Line
                type="monotone"
                dataKey="delta_r"
                stroke="#9d38c2"
                strokeWidth={2}
                dot={false}
                name="Δr, км"
              />
            </LineChart>
          </ResponsiveContainer>
        </SimpleGrid>
      </Card>

      {/* Analysis and conclusions */}
      <Card withBorder>
        <Title order={4} mb="md">
          Анализ результатов сравнения
        </Title>
        
        <Text size="sm" mb="xs">
          <b>Долгота восходящего узла (Ω):</b> Лунные возмущения вызывают прецессию узла орбиты. 
          Максимальное отклонение составляет {stats ? formatNumber(stats.maxDeltaOmega, 6) : 'N/A'}°, 
          что существенно влияет на ориентацию орбитальной плоскости в пространстве.
        </Text>

        <Text size="sm" mb="xs">
          <b>Наклонение (i):</b> Изменение наклонения под действием бинормальной составляющей W 
          достигает {stats ? formatNumber(stats.maxDeltaI, 6) : 'N/A'}°. 
          Это приводит к медленному повороту орбитальной плоскости.
        </Text>

        <Text size="sm" mb="xs">
          <b>Эксцентриситет (e):</b> Под действием радиальной S и трансверсальной T составляющих 
          форма орбиты периодически изменяется с амплитудой {stats ? formatNumber(stats.maxDeltaE, 8) : 'N/A'}. 
          Это влияет на высоты апогея и перигея.
        </Text>

        <Text size="sm" mb="xs">
          <b>Аргумент перицентра (ω):</b> Наиболее сложное поведение - зависит от всех трёх составляющих. 
          Накапливающееся отклонение достигает {stats ? formatNumber(stats.maxDeltaOmega_arg, 6) : 'N/A'}°, 
          вызывая вращение линии апсид.
        </Text>

        <Text size="sm">
          <b>Большая полуось (a):</b> Изменение большой полуоси ({stats ? formatNumber(stats.maxDeltaA, 4) : 'N/A'} км) 
          свидетельствует об изменении орбитальной энергии под действием возмущений. 
          Радиальное отклонение позиции достигает {stats ? formatNumber(stats.maxDeltaR, 2) : 'N/A'} км.
        </Text>
      </Card>
    </div>
  );
}
