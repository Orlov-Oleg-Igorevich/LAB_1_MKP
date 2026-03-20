import { Box, Card, Stack, Text, Select, NumberInput, Divider, Group, Button } from '@mantine/core';
import type { OrbitalElements } from '@lab/shared';
import { OrbitalElementTooltips, IntegrationTooltips } from '../LunarMainContent/tabs/HelpTooltips';

interface LunarSidebarProps {
  presets: Array<{ id: number; orbit: OrbitalElements }>;
  presetId: string | null;
  onPresetIdChange: (value: string | null) => void;
  orbit: OrbitalElements;
  onOrbitChange: (orbit: OrbitalElements) => void;
  pointsCount: number;
  onPointsCountChange: (value: number) => void;
  stepSize: number | null;
  onStepSizeChange: (value: number | null) => void;
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
  stepSize,
  onStepSizeChange,
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
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Параметры орбиты ИСЗ</Text>
          </Group>
          
          <Select
            label="Пресет (вариант)"
            data={presetOptions}
            value={presetId}
            onChange={onPresetIdChange}
            searchable
          />
          
          <NumberInput 
            label={
              <Group gap="xs">
                <span>a, км</span>
                {OrbitalElementTooltips.semiMajorAxis}
              </Group>
            } 
            value={orbit.a} 
            onChange={(v) => onOrbitChange({ ...orbit, a: Number(v) })} 
          />
          
          <NumberInput
            label={
              <Group gap="xs">
                <span>e</span>
                {OrbitalElementTooltips.eccentricity}
              </Group>
            }
            value={orbit.e}
            min={0}
            max={0.999999}
            step={0.01}
            onChange={(v) => onOrbitChange({ ...orbit, e: Number(v) })}
          />
          
          <NumberInput 
            label={
              <Group gap="xs">
                <span>i, град</span>
                {OrbitalElementTooltips.inclination}
              </Group>
            } 
            value={orbit.i} 
            onChange={(v) => onOrbitChange({ ...orbit, i: Number(v) })} 
          />
          
          <NumberInput
            label={
              <Group gap="xs">
                <span>Ω, град</span>
                {OrbitalElementTooltips.raan}
              </Group>
            }
            value={orbit.Omega}
            onChange={(v) => onOrbitChange({ ...orbit, Omega: Number(v) })}
          />
          
          <NumberInput
            label={
              <Group gap="xs">
                <span>ω, град</span>
                {OrbitalElementTooltips.argOfPerigee}
              </Group>
            }
            value={orbit.omega}
            onChange={(v) => onOrbitChange({ ...orbit, omega: Number(v) })}
          />
          
          <NumberInput 
            label={
              <Group gap="xs">
                <span>M, град</span>
                {OrbitalElementTooltips.meanAnomaly}
              </Group>
            } 
            value={orbit.M} 
            onChange={(v) => onOrbitChange({ ...orbit, M: Number(v) })} 
          />

          <Divider />
          
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Опции расчёта</Text>
            {IntegrationTooltips.pointsCount}
          </Group>
          
          <NumberInput
            label={
              <Group gap="xs">
                <span>Точек по орбите</span>
                {IntegrationTooltips.pointsCount}
              </Group>
            }
            value={pointsCount}
            min={3}
            max={5000}
            onChange={(v) => onPointsCountChange(Number(v))}
          />
          
          <NumberInput
            label={
              <Group gap="xs">
                <span>Шаг интегрирования, с</span>
                {IntegrationTooltips.stepSize}
              </Group>
            }
            value={stepSize ?? ''}
            placeholder="Авто (60 с)"
            min={1}
            max={300}
            step={1}
            onChange={(v) => onStepSizeChange(v === null || v === '' ? null : Number(v))}
            description="Оставьте пустым для автовыбора (рек. 10-100 с)"
            error={stepSize !== null && (stepSize < 10 || stepSize > 100) 
              ? 'Рекомендуемый диапазон: 10-100 с. Большие шаги могут снизить точность.' 
              : undefined}
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
