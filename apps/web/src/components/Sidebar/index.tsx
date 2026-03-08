import { Box, Card, Stack, Text, Select, NumberInput, Divider, Group, Button, Switch } from '@mantine/core';
import type { CalculationResponse, OrbitalElements } from '@lab/shared';

interface SidebarProps {
  presets: Array<{ id: number; orbit: OrbitalElements }>;
  presetId: string | null;
  onPresetIdChange: (value: string | null) => void;
  orbit: OrbitalElements;
  onOrbitChange: (orbit: OrbitalElements) => void;
  pointsCount: number;
  onPointsCountChange: (value: number) => void;
  maxN: number;
  onMaxNChange: (value: number) => void;
  maxK: number;
  onMaxKChange: (value: number) => void;
  includeJ2Only: boolean;
  onIncludeJ2OnlyChange: (value: boolean) => void;
  coordinateSystem: 'ECI' | 'ECEF';
  onCoordinateSystemChange: (value: 'ECI' | 'ECEF') => void;
  tSeconds: number;
  onTSecondsChange: (value: number) => void;
  loading: boolean;
  error: string | null;
  result: CalculationResponse | null;
  onRun: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

const OMEGA_E = 7.292115e-5;

export default function Sidebar({
  presets,
  presetId,
  onPresetIdChange,
  orbit,
  onOrbitChange,
  pointsCount,
  onPointsCountChange,
  maxN,
  onMaxNChange,
  maxK,
  onMaxKChange,
  includeJ2Only,
  onIncludeJ2OnlyChange,
  coordinateSystem,
  onCoordinateSystemChange,
  tSeconds,
  onTSecondsChange,
  loading,
  error,
  result,
  onRun,
  onExportCsv,
  onExportPdf,
}: SidebarProps) {
  const presetOptions = presets.map((p) => ({ value: String(p.id), label: `Вариант ${p.id}` }));
  const Sangle = (OMEGA_E * tSeconds * 180) / Math.PI;

  return (
    <Box style={{ height: '100%', overflowY: 'auto' }}>
      <Card withBorder>
        <Stack gap="sm">
          <Text fw={600}>Параметры орбиты</Text>
          
          <Select
            label="Пресет (вариант)"
            data={presetOptions}
            value={presetId}
            onChange={onPresetIdChange}
            searchable
          />
          
          <NumberInput 
            label="a, км" 
            value={orbit.a} 
            onChange={(v) => onOrbitChange({ ...orbit, a: Number(v) })} 
          />
          
          <NumberInput
            label="e"
            value={orbit.e}
            min={0}
            max={0.999999}
            step={0.01}
            onChange={(v) => onOrbitChange({ ...orbit, e: Number(v) })}
          />
          
          <NumberInput 
            label="i, град" 
            value={orbit.i} 
            onChange={(v) => onOrbitChange({ ...orbit, i: Number(v) })} 
          />
          
          <NumberInput
            label="Ω, град"
            value={orbit.Omega}
            onChange={(v) => onOrbitChange({ ...orbit, Omega: Number(v) })}
          />
          
          <NumberInput
            label="ω, град"
            value={orbit.omega}
            onChange={(v) => onOrbitChange({ ...orbit, omega: Number(v) })}
          />
          
          <NumberInput 
            label="M, град" 
            value={orbit.M} 
            onChange={(v) => onOrbitChange({ ...orbit, M: Number(v) })} 
          />

          <Divider />
          
          <Text fw={600}>Опции расчёта</Text>
          
          <NumberInput
            label="Точек по орбите"
            value={pointsCount}
            min={3}
            max={5000}
            onChange={(v) => onPointsCountChange(Number(v))}
          />
          
          <Group grow>
            <NumberInput 
              label="n max" 
              value={maxN} 
              min={2} 
              max={21} 
              onChange={(v) => onMaxNChange(Number(v))} 
            />
            <NumberInput 
              label="k max" 
              value={maxK} 
              min={0} 
              max={21} 
              onChange={(v) => onMaxKChange(Number(v))} 
            />
          </Group>
          
          <Group grow>
            <Select
              label="Система координат"
              data={[
                { value: 'ECEF', label: 'ГСК (ECEF)' },
                { value: 'ECI', label: 'АГЭСК (ECI)' },
              ]}
              value={coordinateSystem}
              onChange={(v) => onCoordinateSystemChange((v as 'ECI' | 'ECEF') ?? 'ECEF')}
            />
            
            <NumberInput
              label="t, с (звездное время)"
              value={tSeconds}
              min={0}
              onChange={(v) => onTSecondsChange(Number(v))}
            />
          </Group>
          
          <Text size="xs" c="dimmed">
            S(t) = ωₑ · t ≈ {Sangle.toFixed(2)}°
          </Text>
          
          <Switch
            checked={includeJ2Only}
            onChange={(e) => onIncludeJ2OnlyChange(e.currentTarget.checked)}
            label="Считать J₂-only для сравнения"
          />

          <Group justify="space-between">
            <Button variant="default" onClick={onExportCsv} disabled={loading}>
              CSV
            </Button>
            <Button variant="default" onClick={onExportPdf} disabled={loading}>
              PDF
            </Button>
            <Button loading={loading} onClick={onRun}>
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
  );
}
