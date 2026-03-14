import { Card, Text, Title, SimpleGrid } from '@mantine/core';

interface LunarElementsTabProps {
  points: any[];
}

export default function LunarElementsTab({ points }: LunarElementsTabProps) {
  if (!points || points.length === 0) {
    return (
      <Card withBorder>
        <Text c="dimmed" ta="center">
          Нажмите "Рассчитать" для получения данных
        </Text>
      </Card>
    );
  }

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  // Calculate changes in orbital elements (using correct structure)
  const deltaOmega = (lastPoint.orbitalElements.Omega - firstPoint.orbitalElements.Omega) * (180 / Math.PI);
  const deltaI = (lastPoint.orbitalElements.i - firstPoint.orbitalElements.i) * (180 / Math.PI);
  const deltaP = lastPoint.orbitalElements.p - firstPoint.orbitalElements.p;
  const deltaE = lastPoint.orbitalElements.e - firstPoint.orbitalElements.e;
  const deltaOmega_arg = (lastPoint.orbitalElements.omega - firstPoint.orbitalElements.omega) * (180 / Math.PI);
  const deltaA = lastPoint.orbitalElements.a - firstPoint.orbitalElements.a;

  return (
    <div>
      <Title order={3} mb="md">
        Элементы орбиты ИСЗ
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mb="md">
        <Card withBorder>
          <Text size="sm" c="dimmed">
            Большая полуось a, км
          </Text>
          <Text size="xl" fw={600}>
            {lastPoint.orbitalElements.a.toFixed(2)}
          </Text>
          <Text size="xs" c={deltaA > 0 ? 'red' : deltaA < 0 ? 'green' : 'gray'}>
            Δ: {deltaA.toFixed(4)} км
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed">
            Фокальный параметр p, км
          </Text>
          <Text size="xl" fw={600}>
            {lastPoint.orbitalElements.p.toFixed(2)}
          </Text>
          <Text size="xs" c={deltaP > 0 ? 'red' : deltaP < 0 ? 'green' : 'gray'}>
            Δ: {deltaP.toFixed(4)} км
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed">
            Эксцентриситет e
          </Text>
          <Text size="xl" fw={600}>
            {lastPoint.orbitalElements.e.toFixed(6)}
          </Text>
          <Text size="xs" c={deltaE > 0 ? 'red' : deltaE < 0 ? 'green' : 'gray'}>
            Δ: {deltaE.toFixed(8)}
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed">
            Наклонение i, град
          </Text>
          <Text size="xl" fw={600}>
            {(lastPoint.orbitalElements.i * 180 / Math.PI).toFixed(4)}
          </Text>
          <Text size="xs" c={deltaI > 0 ? 'red' : deltaI < 0 ? 'green' : 'gray'}>
            Δ: {deltaI.toFixed(6)} град
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed">
            Долгота восходящего узла Ω, град
          </Text>
          <Text size="xl" fw={600}>
            {(lastPoint.orbitalElements.Omega * 180 / Math.PI).toFixed(4)}
          </Text>
          <Text size="xs" c={deltaOmega > 0 ? 'red' : deltaOmega < 0 ? 'green' : 'gray'}>
            Δ: {deltaOmega.toFixed(6)} град
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed">
            Аргумент перицентра ω, град
          </Text>
          <Text size="xl" fw={600}>
            {(lastPoint.orbitalElements.omega * 180 / Math.PI).toFixed(4)}
          </Text>
          <Text size="xs" c={deltaOmega_arg > 0 ? 'red' : deltaOmega_arg < 0 ? 'green' : 'gray'}>
            Δ: {deltaOmega_arg.toFixed(6)} град
          </Text>
        </Card>
      </SimpleGrid>

      <Card withBorder mt="md">
        <Title order={4} mb="md">
          Результаты интегрирования уравнений возмущённого движения
        </Title>
        <Text size="sm" mb="xs">
          Лунные возмущения вызывают изменения орбитальных элементов спутника в течение орбитального периода.
          Интегрирование дифференциальных уравнений Лагранжа показывает эволюцию орбиты под действием третьей-body perturbations.
        </Text>
        <Text size="sm" mb="xs">
          <strong>Долгота восходящего узла (Ω):</strong> Прецессия узла орбиты вызвана бинормальной составляющей W.
          Скорость прецессии зависит от взаимной ориентации орбит спутника и Луны.
        </Text>
        <Text size="sm" mb="xs">
          <strong>Наклонение (i):</strong> Периодические изменения наклонения также определяются W-составляющей.
          Амплитуда зависит от аргумента широты u = ω + ϑ.
        </Text>
        <Text size="sm" mb="xs">
          <strong>Эксцентриситет (e):</strong> Изменяется под действием радиальной S и трансверсальной T составляющих,
          что приводит к периодическому изменению формы орбиты.
        </Text>
        <Text size="sm">
          <strong>Аргумент перицентра (ω):</strong> Наиболее сложное поведение — зависит от всех трёх составляющих (S, T, W),
          вызывает вращение линии апсид в плоскости орбиты.
        </Text>
      </Card>
    </div>
  );
}
