import { useEffect, useState } from 'react';
import { AppShell, Group, Title, Button, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import axios from 'axios';
import type { OrbitalElements } from '@lab/shared';
import LunarSidebar from '../LunarSidebar';
import LunarMainContent from '../LunarMainContent';
import { API_BASE } from '../../utils/constants';

type Preset = { id: number; orbit: OrbitalElements };

export default function LunarApp() {
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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
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
      const r = await axios.post(`${API_BASE}/lunar/calculate`, {
        orbit,
        moon: {
          i: 5.145,
          e: 0.0549,
          a: 384399,
          Omega: 30,
          u: 5,
        },
        options: {
          pointsCount,
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
    if (!result) return;
    try {
      const response = await axios.post(`${API_BASE}/export/lunar-csv`, {
        orbit,
        moon: {
          i: 5.145,
          e: 0.0549,
          a: 384399,
          Omega: 30,
          u: 5,
        },
        options: {
          pointsCount,
        },
      }, {
        responseType: 'blob',
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'lunar_perturbation_report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      console.error('CSV Export Error:', e);
      alert('Failed to export CSV: ' + (e?.message ?? 'Unknown error'));
    }
  }

  async function exportPdf() {
    if (!result) return;
    try {
      const response = await axios.post(`${API_BASE}/export/lunar-pdf`, {
        orbit,
        moon: {
          i: 5.145,
          e: 0.0549,
          a: 384399,
          Omega: 30,
          u: 5,
        },
        options: {
          pointsCount,
        },
      }, {
        responseType: 'blob',
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'lunar_perturbation_report.pdf');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      console.error('PDF Export Error:', e);
      alert('Failed to export PDF: ' + (e?.message ?? 'Unknown error'));
    }
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
              ЛР2 — Лунные возмущения
            </Title>
          </Group>
          <Group gap="sm" style={{ flexShrink: 0 }}>
            <Button
              variant="default"
              component="a"
              href="/"
              size="compact-sm"
            >
              На главную
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
        <LunarSidebar
          presets={presets}
          presetId={presetId}
          onPresetIdChange={setPresetId}
          orbit={orbit}
          onOrbitChange={setOrbit}
          pointsCount={pointsCount}
          onPointsCountChange={setPointsCount}
          loading={loading}
          error={error}
          result={result}
          onRun={run}
          onExportCsv={exportCsv}
          onExportPdf={exportPdf}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <LunarMainContent
          result={result}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
          orbit={orbit}
          desktopOpened={desktopOpened}
        />
      </AppShell.Main>
    </AppShell>
  );
}
