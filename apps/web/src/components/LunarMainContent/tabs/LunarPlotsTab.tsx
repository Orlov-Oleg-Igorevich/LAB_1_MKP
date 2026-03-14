import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, Text, Title, SimpleGrid } from '@mantine/core';

interface LunarPlotsTabProps {
  points: any[];
  orbit?: any;
}

export default function LunarPlotsTab({ points, orbit }: LunarPlotsTabProps) {
  // Prepare data for charts
  const chartData = useMemo(() => {
    return points.map((p, idx) => ({
      index: idx,
      time: p.t,
      u_deg: p.u * (180 / Math.PI), // argument of latitude in degrees
      Omega_deg: p.orbitalElements.Omega * (180 / Math.PI),
      i_deg: p.orbitalElements.i * (180 / Math.PI),
      e: p.orbitalElements.e,
      omega_deg: p.orbitalElements.omega * (180 / Math.PI),
      p: p.orbitalElements.p,
      deltaOmega: p.changes.deltaOmega,
      deltaI: p.changes.deltaI,
      deltaE: p.changes.deltaE,
      deltaOmega_arg: p.changes.deltaOmega_arg,
      deltaP: p.changes.deltaP,
      // For u-dependency plots (normalize to first point)
      deltaOmega_u: p.changes.deltaOmega,
      deltaI_u: p.changes.deltaI,
      deltaE_u: p.changes.deltaE,
      deltaOmega_arg_u: p.changes.deltaOmega_arg,
      deltaP_u: p.changes.deltaP,
      S_ms2: p.acceleration.S,
      T_ms2: p.acceleration.T,
      W_ms2: p.acceleration.W,
      total_ms2: p.acceleration.total,
    }));
  }, [points]);

  if (!points || points.length === 0) {
    return (
      <Card withBorder>
        <Text c="dimmed" ta="center">
          Нажмите "Рассчитать" для получения данных
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

  return (
    <div>
      <Title order={3} mb="md">
        Графики изменения орбитальных элементов
      </Title>

      {/* Summary cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md" mb="md">
        <Card withBorder>
          <Text size="sm" c="dimmed">
            ΔΩ (узел)
          </Text>
          <Text
            size="lg"
            fw={600}
            c={totalChanges.deltaOmega > 0 ? 'red' : totalChanges.deltaOmega < 0 ? 'green' : 'gray'}
          >
            {formatNumber(totalChanges.deltaOmega, 6)}°
          </Text>
          <Text size="xs" c="dimmed">
            за {(totalTime / 3600).toFixed(2)} ч
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed">
            Δi (наклонение)
          </Text>
          <Text
            size="lg"
            fw={600}
            c={totalChanges.deltaI > 0 ? 'red' : totalChanges.deltaI < 0 ? 'green' : 'gray'}
          >
            {formatNumber(totalChanges.deltaI, 6)}°
          </Text>
          <Text size="xs" c="dimmed">
            за {(totalTime / 3600).toFixed(2)} ч
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed">
            Δe (эксцентриситет)
          </Text>
          <Text
            size="lg"
            fw={600}
            c={totalChanges.deltaE > 0 ? 'red' : totalChanges.deltaE < 0 ? 'green' : 'gray'}
          >
            {formatNumber(totalChanges.deltaE, 8)}
          </Text>
          <Text size="xs" c="dimmed">
            за {(totalTime / 3600).toFixed(2)} ч
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed">
            Δω (перицентр)
          </Text>
          <Text
            size="lg"
            fw={600}
            c={totalChanges.deltaOmega_arg > 0 ? 'red' : totalChanges.deltaOmega_arg < 0 ? 'green' : 'gray'}
          >
            {formatNumber(totalChanges.deltaOmega_arg, 6)}°
          </Text>
          <Text size="xs" c="dimmed">
            за {(totalTime / 3600).toFixed(2)} ч
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed">
            Δp (фокальный)
          </Text>
          <Text
            size="lg"
            fw={600}
            c={totalChanges.deltaP > 0 ? 'red' : totalChanges.deltaP < 0 ? 'green' : 'gray'}
          >
            {formatNumber(totalChanges.deltaP, 4)} км
          </Text>
          <Text size="xs" c="dimmed">
            за {(totalTime / 3600).toFixed(2)} ч
          </Text>
        </Card>
      </SimpleGrid>

      {/* Acceleration plots */}
      <Card withBorder mt="md">
        <Title order={4} mb="md">
          Возмущающие ускорения от притяжения Луны
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Три составляющие возмущающего ускорения в орбитальной системе координат:
          S — радиальная, T — трансверсальная, W — бинормальная
        </Text>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {/* Radial acceleration S */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: 'Время, с', position: 'insideBottom', offset: -5 }}
                tickFormatter={(t: number) => (t / 3600).toFixed(1) + 'ч'}
              />
              <YAxis
                label={{ value: 'S, м/с²', angle: -90, position: 'insideLeft' }}
                tickFormatter={(val: number) => val.toExponential(1)}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [numValue.toExponential(4) + ' м/с²', 'S'];
                }}
                labelFormatter={(label: any) => `Время: ${(Number(label) / 3600).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="S_ms2"
                stroke="#e03131"
                strokeWidth={2}
                dot={false}
                name="S (радиальная)"
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>

          {/* Transverse acceleration T */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: 'Время, с', position: 'insideBottom', offset: -5 }}
                tickFormatter={(t: number) => (t / 3600).toFixed(1) + 'ч'}
              />
              <YAxis
                label={{ value: 'T, м/с²', angle: -90, position: 'insideLeft' }}
                tickFormatter={(val: number) => val.toExponential(1)}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [numValue.toExponential(4) + ' м/с²', 'T'];
                }}
                labelFormatter={(label: any) => `Время: ${(Number(label) / 3600).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="T_ms2"
                stroke="#1971c2"
                strokeWidth={2}
                dot={false}
                name="T (трансверсальная)"
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>

          {/* Normal acceleration W */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: 'Время, с', position: 'insideBottom', offset: -5 }}
                tickFormatter={(t: number) => (t / 3600).toFixed(1) + 'ч'}
              />
              <YAxis
                label={{ value: 'W, м/с²', angle: -90, position: 'insideLeft' }}
                tickFormatter={(val: number) => val.toExponential(1)}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [numValue.toExponential(4) + ' м/с²', 'W'];
                }}
                labelFormatter={(label: any) => `Время: ${(Number(label) / 3600).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="W_ms2"
                stroke="#2b8a3e"
                strokeWidth={2}
                dot={false}
                name="W (бинормальная)"
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>

          {/* Total acceleration */}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: 'Время, с', position: 'insideBottom', offset: -5 }}
                tickFormatter={(t: number) => (t / 3600).toFixed(1) + 'ч'}
              />
              <YAxis
                label={{ value: '|a|, м/с²', angle: -90, position: 'insideLeft' }}
                tickFormatter={(val: number) => val.toExponential(1)}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [numValue.toExponential(4) + ' м/с²', '|a|'];
                }}
                labelFormatter={(label: any) => `Время: ${(Number(label) / 3600).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_ms2"
                stroke="#f08c00"
                strokeWidth={2}
                dot={false}
                name="|a| (полное)"
              />
            </LineChart>
          </ResponsiveContainer>
        </SimpleGrid>
      </Card>

      {/* Charts */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" mb="md">
        {/* Ω (Right Ascension) */}
        <Card withBorder>
          <Title order={4} mb="md">
            Долгота восходящего узла Ω(t)
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: 'Время, с', position: 'insideBottom', offset: -5 }}
                tickFormatter={(t) => (t / 3600).toFixed(1) + 'ч'}
              />
              <YAxis
                label={{ value: 'Ω, град', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [numValue.toFixed(6) + '°', 'Ω'];
                }}
                labelFormatter={(label: any) => `Время: ${(Number(label) / 3600).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Omega_deg"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                name="Ω (град)"
              />
              <ReferenceLine y={firstPoint.orbitalElements.Omega * (180 / Math.PI)} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Inclination */}
        <Card withBorder>
          <Title order={4} mb="md">
            Наклонение орбиты i(t)
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: 'Время, с', position: 'insideBottom', offset: -5 }}
                tickFormatter={(t) => (t / 3600).toFixed(1) + 'ч'}
              />
              <YAxis
                label={{ value: 'i, град', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [numValue.toFixed(6) + '°', 'i'];
                }}
                labelFormatter={(label: any) => `Время: ${(Number(label) / 3600).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="i_deg"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                name="i (град)"
              />
              <ReferenceLine y={firstPoint.orbitalElements.i * (180 / Math.PI)} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Eccentricity */}
        <Card withBorder>
          <Title order={4} mb="md">
            Эксцентриситет e(t)
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: 'Время, с', position: 'insideBottom', offset: -5 }}
                tickFormatter={(t) => (t / 3600).toFixed(1) + 'ч'}
              />
              <YAxis
                label={{ value: 'e', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [numValue.toFixed(8), 'e'];
                }}
                labelFormatter={(label: any) => `Время: ${(Number(label) / 3600).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="e"
                stroke="#ffc658"
                strokeWidth={2}
                dot={false}
                name="e"
              />
              <ReferenceLine y={firstPoint.orbitalElements.e} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Argument of Perigee */}
        <Card withBorder>
          <Title order={4} mb="md">
            Аргумент перицентра ω(t)
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: 'Время, с', position: 'insideBottom', offset: -5 }}
                tickFormatter={(t) => (t / 3600).toFixed(1) + 'ч'}
              />
              <YAxis
                label={{ value: 'ω, град', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [numValue.toFixed(6) + '°', 'ω'];
                }}
                labelFormatter={(label: any) => `Время: ${(Number(label) / 3600).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="omega_deg"
                stroke="#ff7300"
                strokeWidth={2}
                dot={false}
                name="ω (град)"
              />
              <ReferenceLine y={firstPoint.orbitalElements.omega * (180 / Math.PI)} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </SimpleGrid>

      {/* Delta plots */}
      <Card withBorder>
        <Title order={4} mb="md">
          Изменения элементов орбиты (Δ от начального значения)
        </Title>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: 'Время, с', position: 'insideBottom', offset: -5 }}
                tickFormatter={(t: number) => (t / 3600).toFixed(1) + 'ч'}
              />
              <YAxis
                label={{ value: 'Δ, град', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value, name) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [
                    formatNumber(numValue, String(name).includes('Ω') || String(name).includes('i') || String(name).includes('ω') ? 6 : 4) + 
                    (String(name).includes('Ω') || String(name).includes('i') || String(name).includes('ω') ? '°' : ''),
                    String(name)
                  ];
                }}
                labelFormatter={(label: any) => `Время: ${(Number(label) / 3600).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="deltaOmega"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                name="ΔΩ (град)"
              />
              <Line
                type="monotone"
                dataKey="deltaI"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                name="Δi (град)"
              />
              <Line
                type="monotone"
                dataKey="deltaOmega_arg"
                stroke="#ff7300"
                strokeWidth={2}
                dot={false}
                name="Δω (град)"
              />
            </LineChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: 'Время, с', position: 'insideBottom', offset: -5 }}
                tickFormatter={(t: number) => (t / 3600).toFixed(1) + 'ч'}
              />
              <YAxis
                label={{ value: 'Δ', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value, name) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [
                    formatNumber(numValue, String(name) === 'Δe' ? 8 : 4),
                    String(name)
                  ];
                }}
                labelFormatter={(label: any) => `Время: ${(Number(label) / 3600).toFixed(3)} ч`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="deltaE"
                stroke="#ffc658"
                strokeWidth={2}
                dot={false}
                name="Δe"
              />
            </LineChart>
          </ResponsiveContainer>
        </SimpleGrid>
      </Card>

      {/* Plots vs argument of latitude u */}
      <Card withBorder mt="md">
        <Title order={4} mb="md">
          Зависимость изменений от аргумента широты u
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Аргумент широты u = ω + ϑ характеризует положение спутника на орбите.
          Возмущения наиболее сильно зависят от этой величины.
        </Text>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {/* ΔΩ(u), Δi(u), Δω(u) */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="u_deg"
                label={{ value: 'Аргумент широты u, град', position: 'insideBottom', offset: -5 }}
                domain={[0, 360]}
                ticks={[0, 90, 180, 270, 360]}
              />
              <YAxis
                label={{ value: 'Δ, град', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value, name) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [
                    numValue.toFixed(6) + '°',
                    String(name)
                  ];
                }}
                labelFormatter={(label: any) => `u = ${Number(label).toFixed(1)}°`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="deltaOmega_u"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                name="ΔΩ(u)"
              />
              <Line
                type="monotone"
                dataKey="deltaI_u"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                name="Δi(u)"
              />
              <Line
                type="monotone"
                dataKey="deltaOmega_arg_u"
                stroke="#ff7300"
                strokeWidth={2}
                dot={false}
                name="Δω(u)"
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>

          {/* Δe(u), Δp(u) */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="u_deg"
                label={{ value: 'Аргумент широты u, град', position: 'insideBottom', offset: -5 }}
                domain={[0, 360]}
                ticks={[0, 90, 180, 270, 360]}
              />
              <YAxis
                label={{ value: 'Δ', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value, name) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [
                    formatNumber(numValue, String(name) === 'Δe' ? 8 : 4),
                    String(name)
                  ];
                }}
                labelFormatter={(label: any) => `u = ${Number(label).toFixed(1)}°`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="deltaE_u"
                stroke="#ffc658"
                strokeWidth={2}
                dot={false}
                name="Δe(u)"
              />
              <Line
                type="monotone"
                dataKey="deltaP_u"
                stroke="#008800"
                strokeWidth={2}
                dot={false}
                name="Δp(u), км"
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </SimpleGrid>
      </Card>

      {/* Acceleration vs u plots */}
      <Card withBorder mt="md">
        <Title order={4} mb="md">
          Возмущающие ускорения от аргумента широты
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Зависимость компонент возмущающего ускорения от положения спутника на орбите
        </Text>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {/* S(u), T(u) */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="u_deg"
                label={{ value: 'Аргумент широты u, град', position: 'insideBottom', offset: -5 }}
                domain={[0, 360]}
                ticks={[0, 90, 180, 270, 360]}
              />
              <YAxis
                label={{ value: 'S, T (м/с²)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(val: number) => val.toExponential(1)}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value, name) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [numValue.toExponential(4) + ' м/с²', String(name)];
                }}
                labelFormatter={(label: any) => `u = ${Number(label).toFixed(1)}°`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="S_ms2"
                stroke="#e03131"
                strokeWidth={2}
                dot={false}
                name="S(u) (радиальная)"
              />
              <Line
                type="monotone"
                dataKey="T_ms2"
                stroke="#1971c2"
                strokeWidth={2}
                dot={false}
                name="T(u) (трансверсальная)"
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>

          {/* W(u), total(u) */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="u_deg"
                label={{ value: 'Аргумент широты u, град', position: 'insideBottom', offset: -5 }}
                domain={[0, 360]}
                ticks={[0, 90, 180, 270, 360]}
              />
              <YAxis
                label={{ value: '|a|, W (м/с²)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(val: number) => val.toExponential(1)}
              />
              <Tooltip
                // @ts-ignore - Recharts ValueType includes arrays but we handle only primitive values
                formatter={(value, name) => {
                  const numValue = Array.isArray(value) ? 0 : (typeof value === 'number' || typeof value === 'string' ? Number(value) : 0);
                  return [numValue.toExponential(4) + ' м/с²', String(name)];
                }}
                labelFormatter={(label: any) => `u = ${Number(label).toFixed(1)}°`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="W_ms2"
                stroke="#2b8a3e"
                strokeWidth={2}
                dot={false}
                name="W(u) (бинормальная)"
              />
              <Line
                type="monotone"
                dataKey="total_ms2"
                stroke="#f08c00"
                strokeWidth={2}
                dot={false}
                name="|a|(u) (полная)"
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </SimpleGrid>
      </Card>

      {/* Analysis text */}
      <Card withBorder mt="md">
        <Title order={4} mb="md">
          Анализ результатов
        </Title>
        <Text size="sm" mb="xs">
          На графиках видно, как лунные возмущения влияют на орбитальные элементы спутника в течение одного витка.
        </Text>
        <Text size="sm" mb="xs">
          <strong>Долгота восходящего узла (Ω):</strong> Изменяется под действием бинормальной составляющей W возмущающего ускорения. 
          Скорость изменения зависит от аргумента широты u.
        </Text>
        <Text size="sm" mb="xs">
          <strong>Наклонение (i):</strong> Также испытывает периодические изменения из-за воздействия W-составляющей. 
          Амплитуда изменений зависит от взаимной ориентации орбит спутника и Луны.
        </Text>
        <Text size="sm" mb="xs">
          <strong>Эксцентриситет (e):</strong> Изменяется под действием радиальной S и трансверсальной T составляющих. 
          Форма орбиты периодически меняется.
        </Text>
        <Text size="sm">
          <strong>Аргумент перицентра (ω):</strong> Испыывает наиболее сложные изменения, так как зависит от всех трёх составляющих 
          возмущающего ускорения (S, T, W).
        </Text>
      </Card>
    </div>
  );
}
