import { Box, Tabs } from '@mantine/core';
import type { OrbitalElements, CalculationResponse } from '@lab/shared';
import LunarElementsTab from './tabs/LunarElementsTab';
import LunarAccelerationTab from './tabs/LunarAccelerationTab';
import LunarOrbit3D from './tabs/LunarOrbit3D';
import LunarPlotsTab from './tabs/LunarPlotsTab';

interface LunarMainContentProps {
  result: CalculationResponse | null;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  orbit: OrbitalElements;
  desktopOpened: boolean;
}

export default function LunarMainContent({
  result,
  selectedIndex,
  onSelectedIndexChange,
  orbit,
  desktopOpened,
}: LunarMainContentProps) {
  const points = result?.data?.points ?? [];

  return (
    <Box style={{ height: '100%' }}>
      <Tabs 
        value={selectedIndex === 0 ? "elements" : selectedIndex === 1 ? "acceleration" : selectedIndex === 2 ? "plots" : "orbit3d"}
        onChange={(value) => {
          if (value === "elements") onSelectedIndexChange(0);
          else if (value === "acceleration") onSelectedIndexChange(1);
          else if (value === "plots") onSelectedIndexChange(2);
          else if (value === "orbit3d") onSelectedIndexChange(3);
        }}
        keepMounted={false}
      >
        <Tabs.List mb="sm">
          <Tabs.Tab value="elements">Элементы орбиты</Tabs.Tab>
          <Tabs.Tab value="acceleration">Возмущающие ускорения</Tabs.Tab>
          <Tabs.Tab value="plots">Графики</Tabs.Tab>
          <Tabs.Tab value="orbit3d">3D орбита</Tabs.Tab>
          <Tabs.Tab value="help">Справка</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="elements">
          <LunarElementsTab points={points} />
        </Tabs.Panel>

        <Tabs.Panel value="acceleration">
          <LunarAccelerationTab points={points} />
        </Tabs.Panel>

        <Tabs.Panel value="plots">
          <LunarPlotsTab points={points} orbit={orbit} />
        </Tabs.Panel>

        <Tabs.Panel value="orbit3d">
          <LunarOrbit3D 
            points={points}
            orbit={orbit}
            desktopOpened={desktopOpened}
          />
        </Tabs.Panel>

        <Tabs.Panel value="help">
          <div>
            <h2>Лабораторная работа №2</h2>
            <h3>Изучение влияния лунных возмущений на движение ИСЗ</h3>
            
            <h4>Цель работы:</h4>
            <p>Изучить влияние гравитационного поля Луны на орбиту искусственного спутника Земли.</p>
            
            <h4>Задачи:</h4>
            <ol>
              <li>Разработка математической модели движения ИСЗ с учетом лунных возмущений</li>
              <li>Программирование математической модели</li>
              <li>Анализ полученных результатов и графиков</li>
            </ol>
            
            <h4>Теоретические сведения:</h4>
            <p>
              Возмущения от притяжения Луны описываются системой дифференциальных уравнений для 
              орбитальных элементов. Составляющие возмущающего ускорения определяются через 
              проекции сил притяжения Луны в геоцентрической орбитальной системе координат.
            </p>
            
            <h4>Параметры Луны:</h4>
            <ul>
              <li>Наклонение орбиты: 5.145 град</li>
              <li>Высота в апогее/перигее: 405696/363104 км</li>
              <li>Гравитационный параметр: μₗ = 4902.8 км³/с²</li>
            </ul>
          </div>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
