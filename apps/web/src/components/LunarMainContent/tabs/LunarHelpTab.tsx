import { Card, Text, Title, Box, SimpleGrid, Group, List, ThemeIcon } from '@mantine/core';
import { IconMoon, IconPlanet, IconRocket, IconMathFunction, IconChartBar, IconInfoCircle, IconBook, IconTarget, IconChecklist, IconStar } from '@tabler/icons-react';

export default function LunarHelpTab() {
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
          📖 Справка: Лунные возмущения орбиты ИСЗ
        </Title>
        <Text c="gray.4" size="lg">
          Полное описание лабораторной работы по изучению влияния гравитационного поля Луны на движение искусственного спутника Земли
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
          Изучить влияние гравитационного поля Луны на орбиту искусственного спутника Земли, 
          разработать математическую модель движения с учётом лунных возмущений, 
          провести численное интегрирование уравнений движения и проанализировать эволюцию орбитальных элементов.
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
              создание системы дифференциальных уравнений для описания движения ИСЗ под действием гравитационных возмущений от Луны
            </Text>
          </List.Item>
          
          <List.Item>
            <Text c="gray.2">
              <Text span fw={600} c="#764ba2">Программная реализация</Text> — 
              численное интегрирование уравнений движения методом Рунге-Кутта 4-го порядка (RK4) или адаптивным методом RKF45
            </Text>
          </List.Item>
          
          <List.Item>
            <Text c="gray.2">
              <Text span fw={600} c="#4facfe">Анализ результатов</Text> — 
              исследование эволюции орбитальных элементов, построение графиков изменений, интерпретация физических эффектов
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
          Возмущения от притяжения Луны описываются системой дифференциальных уравнений для орбитальных элементов. 
          Составляющие возмущающего ускорения определяются через проекции сил притяжения Луны в 
          геоцентрической орбитальной системе координат.
        </Text>

        {/* Mathematical Model */}
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
            Система дифференциальных уравнений:
          </Title>
          
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Box>
              <Text size="sm" fw={600} c="#ff6b6b" mb="xs">da/dt = f₁(a, e, i, Ω, ω, M, S, T, W)</Text>
              <Text size="xs" c="gray.4">Изменение большой полуоси</Text>
            </Box>
            
            <Box>
              <Text size="sm" fw={600} c="#4dabf7" mb="xs">de/dt = f₂(a, e, i, Ω, ω, M, S, T, W)</Text>
              <Text size="xs" c="gray.4">Изменение эксцентриситета</Text>
            </Box>
            
            <Box>
              <Text size="sm" fw={600} c="#69db7c" mb="xs">di/dt = f₃(a, e, i, Ω, ω, M, S, T, W)</Text>
              <Text size="xs" c="gray.4">Изменение наклонения</Text>
            </Box>
            
            <Box>
              <Text size="sm" fw={600} c="#ffd43b" mb="xs">dΩ/dt = f₄(a, e, i, Ω, ω, M, S, T, W)</Text>
              <Text size="xs" c="gray.4">Прецессия восходящего узла</Text>
            </Box>
            
            <Box>
              <Text size="sm" fw={600} c="#da77f2" mb="xs">dω/dt = f₅(a, e, i, Ω, ω, M, S, T, W)</Text>
              <Text size="xs" c="gray.4">Прецессия перицентра</Text>
            </Box>
            
            <Box>
              <Text size="sm" fw={600} c="#8884d8" mb="xs">dM/dt = f₆(a, e, i, Ω, ω, M, S, T, W)</Text>
              <Text size="xs" c="gray.4">Изменение средней аномалии</Text>
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
            Формула возмущающего ускорения:
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
            a⃗ = -μₗ [ρ⃗/ρ³ + r⃗₁₂/r₁₂³]
          </Text>
          
          <Text size="sm" c="gray.4" ta="center">
            где μₗ = 4902.8 км³/с² — гравитационный параметр Луны
          </Text>
        </Box>
      </Card>

      {/* Moon Parameters */}
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
            <IconMoon size={28} color="white" strokeWidth={2} />
          </div>
          <Title order={4} style={{ fontSize: '20px', fontWeight: 700 }}>
            🌙 Параметры Луны
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
              <IconStar size={20} color="#ffd43b" />
              <Text size="sm" c="gray.4">Наклонение орбиты</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#ffd43b',
              }}
            >
              5.145°
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              к плоскости эклиптики
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
              <Text size="sm" c="gray.4">Высота в апогее</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#ffa94d',
              }}
            >
              405,696 км
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              максимальное расстояние
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
              <Text size="sm" c="gray.4">Высота в перигее</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#ff922b',
              }}
            >
              363,104 км
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              минимальное расстояние
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
              <Text size="sm" c="gray.4">Гравитационный параметр</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#69db7c',
              }}
            >
              μₗ = 4902.8 км³/с²
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              1/81.3 от земного
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
              <Text size="sm" c="gray.4">Сидерический период</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#4dabf7',
              }}
            >
              27.32 дней
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              полный оборот вокруг Земли
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
              <Text size="sm" c="gray.4">Эксцентриситет орбиты</Text>
            </Group>
            <Text 
              size="xl" 
              fw={700}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: '#da77f2',
              }}
            >
              e = 0.0549
            </Text>
            <Text size="xs" c="gray.5" mt="xs">
              близка к круговой
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
          Численное интегрирование системы дифференциальных уравнений выполняется методами 
          Рунге-Кутта 4-го порядка (RK4) с фиксированным шагом или адаптивным методом 
          Рунге-Кутта-Фельдберга (RKF45) с автоматическим выбором шага.
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
              📊 Метод RK4
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Классический метод 4-го порядка точности</List.Item>
              <List.Item>Точность: O(h⁴)</List.Item>
              <List.Item>4 вычисления производных на шаг</List.Item>
              <List.Item>Фиксированный шаг интегрирования</List.Item>
              <List.Item>Оптимальный шаг: 10...100 с</List.Item>
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
              🚀 Метод RKF45
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Адаптивный метод с автоматическим шагом</List.Item>
              <List.Item>Два решения: 4-го и 5-го порядков</List.Item>
              <List.Item>Контроль локальной ошибки</List.Item>
              <List.Item>Эффективнее для переменной динамики</List.Item>
              <List.Item>Точность: 10⁻⁶ ... 10⁻¹⁰</List.Item>
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
          Анализ результатов включает исследование изменений орбитальных элементов, 
          построение графиков зависимостей и оценку влияния каждой компоненты 
          возмущающего ускорения на эволюцию орбиты.
        </Text>
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Box>
            <Title order={5} mb="md" style={{ fontSize: '16px', color: '#ff6b6b' }}>
              🔴 Влияние S-составляющей
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Изменяет большую полуось a</List.Item>
              <List.Item>Влияет на эксцентриситет e</List.Item>
              <List.Item>Меняет энергию орбиты</List.Item>
              <List.Item>Периодические колебания размеров</List.Item>
            </List>
          </Box>
          
          <Box>
            <Title order={5} mb="md" style={{ fontSize: '16px', color: '#4dabf7' }}>
              🔵 Влияние T-составляющей
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Изменяет орбитальную скорость</List.Item>
              <List.Item>Вызывает прецессию перицентра ω</List.Item>
              <List.Item>Вращение линии апсид</List.Item>
              <List.Item>Меняет форму орбиты</List.Item>
            </List>
          </Box>
          
          <Box>
            <Title order={5} mb="md" style={{ fontSize: '16px', color: '#69db7c' }}>
              🟢 Влияние W-составляющей
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Изменяет наклонение i</List.Item>
              <List.Item>Вызывает прецессию узла Ω</List.Item>
              <List.Item>Поворот орбитальной плоскости</List.Item>
              <List.Item>Единственная меняет ориентацию</List.Item>
            </List>
          </Box>
          
          <Box>
            <Title order={5} mb="md" style={{ fontSize: '16px', color: '#ffd43b' }}>
              🟡 Полный эффект
            </Title>
            <List spacing="sm" size="sm" c="gray.3">
              <List.Item>Суммарное воздействие всех компонент</List.Item>
              <List.Item>Сложная нелинейная зависимость</List.Item>
              <List.Item>Накопление изменений со временем</List.Item>
              <List.Item>Требуется долгосрочный анализ</List.Item>
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
              Лунные возмущения имеют порядок 10⁻⁹ ... 10⁻⁶ м/с², что в миллионы раз меньше 
              земного притяжения на низких орбитах. Однако на высоких орбитах (ГЛОНАСС, GPS) 
              влияние Луны становится существенным.
            </Text>
          </Box>
          
          <Box>
            <Text size="sm" fw={600} c="#4dabf7" mb="xs">Практическое значение:</Text>
            <Text size="sm" c="gray.3" lh={1.6}>
              Учёт лунных возмущений критически важен для долгосрочного прогнозирования 
              орбит навигационных спутников, планирования коррекций и обеспечения точности 
              систем глобального позиционирования.
            </Text>
          </Box>
        </SimpleGrid>
      </Card>
    </div>
  );
}
