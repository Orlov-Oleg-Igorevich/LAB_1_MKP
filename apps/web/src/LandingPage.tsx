import { Container, Title, Text, Card, Group, Button, SimpleGrid, Box } from '@mantine/core';
import { IconSatellite, IconMoon, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <Container size="lg">
        {/* Header */}
        <Card 
          shadow="xl" 
          radius="md" 
          mb="xl"
          style={{ 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Title 
            order={1} 
            ta="center"
            mb="md"
            style={{ 
              fontSize: 'clamp(28px, 5vw, 42px)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Лабораторный практикум по механике космического полета
          </Title>
          <Text ta="center" c="dimmed" size="lg">
            Исследование возмущений в движении искусственных спутников Земли
          </Text>
        </Card>

        {/* Research Modules */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="xl">
          {/* Geopotential Module */}
          <Card 
            shadow="xl" 
            radius="md" 
            padding="xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/geopotential')}
          >
            <Group gap="sm" mb="md">
              <IconSatellite size={40} color="#667eea" />
              <Title order={2} style={{ fontSize: '24px' }}>
                Нецентральность гравитационного поля
              </Title>
            </Group>
            
            <Text c="dimmed" mb="md" style={{ lineHeight: 1.6 }}>
              Изучение влияния нецентральности гравитационного поля Земли на движение ИСЗ. 
              Анализ гармонических разложений геопотенциала и их влияния на орбитальные элементы.
            </Text>

            <Box mt="md">
              <Text fw={600} mb="xs">Что можно исследовать:</Text>
              <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                <li>Возмущающие ускорения от гармоник геопотенциала</li>
                <li>Влияние зональных и секториальных гармоник</li>
                <li>Эволюцию орбитальных элементов</li>
                <li>Сравнение моделей J₂-only и полной модели</li>
              </ul>
            </Box>

            <Button 
              rightSection={<IconArrowRight />} 
              size="lg"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                navigate('/geopotential');
              }}
            >
              Перейти к исследованию
            </Button>
          </Card>

          {/* Lunar Module */}
          <Card 
            shadow="xl" 
            radius="md" 
            padding="xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/lunar')}
          >
            <Group gap="sm" mb="md">
              <IconMoon size={40} color="#764ba2" />
              <Title order={2} style={{ fontSize: '24px' }}>
                Лунные возмущения
              </Title>
            </Group>
            
            <Text c="dimmed" mb="md" style={{ lineHeight: 1.6 }}>
              Исследование гравитационного воздействия Луны на орбиту ИСЗ. 
              Анализ влияния третьего тела на эволюцию орбитальных параметров спутника.
            </Text>

            <Box mt="md">
              <Text fw={600} mb="xs">Что можно исследовать:</Text>
              <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                <li>Возмущения от притяжения Луны</li>
                <li>Изменение элементов орбиты под действием Луны</li>
                <li>Радиальную, трансверсальную и бинормальную составляющие</li>
                <li>Долгосрочную эволюцию орбиты</li>
              </ul>
            </Box>

            <Button 
              rightSection={<IconArrowRight />} 
              size="lg"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                navigate('/lunar');
              }}
            >
              Перейти к исследованию
            </Button>
          </Card>
        </SimpleGrid>

        {/* Footer */}
        <Card 
          shadow="xl" 
          radius="md" 
          mt="xl"
          style={{ 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Text ta="center" c="dimmed" size="sm">
            Московский авиационный институт (государственный технический университет)
            <br />
            Кафедра «Системный анализ и управление»
          </Text>
        </Card>
      </Container>
    </Box>
  );
}
