import { Box, Card, Stack, Text, Select, NumberInput, Divider, Group, Button } from '@mantine/core';
import type { OrbitalElements } from '@lab/shared';

interface LunarSidebarProps {
  presets: Array<{ id: number; orbit: OrbitalElements }>;
  presetId: string | null;
  onPresetIdChange: (value: string | null) => void;
  orbit: OrbitalElements;
  onOrbitChange: (orbit: OrbitalElements) => void;
  pointsCount: number;
  onPointsCountChange: (value: number) => void;
  loading: boolean;
  error: string | null;
  result: any | null;
  onRun: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export default function LunarSidebar({
  presets,
  presetId,
  onPresetIdChange,
  orbit,
  onOrbitChange,
  pointsCount,
  onPointsCountChange,
  loading,
  error,
  result,
  onRun,
  onExportCsv,
  onExportPdf,
}: LunarSidebarProps) {
  const presetOptions = presets.map((p) => ({ value: String(p.id), label: `Вариант ${p.id}` }));

  return (
    <Box style={{ height: '100%', overflowY: 'auto' }}>
      <Card withBorder>
        <Stack gap="sm">
          <Text fw={600}>Параметры орбиты ИСЗ</Text>
          
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

          <Group justify="space-between">
            <Button 
              variant="default" 
              onClick={onExportCsv}
              disabled={!result || loading}
              title={!result ? 'Сначала выполните расчёт' : undefined}
            >
              CSV
            </Button>
            <Button 
              variant="default"
              onClick={onExportPdf}
              disabled={!result || loading}
              title={!result ? 'Сначала выполните расчёт' : undefined}
            >
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
              Время: {result.executionTime.toFixed(1)} мс
            </Text>
          )}
        </Stack>
      </Card>
    </Box>
  );
}
