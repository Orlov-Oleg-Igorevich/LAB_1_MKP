import { Card, Stack, Text } from '@mantine/core';
import Plot from 'react-plotly.js';
import { useCallback } from 'react';
import type { OrbitPoint } from '@lab/shared';

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

  return (
    <Stack>
      <Card withBorder>
        <Text fw={600}>|j| и составляющие в функции истинной аномалии</Text>
        <Text size="xs" c="dimmed" mb="xs">
          Зависимость возмущающего ускорения от положения на орбите (по истинной аномалии θ).
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          Расчёт выполнен в системе координат:{' '}
          {coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}.  
        </Text>
        <Plot
          ref={handlePlot1Ref}
          data={[
            { x: thetaDeg, y: Svals, type: 'scatter', mode: 'lines', name: 'S(θ)' },
            { x: thetaDeg, y: Tvals, type: 'scatter', mode: 'lines', name: 'T(θ)' },
            { x: thetaDeg, y: Wvals, type: 'scatter', mode: 'lines', name: 'W(θ)' },
            {
              x: thetaDeg,
              y: total,
              type: 'scatter',
              mode: 'lines',
              name: '|j(θ)|',
              line: { width: 3 },
            },
            ...(perigee && apogee ? [{
              x: [(perigee.theta * 180) / Math.PI, (apogee.theta * 180) / Math.PI],
              y: [perigee.acceleration.total, apogee.acceleration.total],
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
            height: Math.max(320, window.innerHeight * 0.3),
            margin: { l: 50, r: 10, t: 10, b: 40 },
            xaxis: { title: { text: 'θ, град' } },
            yaxis: { title: { text: 'ускорение, м/с²' } },
            legend: { orientation: 'h' },
          }}
          style={{ width: '100%' }}
          config={{ responsive: true }}
        />
      </Card>

      <Card withBorder>
        <Text fw={600}>Траектория в координатах (θ, h, |j|)</Text>
        <Text size="xs" c="dimmed" mb="xs">
          Объединяет зависимость по высоте и по положению на орбите: наглядная линия, окрашенная по
          величине |j|.
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          Расчёт выполнен в системе координат:{' '}
          {coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}.  
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
                colorbar: { title: '|j|, м/с²' },
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
              xaxis: { title: { text: 'θ, град' } },
              yaxis: { title: { text: 'h, км' } },
              zaxis: { title: { text: '|j|, м/с²' } },
            },
          }}
          style={{ width: '100%' }}
          config={{ responsive: true }}
        />
      </Card>
    </Stack>
  );
}
