import { useEffect, useState } from 'react';
import { AppShell, Group, Title, Button, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { CalculationResponse, OrbitalElements } from '@lab/shared';
import Sidebar from '../Sidebar';
import MainContent from '../MainContent';
import { API_BASE } from '../../utils/constants';

type Preset = { id: number; orbit: OrbitalElements };

export default function GeopotentialApp() {
  const navigate = useNavigate();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
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

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await axios.post<CalculationResponse>(`${API_BASE}/geopotential/calculate`, {
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
      const r = await axios.post(
        `${API_BASE}/geopotential/export/csv`,
        {
          orbit,
          options: { pointsCount, maxHarmonicN: maxN, maxHarmonicK: maxK, includeJ2Only, coordinateSystem, tSeconds },
        },
        { responseType: 'blob' },
      );
      downloadBlob(r.data, 'report.csv');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'CSV export failed');
    }
  }

  async function exportPdf() {
    setError(null);
    try {
      const r = await axios.post(
        `${API_BASE}/geopotential/export/pdf`,
        {
          orbit,
          options: { pointsCount, maxHarmonicN: maxN, maxHarmonicK: maxK, includeJ2Only, coordinateSystem, tSeconds },
        },
        { responseType: 'blob' },
      );
      downloadBlob(r.data, 'report.pdf');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'PDF export failed');
    }
  }

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

  return (
    <AppShell 
      header={{ height: { base: 60, lg: 56 } }} 
      navbar={{ 
        width: 380, 
        breakpoint: 'lg',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="xs" style={{ minWidth: 0, flexShrink: 1 }}>
            <Burger 
              opened={mobileOpened} 
              onClick={toggleMobile} 
              hiddenFrom="lg"
              size="sm"
              style={{ flexShrink: 0 }}
            />
            <Burger 
              opened={desktopOpened} 
              onClick={toggleDesktop} 
              visibleFrom="lg"
              size="sm"
              style={{ flexShrink: 0 }}
            />
            <Title 
              order={4} 
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: 'clamp(14px, 4vw, 18px)',
                minWidth: 0,
              }}
            >
              ЛР1 МКП — Возмущающее ускорение (геопотенциал)
            </Title>
          </Group>
          <Group gap="xs" style={{ flexShrink: 0 }}>
            <Button
              variant="default"
              onClick={() => navigate('/')}
              size="compact-sm"
            >
              ← На главную
            </Button>
            <Button
              variant="default"
              component="a"
              href={`${API_BASE}/docs`}
              target="_blank"
              rel="noreferrer"
              size="compact-sm"
            >
              Swagger
            </Button>
            <Button 
              loading={loading} 
              onClick={run}
              style={{ flexShrink: 0 }}
              size="compact-sm"
            >
              Рассчитать
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar
          presets={presets}
          presetId={presetId}
          onPresetIdChange={setPresetId}
          orbit={orbit}
          onOrbitChange={setOrbit}
          pointsCount={pointsCount}
          onPointsCountChange={setPointsCount}
          maxN={maxN}
          onMaxNChange={setMaxN}
          maxK={maxK}
          onMaxKChange={setMaxK}
          includeJ2Only={includeJ2Only}
          onIncludeJ2OnlyChange={setIncludeJ2Only}
          coordinateSystem={coordinateSystem}
          onCoordinateSystemChange={setCoordinateSystem}
          tSeconds={tSeconds}
          onTSecondsChange={setTSeconds}
          loading={loading}
          error={error}
          result={result}
          onRun={run}
          onExportCsv={exportCsv}
          onExportPdf={exportPdf}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <MainContent
          result={result}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
          coordinateSystem={coordinateSystem}
          orbit={orbit}
          desktopOpened={desktopOpened}
        />
      </AppShell.Main>
    </AppShell>
  );
}
