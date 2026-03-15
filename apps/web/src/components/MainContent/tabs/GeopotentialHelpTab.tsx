import { Card, Text, Title, Box, SimpleGrid, Group, List, ThemeIcon } from '@mantine/core';
import { IconMathFunction, IconChartBar, IconInfoCircle, IconBook, IconTarget, IconChecklist, IconStar, IconRocket, IconPlanet } from '@tabler/icons-react';

export default function GeopotentialHelpTab() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '10px',
    }}>
      {/* Header */}
      <Box mb="xl">
        <Title 
          order={3} 
          style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
          }}
        >
          🌍 Справка: Возмущения от нецентральности гравитационного поля Земли
        </Title>
        <Text c="gray.4" size="lg">
          Полное описание лабораторной работы по изучению влияния нецентрального гравитационного 
          поля Земли на движение искусственного спутника Земли
        </Text>
      </Box>

      {/* Goal Card */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <Group gap="sm" mb="lg">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
            }}
          >
            <IconTarget size={28} color="white" strokeWidth={2} />
          </div>
          <Title order={4} style={{ fontSize: '20px', fontWeight: 700 }}>
            🎯 Цель работы
          </Title>
        </Group>
        
        <Text size="lg" c="gray.2" lh={1.8}>
          Изучить влияние нецентральности гравитационного поля Земли на орбиту искусственного спутника, 
          разработать математическую модель движения с учётом зональных и секториальных гармоник 
          геопотенциала, провести численное интегрирование уравнений движения и проанализировать 
          эволюцию орбитальных элементов под действием возмущений.
        </Text>
      </Card>

      {/* Tasks Card */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <Group gap="sm" mb="lg">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(240, 147, 251, 0.4)',
            }}
          >
            <IconChecklist size={28} color="white" strokeWidth={2} />
          </div>
          <Title order={4} style={{ fontSize: '20px', fontWeight: 700 }}>
            📋 Задачи работы
          </Title>
        </Group>
        
        <List
          spacing="md"
          size="lg"
          center
          icon={
            <ThemeIcon color="blue" size={24} radius="xl">
              <IconChecklist size={16} />
            </ThemeIcon>
          }
          styles={{
            itemWrapper: {
              background: 'rgba(10, 14, 23, 0.4)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '8px',
            }
          }}
        >
          <List.Item>
            <Text c="gray.2">
              <Text span fw={600} c="#667eea">Разработка математической модели</Text> — 
              создание системы дифференциальных уравнений для описания движения ИСЗ под действием 
              нецентрального гравитационного поля Земли с учётом гармоник потенциала
            </Text>
          </List.Item>
          
          <List.Item>
            <Text c="gray.2">
              <Text span fw={600} c="#764ba2">Программная реализация</Text> — 
              численное интегрирование уравнений движения, расчёт возмущающих ускорений от 
              зональных и секториальных гармоник геопотенциала
            </Text>
          </List.Item>
          
          <List.Item>
            <Text c="gray.2">
              <Text span fw={600} c="#4facfe">Анализ результатов</Text> — 
              исследование зависимости возмущений от высоты орбиты и положения спутника, 
              построение графиков изменений, интерпретация физических эффектов
            </Text>
          </List.Item>
        </List>
      </Card>

      {/* Theory Section */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <Group gap="sm" mb="lg">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(79, 172, 254, 0.4)',
            }}
          >
            <IconBook size={28} color="white" strokeWidth={2} />
          </div>
          <Title order={4} style={{ fontSize: '20px', fontWeight: 700 }}>
            📚 Теоретические основы
          </Title>
        </Group>

        <Text size="md" c="gray.3" mb="lg" lh={1.8}>
          Гравитационное поле Земли описывается потенциалом, включающим центральную часть 
          и возмущения от нецентральности. Разложение в ряд по сферическим функциям позволяет 
          учесть зональные (зависящие от широты) и секториальные (зависящие от долготы) гармоники.
        </Text>

        {/* Potential Model */}
        <Box 
          style={{
            background: 'rgba(10, 14, 23, 0.6)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            marginBottom: 'lg',
          }}
        >
          <Title order={5} mb="md" style={{ fontSize: '16px', color: '#667eea' }}>
            Потенциал гравитационного поля:
          </Title>
          
          <Text size="lg" 
            style={{ 
              fontFamily: "'JetBrains Mono', monospace",
              textAlign: 'center',
              color: '#ffffff',
              fontSize: 'clamp(14px, 3vw, 18px)',
              marginBottom: '16px',
              lineHeight: '1.8',
            }}
          >
            V = μ/r · [1 - Σ(Jₙ·Pₙ(sin φ)) + ΣΣ(Cₙₖ·cos(kλ) + Sₙₖ·sin(kλ))·Pₙₖ(sin φ)]
          </Text>
          
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Box>
              <Text size="sm" fw={600} c="#ff6b6b" mb="xs">μ = 398600.4418 км³/с²</Text>
              <Text size="xs" c="gray.4">гравитационный параметр Земли</Text>
            </Box>
            
            <Box>
              <Text size="sm" fw={600} c="#4dabf7" mb="xs">Jₙ</Text>
              <Text size="xs" c="gray.4">зональные коэффициенты (J₂, J₃, ...)</Text>
            </Box>
            
            <Box>
              <Text size="sm" fw={600} c="#69db7c" mb="xs">Cₙₖ, Sₙₖ</Text>
              <Text size="xs" c="gray.4">секториальные коэффициенты</Text>
            </Box>
            
            <Box>
              <Text size="sm" fw={600} c="#ffd43b" mb="xs">Pₙ, Pₙₖ</Text>
              <Text size="xs" c="gray.4">полиномы Лежандра</Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Acceleration Components */}
        <Title order={5} mb="md" style={{ fontSize: '16px', color: '#764ba2' }}>
          Проекции возмущающего ускорения:
        </Title>
        
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="lg">
          <Box
            style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <Text size="sm" fw={700} c="#ff6b6b" mb="xs">🔴 S = Fₓ·cos(ϑ) + Fᵧ·sin(ϑ)</Text>
            <Text size="xs" c="gray.4">радиальная составляющая</Text>
            <Text size="xs" c="gray.5" mt="xs">
              Вдоль радиус-вектора от Земли
            </Text>
          </Box>
          
          <Box
            style={{
              background: 'rgba(77, 171, 247, 0.1)',
              border: '1px solid rgba(77, 171, 247, 0.3)',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <Text size="sm" fw={700} c="#4dabf7" mb="xs">🔵 T = -Fₓ·sin(ϑ) + Fᵧ·cos(ϑ)</Text>
            <Text size="xs" c="gray.4">трансверсальная составляющая</Text>
            <Text size="xs" c="gray.5" mt="xs">
              Перпендикулярно радиус-вектору в плоскости орбиты
            </Text>
          </Box>
          
          <Box
            style={{
              background: 'rgba(105, 219, 124, 0.1)',
              border: '1px solid rgba(105, 219, 124, 0.3)',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <Text size="sm" fw={700} c="#69db7c" mb="xs">🟢 W = Fᵤ</Text>
            <Text size="xs" c="gray.4">бинормальная составляющая</Text>
            <Text size="xs" c="gray.5" mt="xs">
              Перпендикулярно плоскости орбиты
            </Text>
          </Box>
        </SimpleGrid>

        {/* Force Calculation */}
        <Box 
          style={{
            background: 'rgba(10, 14, 23, 0.6)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(118, 75, 162, 0.3)',
          }}
        >
          <Text size="sm" fw={600} c="#f093fb" mb="md">
            Возмущающее ускорение:
          </Text>
          
          <Text size="lg" 
            style={{ 
              fontFamily: "'JetBrains Mono', monospace",
              textAlign: 'center',
              color: '#ffffff',
              fontSize: 'clamp(16px, 3vw, 20px)',
              marginBottom: '12px',
            }}
          >
            a⃗ = -∇V(r, φ, λ) + μ/r² · r̂
          </Text>
          
          <Text size="sm" c="gray.4" ta="center">
            разность между реальным ускорением от нецентрального поля и центральным ньютоновским
          </Text>
        </Box>
      </Card>

      {/* Harmonics Info */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <Group gap="sm" mb="lg">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ffd43b 0%, #ffa94d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255, 212, 59, 0.4)',
            }}
          >
            <IconStar size={28} color="white" strokeWidth={2} />
          </div>
          <Title order={4} style={{ fontSize: '20px', fontWeight: 700 }}>
            ⭐ Гармоники геопотенциала
          </Title>
        </Group>
        
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          <Box
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Group gap="sm" mb="xs">
              <IconStar size={20} color="#ff6b6b" />
              <Text size="sm" c="gray.4">J₂ (сжатие Земли)</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#ff6b6b',
              }}
            >
              1082.628×10⁻⁶
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              основная зональная гармоника
            </Text>
          </Box>
          
          <Box
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Group gap="sm" mb="xs">
              <IconPlanet size={20} color="#ffa94d" />
              <Text size="sm" c="gray.4">J₃ (асимметрия)</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#ffa94d',
              }}
            >
              -2.538×10⁻⁶
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              третья зональная гармоника
            </Text>
          </Box>
          
          <Box
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Group gap="sm" mb="xs">
              <IconPlanet size={20} color="#ff922b" />
              <Text size="sm" c="gray.4">J₄</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#ff922b',
              }}
            >
              -1.593×10⁻⁶
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              четвёртая зональная гармоника
            </Text>
          </Box>
          
          <Box
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Group gap="sm" mb="xs">
              <IconRocket size={20} color="#69db7c" />
              <Text size="sm" c="gray.4">C₂₂ (эллиптичность)</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#69db7c',
              }}
            >
              241.29×10⁻⁸
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              основная секториальная гармоника
            </Text>
          </Box>
          
          <Box
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Group gap="sm" mb="xs">
              <IconInfoCircle size={20} color="#4dabf7" />
              <Text size="sm" c="gray.4">Зональные гармоники</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#4dabf7',
              }}
            >
              J₂ ... J₂₁
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              зависят только от широты φ
            </Text>
          </Box>
          
          <Box
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Group gap="sm" mb="xs">
              <IconMathFunction size={20} color="#da77f2" />
              <Text size="sm" c="gray.4">Секториальные гармоники</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#da77f2',
              }}
            >
              Cₙₖ, Sₙₖ
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              зависят от широты φ и долготы λ
            </Text>
          </Box>
        </SimpleGrid>
      </Card>

      {/* Methodology */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <Group gap="sm" mb="lg">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #63e6be 0%, #38d9a9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 230, 190, 0.4)',
            }}
          >
            <IconMathFunction size={28} color="white" strokeWidth={2} />
          </div>
          <Title order={4} style={{ fontSize: '20px', fontWeight: 700 }}>
            🔬 Методика расчётов
          </Title>
        </Group>
        
        <Text size="md" c="gray.3" mb="lg" lh={1.8}>
          Расчёт возмущающих ускорений выполняется путём численного дифференцирования 
          потенциала гравитационного поля. Градиент потенциала даёт вектор ускорения, 
          который проецируется на орбитальную систему координат.
        </Text>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Box
            style={{
              background: 'rgba(102, 126, 234, 0.1)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <Title order={5} mb="md" style={{ fontSize: '16px', color: '#667eea' }}>
              📊 Этапы расчёта
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Вычисление градиента потенциала ∇V</List.Item>
              <List.Item>Переход от экваториальных координат к географическим</List.Item>
              <List.Item>Проецирование на орбитальную систему координат</List.Item>
              <List.Item>Учёт вращения Земли (для ECEF)</List.Item>
              <List.Item>Сравнение с центральным полем μ/r²</List.Item>
            </List>
          </Box>
          
          <Box
            style={{
              background: 'rgba(240, 147, 251, 0.1)',
              border: '1px solid rgba(240, 147, 251, 0.3)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <Title order={5} mb="md" style={{ fontSize: '16px', color: '#f093fb' }}>
              🚀 Особенности реализации
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Использование полиномов Лежандра</List.Item>
              <List.Item>Учёт до 21 зональной гармоники включительно</List.Item>
              <List.Item>Секториальные гармоники до степени n</List.Item>
              <List.Item>Преобразование координат ECI ↔ ECEF</List.Item>
              <List.Item>Автоматический выбор шага интегрирования</List.Item>
            </List>
          </Box>
        </SimpleGrid>
      </Card>

      {/* Results Interpretation */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <Group gap="sm" mb="lg">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #8884d8 0%, #339af0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(136, 132, 216, 0.4)',
            }}
          >
            <IconChartBar size={28} color="white" strokeWidth={2} />
          </div>
          <Title order={4} style={{ fontSize: '20px', fontWeight: 700 }}>
            📈 Интерпретация результатов
          </Title>
        </Group>
        
        <Text size="md" c="gray.3" mb="lg" lh={1.8}>
          Анализ результатов включает исследование зависимости возмущений от высоты орбиты 
          и положения спутника. Наибольший эффект наблюдается на низких орбитах и вблизи 
          перицентра.
        </Text>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Box>
            <Title order={5} mb="md" style={{ fontSize: '16px', color: '#ff6b6b' }}>
              🔴 Зависимость от высоты
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Возмущения убывают с ростом высоты ~1/r⁴</List.Item>
              <List.Item>На низких орбитах (200-500 км) эффект максимален</List.Item>
              <List.Item>На высоких орбитах (&gt;10000 км) пренебрежимо малы</List.Item>
              <List.Item>J₂ доминирует над остальными гармониками</List.Item>
            </List>
          </Box>
          
          <Box>
            <Title order={5} mb="md" style={{ fontSize: '16px', color: '#4dabf7' }}>
              🔵 Зависимость от аномалии
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Периодические изменения вдоль орбиты</List.Item>
              <List.Item>Максимум в перицентре (минимальная высота)</List.Item>
              <List.Item>Минимум в апоцентре (максимальная высота)</List.Item>
              <List.Item>Сложная зависимость от всех трёх компонент</List.Item>
            </List>
          </Box>
          
          <Box>
            <Title order={5} mb="md" style={{ fontSize: '16px', color: '#69db7c' }}>
              🟢 Отношение |j|/|g|
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Показывает относительную значимость возмущений</List.Item>
              <List.Item>Типичные значения: 10⁻⁶ ... 10⁻⁴</List.Item>
              <List.Item>Растёт с уменьшением высоты орбиты</List.Item>
              <List.Item>Критично для точных навигационных расчётов</List.Item>
            </List>
          </Box>
          
          <Box>
            <Title order={5} mb="md" style={{ fontSize: '16px', color: '#ffd43b' }}>
              🟡 Доминирующая компонента
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Определяется по RMS значению</List.Item>
              <List.Item>Зависит от ориентации орбиты</List.Item>
              <List.Item>Меняется вдоль траектории</List.Item>
              <List.Item>Важно для понимания физики процесса</List.Item>
            </List>
          </Box>
        </SimpleGrid>
      </Card>

      {/* Additional Info */}
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <Group gap="sm" mb="lg">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #51cf66 0%, #69db7c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(81, 207, 102, 0.4)',
            }}
          >
            <IconInfoCircle size={28} color="white" strokeWidth={2} />
          </div>
          <Title order={4} style={{ fontSize: '20px', fontWeight: 700 }}>
            💡 Дополнительная информация
          </Title>
        </Group>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Box>
            <Text size="sm" fw={600} c="#51cf66" mb="xs">Масштаб возмущений:</Text>
            <Text size="sm" c="gray.3" lh={1.6}>
              Возмущения от нецентральности имеют порядок 10⁻⁷ ... 10⁻⁵ м/с² на низких орбитах. 
              Основная доля (~99%) приходится на вторую зональную гармонику J₂, обусловленную 
              сжатием Земли. Остальные гармоники дают малые поправки.
            </Text>
          </Box>
          
          <Box>
            <Text size="sm" fw={600} c="#4dabf7" mb="xs">Практическое значение:</Text>
            <Text size="sm" c="gray.3" lh={1.6}>
              Учёт нецентральности критически важен для расчёта орбит ИСЗ, особенно навигационных 
              и дистанционного зондирования. Без учёта J₂ невозможно долгосрочное прогнозирование 
              из-за прецессии узла и перицентра.
            </Text>
          </Box>
        </SimpleGrid>
      </Card>
    </div>
  );
}
