import { useEffect, useMemo, useState } from 'react';
import {
  AppShell,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import Plot from 'react-plotly.js';
import axios from 'axios';
import type { CalculationResponse, OrbitalElements, OrbitPoint } from '@lab/shared';
import OrbitVisualizer from './OrbitVisualizer';

type Preset = { id: number; orbit: OrbitalElements };

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

export default function App() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetId, setPresetId] = useState<string | null>('1');

  const [orbit, setOrbit] = useState<OrbitalElements>({
    a: 10000,
    e: 0.1,
    i: 10,
    Omega: 5,
    omega: 0,
    M: 0,
  });

  const [pointsCount, setPointsCount] = useState<number>(200);
  const [maxN, setMaxN] = useState<number>(4);
  const [maxK, setMaxK] = useState<number>(3);
  const [includeJ2Only, setIncludeJ2Only] = useState<boolean>(true);
  const [coordinateSystem, setCoordinateSystem] = useState<'ECI' | 'ECEF'>('ECEF');
  const [tSeconds, setTSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<Preset[]>(`${API_BASE}/presets`)
      .then((r) => {
        setPresets(r.data);
        const p1 = r.data.find((p) => p.id === 1);
        if (p1) setOrbit(p1.orbit);
      })
      .catch((e) => setError(e?.message ?? 'Failed to load presets'));
  }, []);

  useEffect(() => {
    const id = Number(presetId);
    const p = presets.find((x) => x.id === id);
    if (p) setOrbit(p.orbit);
  }, [presetId, presets]);

  const presetOptions = useMemo(
    () => presets.map((p) => ({ value: String(p.id), label: `Вариант ${p.id}` })),
    [presets],
  );

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await axios.post<CalculationResponse>(`${API_BASE}/calculate`, {
        orbit,
        options: {
          pointsCount,
          maxHarmonicN: maxN,
          maxHarmonicK: maxK,
          includeJ2Only,
          coordinateSystem,
          tSeconds,
        },
      });
      setResult(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Calculation failed');
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    setError(null);
    try {
      const r = await axios.post(`${API_BASE}/export/csv`, {
        orbit,
        options: { pointsCount, maxHarmonicN: maxN, maxHarmonicK: maxK, includeJ2Only, coordinateSystem, tSeconds },
      }, { responseType: 'blob' });
      downloadBlob(r.data, 'report.csv');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'CSV export failed');
    }
  }

  async function exportPdf() {
    setError(null);
    try {
      const r = await axios.post(`${API_BASE}/export/pdf`, {
        orbit,
        options: { pointsCount, maxHarmonicN: maxN, maxHarmonicK: maxK, includeJ2Only, coordinateSystem, tSeconds },
      }, { responseType: 'blob' });
      downloadBlob(r.data, 'report.pdf');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'PDF export failed');
    }
  }

  const points = result?.data.points ?? [];
  const heights = points.map((p) => p.height);
  const total = points.map((p) => p.acceleration.total);
  const Svals = points.map((p) => p.acceleration.S);
  const Tvals = points.map((p) => p.acceleration.T);
  const Wvals = points.map((p) => p.acceleration.W);
  const newton = points.map((p) => p.newtonAcceleration);
  const ratio = points.map((p) => (p.newtonAcceleration ? p.acceleration.total / p.newtonAcceleration : 0));
  const thetaDeg = points.map((p) => (p.theta * 180) / Math.PI);
  const OMEGA_E = 7.292115e-5; // рад/с
  const Sangle = (OMEGA_E * tSeconds * 180) / Math.PI;

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={4}>ЛР1 МКП — Возмущающее ускорение (геопотенциал)</Title>
          <Group gap="sm">
            <Button
              variant="default"
              component="a"
              href={`${API_BASE}/docs`}
              target="_blank"
              rel="noreferrer"
            >
              Swagger
            </Button>
            <Button loading={loading} onClick={run}>
              Рассчитать
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Group align="flex-start" gap="md" wrap="nowrap">
            <Box w={380}>
              <Card withBorder>
                <Stack gap="sm">
                  <Text fw={600}>Параметры орбиты</Text>
                  <Select
                    label="Пресет (вариант)"
                    data={presetOptions}
                    value={presetId}
                    onChange={setPresetId}
                    searchable
                  />
                  <NumberInput label="a, км" value={orbit.a} onChange={(v) => setOrbit({ ...orbit, a: Number(v) })} />
                  <NumberInput
                    label="e"
                    value={orbit.e}
                    min={0}
                    max={0.999999}
                    step={0.01}
                    onChange={(v) => setOrbit({ ...orbit, e: Number(v) })}
                  />
                  <NumberInput label="i, град" value={orbit.i} onChange={(v) => setOrbit({ ...orbit, i: Number(v) })} />
                  <NumberInput
                    label="Ω, град"
                    value={orbit.Omega}
                    onChange={(v) => setOrbit({ ...orbit, Omega: Number(v) })}
                  />
                  <NumberInput
                    label="ω, град"
                    value={orbit.omega}
                    onChange={(v) => setOrbit({ ...orbit, omega: Number(v) })}
                  />
                  <NumberInput label="M, град" value={orbit.M} onChange={(v) => setOrbit({ ...orbit, M: Number(v) })} />

                  <Divider />
                  <Text fw={600}>Опции расчёта</Text>
                  <NumberInput
                    label="Точек по орбите"
                    value={pointsCount}
                    min={3}
                    max={5000}
                    onChange={(v) => setPointsCount(Number(v))}
                  />
                  <Group grow>
                    <NumberInput label="n max" value={maxN} min={2} max={21} onChange={(v) => setMaxN(Number(v))} />
                    <NumberInput label="k max" value={maxK} min={0} max={21} onChange={(v) => setMaxK(Number(v))} />
                  </Group>
                  <Group grow>
                    <Select
                      label="Система координат"
                      data={[
                        { value: 'ECEF', label: 'ГСК (ECEF)' },
                        { value: 'ECI', label: 'АГЭСК (ECI)' },
                      ]}
                      value={coordinateSystem}
                      onChange={(v) => setCoordinateSystem((v as 'ECI' | 'ECEF') ?? 'ECEF')}
                    />
                    <NumberInput
                      label="t, с (звездное время)"
                      value={tSeconds}
                      min={0}
                      onChange={(v) => setTSeconds(Number(v))}
                    />
                  </Group>
                  <Text size="xs" c="dimmed">
                    S(t) = ωₑ · t ≈ {Sangle.toFixed(2)}° 
                  </Text>
                  <Switch
                    checked={includeJ2Only}
                    onChange={(e) => setIncludeJ2Only(e.currentTarget.checked)}
                    label="Считать J₂-only для сравнения"
                  />

                  <Group justify="space-between">
                    <Button variant="default" onClick={exportCsv} disabled={loading}>
                      CSV
                    </Button>
                    <Button variant="default" onClick={exportPdf} disabled={loading}>
                      PDF
                    </Button>
                    <Button loading={loading} onClick={run}>
                      Рассчитать
                    </Button>
                  </Group>

                  {error && (
                    <Text c="red" size="sm">
                      {error}
                    </Text>
                  )}
                  {result && (
                    <Text size="sm" c="dimmed">
                      Время: {result.executionTime.toFixed(1)} мс, период: {result.data.summary.period.toFixed(1)} с
                    </Text>
                  )}
                </Stack>
              </Card>
            </Box>

            <Box style={{ flex: 1 }}>
              <Tabs defaultValue="height">
                <Tabs.List mb="sm">
                  <Tabs.Tab value="height">Зависимость от высоты</Tabs.Tab>
                  <Tabs.Tab value="anomaly">От положения на орбите</Tabs.Tab>
                  <Tabs.Tab value="orbit3d">3D орбита</Tabs.Tab>
                  <Tabs.Tab value="help">Справка</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="height">
                  <Stack>
                    <Card withBorder>
                      <Text fw={600}>S, T, W и |j| в зависимости от высоты (пункт 6 ЛР)</Text>
                      <Text size="xs" c="dimmed" mb="xs">
                        График реализует пункт методички: составляющие возмущающего ускорения и полное возмущающее
                        ускорение как функция высоты.
                      </Text>
                      <Text size="xs" c="dimmed" mb="xs">
                        Расчёт выполнен в системе координат: {coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}.
                      </Text>
                      <Plot
                        data={[
                          { x: heights, y: Svals, type: 'scatter', mode: 'lines', name: 'S (м/с²)' },
                          { x: heights, y: Tvals, type: 'scatter', mode: 'lines', name: 'T (м/с²)' },
                          { x: heights, y: Wvals, type: 'scatter', mode: 'lines', name: 'W (м/с²)' },
                          { x: heights, y: total, type: 'scatter', mode: 'lines', name: '|j| (м/с²)', line: { width: 3 } },
                          { x: heights, y: newton, type: 'scatter', mode: 'lines', name: '|g| (м/с²)', line: { dash: 'dot' } },
                        ]}
                        layout={{
                          autosize: true,
                          height: 420,
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
                        Расчёт выполнен в системе координат: {coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}.
                      </Text>
                      <Plot
                        data={[{ x: heights, y: ratio, type: 'scatter', mode: 'lines', name: '|j|/|g|' }]}
                        layout={{
                          autosize: true,
                          height: 300,
                          margin: { l: 50, r: 10, t: 10, b: 40 },
                          xaxis: { title: { text: 'h, км' } },
                          yaxis: { title: { text: '|j|/|g|' } },
                        }}
                        style={{ width: '100%' }}
                        config={{ responsive: true }}
                      />
                    </Card>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="anomaly">
                  <Stack>
                    <Card withBorder>
                      <Text fw={600}>|j| и составляющие в функции истинной аномалии</Text>
                      <Text size="xs" c="dimmed" mb="xs">
                        Зависимость возмущающего ускорения от положения на орбите (по истинной аномалии θ).
                      </Text>
                      <Text size="xs" c="dimmed" mb="xs">
                        Расчёт выполнен в системе координат: {coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}.
                      </Text>
                      <Plot
                        data={[
                          { x: thetaDeg, y: Svals, type: 'scatter', mode: 'lines', name: 'S(θ)' },
                          { x: thetaDeg, y: Tvals, type: 'scatter', mode: 'lines', name: 'T(θ)' },
                          { x: thetaDeg, y: Wvals, type: 'scatter', mode: 'lines', name: 'W(θ)' },
                          { x: thetaDeg, y: total, type: 'scatter', mode: 'lines', name: '|j(θ)|', line: { width: 3 } },
                        ]}
                        layout={{
                          autosize: true,
                          height: 320,
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
                      <Text fw={600}>3D‑карта |j|(θ, h)</Text>
                      <Text size="xs" c="dimmed" mb="xs">
                        Объединяет зависимость по высоте и по положению на орбите: наглядная «поверхность» возмущений.
                      </Text>
                      <Text size="xs" c="dimmed" mb="xs">
                        Расчёт выполнен в системе координат: {coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}.
                      </Text>
                      <Plot
                        data={[
                          {
                            x: thetaDeg,
                            y: heights,
                            z: total,
                            type: 'scatter3d',
                            mode: 'lines',
                            name: '|j|',
                            line: { width: 3 },
                          } as any,
                        ]}
                        layout={{
                          autosize: true,
                          height: 420,
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
                </Tabs.Panel>

                <Tabs.Panel value="orbit3d">
                  <Stack>
                    <Card withBorder>
                      <Group justify="space-between" align="center" mb="sm">
                        <Text fw={600}>3D‑орбита и вектор возмущающего ускорения</Text>
                        <Text size="xs" c="dimmed">
                          Спутник движется по орбите, стрелка показывает направление и относительную величину |j|.
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" mb="xs">
                        Визуализация выполнена в системе координат: {coordinateSystem === 'ECEF' ? 'ГСК (ECEF)' : 'АГЭСК (ECI)'}.
                      </Text>
                      <Box style={{ height: 360 }}>
                        <OrbitVisualizer
                          points={points as OrbitPoint[]}
                          selectedIndex={selectedIndex}
                          onSelect={setSelectedIndex}
                          useECEF={coordinateSystem === 'ECEF'}
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
                              onClick={() => setSelectedIndex(p.index)}
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
                </Tabs.Panel>

                <Tabs.Panel value="help">
                  <Card withBorder>
                    <Text fw={600} mb="xs">
                      Описание вкладок
                    </Text>
                    <Text size="sm" mb="xs">
                      <strong>«Зависимость от высоты»</strong> — реализует требования методички: строятся графики S, T, W и
                      полного возмущающего ускорения |j|, а также сравнение с ньютоновским полем |g|.
                    </Text>
                    <Text size="sm" mb="xs">
                      <strong>«От положения на орбите»</strong> — показывает, как составляющие и полное |j| зависят от истинной
                      аномалии θ и высоты: 2D‑графики и 3D‑поверхность |j|(θ, h).
                    </Text>
                    <Text size="sm" mb="xs">
                      <strong>«3D орбита»</strong> — визуализация орбиты и движения спутника в выбранной системе координат
                      (ECI/ECEF). Стрелка отображает направление и относительную величину возмущающего ускорения в текущей точке.
                    </Text>
                    <Text size="sm">
                      <strong>«Справка»</strong> — краткие пояснения к интерфейсу. Подробная теория и формулы находятся в
                      лабораторной методичке и в Swagger‑документации API.
                    </Text>
                  </Card>
                </Tabs.Panel>
              </Tabs>
            </Box>
          </Group>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

