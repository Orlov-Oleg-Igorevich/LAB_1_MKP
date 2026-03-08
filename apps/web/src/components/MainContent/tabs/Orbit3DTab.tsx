import { Card, Stack, Text, Group, Box, Table } from '@mantine/core';
import type { CalculationResponse, OrbitalElements, OrbitPoint } from '@lab/shared';
import OrbitVisualizer from '../../OrbitVisualizer/index';

interface Orbit3DTabProps {
  result: CalculationResponse | null;
  points: OrbitPoint[];
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  coordinateSystem: 'ECI' | 'ECEF';
  orbit: OrbitalElements;
  desktopOpened: boolean;
}

export default function Orbit3DTab({
  result,
  points,
  selectedIndex,
  onSelectedIndexChange,
  coordinateSystem,
  orbit,
}: Orbit3DTabProps) {
  return (
    <Stack>
      <Card withBorder>
        <Group justify="space-between" align="center" mb="sm">
          <Text fw={600}>3D‑орбита и вектор возмущающего ускорения</Text>
          <Text size="xs" c="dimmed">
            Спутник движется по орбите, стрелка показывает направление и относительную величину |j|.
          </Text>
        </Group>
        <Text size="xs" c="dimmed" mb="xs">
          Визуализация выполнена в системе координат:{' '}
          {coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}.
        </Text>
        <Box
          style={{
            height: '60vh',
            minHeight: 400,
            width: '100%',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <OrbitVisualizer
            key={`${coordinateSystem}-${orbit.a}-${orbit.e}`}
            points={points as OrbitPoint[]}
            selectedIndex={selectedIndex}
            onSelect={onSelectedIndexChange}
            useECEF={coordinateSystem === 'ECEF'}
            orbitalElements={{
              a: orbit.a,
              e: orbit.e,
              i: (orbit.i * Math.PI) / 180,
              Omega: (orbit.Omega * Math.PI) / 180,
              omega: (orbit.omega * Math.PI) / 180,
            }}
          />
        </Box>
      </Card>

      <Card withBorder>
        <Group justify="space-between" align="center">
          <Text fw={600}>Первые точки (таблица результатов)</Text>
          {result && (
            <Text size="sm" c="dimmed">
              min={result.data.summary.minAcceleration.toExponential(3)} max=
              {result.data.summary.maxAcceleration.toExponential(3)} avg=
              {result.data.summary.avgAcceleration.toExponential(3)}
            </Text>
          )}
        </Group>
        <Text size="xs" c="dimmed" mt="xs">
          Выберите индекс точки: спутник на 3D‑сцене перейдёт в соответствующее положение.
        </Text>
        <Table striped highlightOnHover withTableBorder withColumnBorders mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>h, км</Table.Th>
              <Table.Th>S</Table.Th>
              <Table.Th>T</Table.Th>
              <Table.Th>W</Table.Th>
              <Table.Th>|j|</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {points.slice(0, 20).map((p) => (
              <Table.Tr
                key={p.index}
                onClick={() => onSelectedIndexChange(p.index)}
                style={{ cursor: 'pointer' }}
              >
                <Table.Td>{p.index}</Table.Td>
                <Table.Td>{p.height.toFixed(2)}</Table.Td>
                <Table.Td>{p.acceleration.S.toExponential(3)}</Table.Td>
                <Table.Td>{p.acceleration.T.toExponential(3)}</Table.Td>
                <Table.Td>{p.acceleration.W.toExponential(3)}</Table.Td>
                <Table.Td>{p.acceleration.total.toExponential(3)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
