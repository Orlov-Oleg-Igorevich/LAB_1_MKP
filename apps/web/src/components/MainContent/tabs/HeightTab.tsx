import { Card, Stack, Text } from '@mantine/core';
import Plot from 'react-plotly.js';
import { useCallback } from 'react';
import type { OrbitPoint } from '@lab/shared';

interface HeightTabProps {
  points: OrbitPoint[];
  perigee: OrbitPoint | null;
  apogee: OrbitPoint | null;
  coordinateSystem: 'ECI' | 'ECEF';
  onPlotRef?: (name: string, ref: any) => void;
}

export default function HeightTab({ points, perigee, apogee, coordinateSystem, onPlotRef }: HeightTabProps) {
  const heights = points.map((p) => p.height);
  const total = points.map((p) => p.acceleration.total);
  const Svals = points.map((p) => p.acceleration.S);
  const Tvals = points.map((p) => p.acceleration.T);
  const Wvals = points.map((p) => p.acceleration.W);

  // Callback ref to get the underlying div element from Plot component
  const handlePlot1Ref = useCallback((node: any) => {
    if (node && node.el) {
      onPlotRef?.('height-1', node.el);
    }
  }, [onPlotRef]);

  const handlePlot2Ref = useCallback((node: any) => {
    if (node && node.el) {
      onPlotRef?.('height-2', node.el);
    }
  }, [onPlotRef]);

  return (
    <Stack>
      <Card withBorder>
        <Text fw={600}>S, T, W и |j| в зависимости от высоты (пункт 6 ЛР)</Text>
        <Text size="xs" c="dimmed" mb="xs">
          График реализует пункт методички: составляющие возмущающего ускорения и полное возмущающее
          ускорение как функция высоты.
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          Расчёт выполнен в системе координат:{' '}
          {coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}.  
        </Text>
        <Plot
          ref={handlePlot1Ref}
          data={[
            { x: heights, y: Svals, type: 'scatter', mode: 'lines', name: 'S (м/с²)' },
            { x: heights, y: Tvals, type: 'scatter', mode: 'lines', name: 'T (м/с²)' },
            { x: heights, y: Wvals, type: 'scatter', mode: 'lines', name: 'W (м/с²)' },
            {
              x: heights,
              y: total,
              type: 'scatter',
              mode: 'lines',
              name: '|j| (м/с²)',
              line: { width: 3 },
            },
            // { x: heights, y: newton, type: 'scatter', mode: 'lines', name: '|g| (м/с²)', line: { dash: 'dot' } },
            ...(perigee && apogee ? [{
              x: [perigee.height, apogee.height],
              y: [perigee.acceleration.total, apogee.acceleration.total],
              mode: 'text+markers' as const,
              type: 'scatter' as const,
              name: 'Перицентр / Апоцентр',
              text: ['Перицентр', 'Апоцентр'],
              textposition: 'top center' as const,
              marker: { color: ['red', 'blue'], size: 10 },
              showlegend: true,
            }] : [])
          ]}
          layout={{
            autosize: true,
            height: Math.max(420, window.innerHeight * 0.35),
            margin: { l: 50, r: 10, t: 10, b: 40 },
            xaxis: { title: { text: 'h, км' } },
            yaxis: { title: { text: 'ускорение, м/с²' } },
            legend: { orientation: 'h' },
          }}
          style={{ width: '100%' }}
          config={{ responsive: true }}
        />
      </Card>
      
      <Card withBorder>
        <Text fw={600}>Отношение |j| / |g| (пункт 7 ЛР)</Text>
        <Text size="xs" c="dimmed" mb="xs">
          Оценивает значимость возмущающего ускорения по сравнению с ньютоновским центральным полем.
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          Расчёт выполнен в системе координат:{' '}
          {coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}.  
        </Text>
        <Plot
          ref={handlePlot2Ref}
          data={[
            { x: heights, y: points.map((p) => (p.newtonAcceleration ? p.acceleration.total / p.newtonAcceleration : 0)), type: 'scatter', mode: 'lines', name: '|j|/|g|' },
            ...(perigee && apogee ? [{
              x: [perigee.height, apogee.height],
              y: [
                perigee.acceleration.total / perigee.newtonAcceleration,
                apogee.acceleration.total / apogee.newtonAcceleration,
              ],
              mode: 'text+markers' as const,
              type: 'scatter' as const,
              name: 'Перицентр / Апоцентр',
              text: ['Перицентр', 'Апоцентр'],
              textposition: 'top center' as const,
              marker: { color: ['red', 'blue'], size: 10 },
              showlegend: true,
            }] : []),
          ]}
          layout={{
            autosize: true,
            height: Math.max(300, window.innerHeight * 0.25),
            margin: { l: 50, r: 10, t: 10, b: 40 },
            xaxis: { title: { text: 'h, км' } },
            yaxis: { title: { text: '|j|/|g|' } },
            legend: { orientation: 'h' },
          }}
          style={{ width: '100%' }}
          config={{ responsive: true }}
        />
      </Card>
    </Stack>
  );
}
