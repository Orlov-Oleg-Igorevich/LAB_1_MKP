import { Card, Text, Title, SimpleGrid } from '@mantine/core';

interface LunarAccelerationTabProps {
  points: any[];
}

export default function LunarAccelerationTab({ points }: LunarAccelerationTabProps) {
  if (!points || points.length === 0) {
    return (
      <Card withBorder>
        <Text c="dimmed" ta="center">
          Нажмите "Рассчитать" для получения данных
        </Text>
      </Card>
    );
  }

  // Calculate statistics (acceleration already in m/s² from backend)
  const stats = {
    S: {
      min: Math.min(...points.map(p => p.acceleration.S)),
      max: Math.max(...points.map(p => p.acceleration.S)),
      avg: points.reduce((sum, p) => sum + p.acceleration.S, 0) / points.length,
    },
    T: {
      min: Math.min(...points.map(p => p.acceleration.T)),
      max: Math.max(...points.map(p => p.acceleration.T)),
      avg: points.reduce((sum, p) => sum + p.acceleration.T, 0) / points.length,
    },
    W: {
      min: Math.min(...points.map(p => p.acceleration.W)),
      max: Math.max(...points.map(p => p.acceleration.W)),
      avg: points.reduce((sum, p) => sum + p.acceleration.W, 0) / points.length,
    },
    total: {
      min: Math.min(...points.map(p => p.acceleration.total)),
      max: Math.max(...points.map(p => p.acceleration.total)),
      avg: points.reduce((sum, p) => sum + p.acceleration.total, 0) / points.length,
    },
  };

  return (
    <div>
      <Title order={3} mb="md">
        Возмущающие ускорения от притяжения Луны
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
        <Card withBorder>
          <Text size="sm" c="dimmed" fw={600}>
            Радиальная составляющая S, м/с²
          </Text>
          <Text size="xs" mt="xs">
            Min: {stats.S.min.toExponential(3)}
          </Text>
          <Text size="xs">
            Max: {stats.S.max.toExponential(3)}
          </Text>
          <Text size="xs">
            Avg: {stats.S.avg.toExponential(3)}
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            Sign: {stats.S.avg >= 0 ? '+' : '−'} (радиально)
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed" fw={600}>
            Трансверсальная составляющая T, м/с²
          </Text>
          <Text size="xs" mt="xs">
            Min: {stats.T.min.toExponential(3)}
          </Text>
          <Text size="xs">
            Max: {stats.T.max.toExponential(3)}
          </Text>
          <Text size="xs">
            Avg: {stats.T.avg.toExponential(3)}
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            Sign: {stats.T.avg >= 0 ? '+' : '−'} (трансверсально)
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed" fw={600}>
            Бинормальная составляющая W, м/с²
          </Text>
          <Text size="xs" mt="xs">
            Min: {stats.W.min.toExponential(3)}
          </Text>
          <Text size="xs">
            Max: {stats.W.max.toExponential(3)}
          </Text>
          <Text size="xs">
            Avg: {stats.W.avg.toExponential(3)}
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            Sign: {stats.W.avg >= 0 ? '+' : '−'} (бинормально)
          </Text>
        </Card>

        <Card withBorder>
          <Text size="sm" c="dimmed" fw={600}>
            Полное ускорение, м/с²
          </Text>
          <Text size="xs" mt="xs">
            Min: {stats.total.min.toExponential(3)}
          </Text>
          <Text size="xs">
            Max: {stats.total.max.toExponential(3)}
          </Text>
          <Text size="xs">
            Avg: {stats.total.avg.toExponential(3)}
          </Text>
        </Card>
      </SimpleGrid>

      <Card withBorder mt="md">
        <Title order={4} mb="md">
          Методика расчёта возмущающих ускорений
        </Title>
        <Text size="sm" mb="xs">
          Согласно методике ЛР2, возмущающее ускорение от притяжения Луны вычисляется как разность сил притяжения Луны к спутнику и к Земле:
        </Text>
        <Text size="sm" mb="xs" style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '8px' }}>
          a⃗ = -μₗ [ρ⃗/ρ³ + r⃗₁₂/r₁₂³]
        </Text>
        <Text size="sm" mb="xs">
          где μₗ = 4902.8 км³/с² — гравитационный параметр Луны,
          ρ⃗ — вектор «Луна-ИСЗ», r⃗₁₂ — вектор «Луна-Земля».
        </Text>
        <Text size="sm" mb="xs" fw={600}>
          Проекции на орбитальную систему координат (S, T, W):
        </Text>
        <Text size="sm" mb="xs" style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '8px' }}>
          S = Fₓ·cos(ϑ) + Fᵧ·sin(ϑ) — радиальная составляющая<br/>
          T = -Fₓ·sin(ϑ) + Fᵧ·cos(ϑ) — трансверсальная составляющая<br/>
          W = Fᵤ — бинормальная составляющая
        </Text>
        <Text size="sm" mt="md">
          где ϑ — истинная аномалия спутника, Fₓ, Fᵧ, Fᵤ — проекции возмущающего ускорения в геоцентрической экваториальной системе координат.
        </Text>
      </Card>

      <Card withBorder mt="md">
        <Title order={4} mb="md">
          Физический смысл составляющих
        </Title>
        <Text size="sm" mb="xs">
          <b style={{ color: '#e03131' }}>Радиальная составляющая (S)</b> направлена вдоль радиус-вектора спутника от Земли.
          Положительное значение S уменьшает эффективное притяжение Земли, отрицательное — увеличивает.
          Влияет на величину большой полуоси и эксцентриситет орбиты.
        </Text>
        <Text size="sm" mb="xs">
          <b style={{ color: '#1971c2' }}>Трансверсальная составляющая (T)</b> действует в плоскости орбиты перпендикулярно радиус-вектору
          в направлении движения спутника. Изменяет орбитальную скорость, вызывая прецессию перицентра и изменение эксцентриситета.
        </Text>
        <Text size="sm">
          <b style={{ color: '#2b8a3e' }}>Бинормальная составляющая (W)</b> направлена перпендикулярно плоскости орбиты спутника.
          Вызывает изменение наклонения орбиты i и прецессию узла Ω. Это единственная составляющая, изменяющая ориентацию орбитальной плоскости.
        </Text>
      </Card>
    </div>
  );
}
