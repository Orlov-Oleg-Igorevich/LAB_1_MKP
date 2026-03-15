import { Box, Tabs } from '@mantine/core';
import type { OrbitalElements, CalculationResponse } from '@lab/shared';
import LunarElementsTab from './tabs/LunarElementsTab';
import LunarAccelerationTab from './tabs/LunarAccelerationTab';
import LunarOrbit3D from './tabs/LunarOrbit3D';
import LunarPlotsTab from './tabs/LunarPlotsTab';
import LunarComparisonTab from './tabs/LunarComparisonTab';
import LunarStatisticsTab from './tabs/LunarStatisticsTab';
import LunarHelpTab from './tabs/LunarHelpTab';

interface LunarMainContentProps {
  result: CalculationResponse | null;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  orbit: OrbitalElements;
}

export default function LunarMainContent({
  result,
  selectedIndex,
  onSelectedIndexChange,
  orbit,
}: LunarMainContentProps) {
  const points = result?.data?.points ?? [];

  return (
    <Box style={{ height: '100%' }}>
      <Tabs 
        value={selectedIndex === 0 ? "elements" : selectedIndex === 1 ? "acceleration" : selectedIndex === 2 ? "plots" : selectedIndex === 3 ? "comparison" : selectedIndex === 4 ? "statistics" : selectedIndex === 5 ? "orbit3d" : "help"}
        onChange={(value) => {
          if (value === "elements") onSelectedIndexChange(0);
          else if (value === "acceleration") onSelectedIndexChange(1);
          else if (value === "plots") onSelectedIndexChange(2);
          else if (value === "comparison") onSelectedIndexChange(3);
          else if (value === "statistics") onSelectedIndexChange(4);
          else if (value === "orbit3d") onSelectedIndexChange(5);
          else if (value === "help") onSelectedIndexChange(6);
        }}
        keepMounted={false}
      >
        <Tabs.List mb="sm">
          <Tabs.Tab value="elements">Элементы орбиты</Tabs.Tab>
          <Tabs.Tab value="acceleration">Возмущающие ускорения</Tabs.Tab>
          <Tabs.Tab value="plots">Графики</Tabs.Tab>
          <Tabs.Tab value="comparison">Сравнение</Tabs.Tab>
          <Tabs.Tab value="statistics">Статистика</Tabs.Tab>
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
          <LunarPlotsTab points={points} />
        </Tabs.Panel>

        <Tabs.Panel value="comparison">
          <LunarComparisonTab points={points} orbit={orbit} />
        </Tabs.Panel>

        <Tabs.Panel value="statistics">
          <LunarStatisticsTab points={points} orbit={orbit} />
        </Tabs.Panel>

        <Tabs.Panel value="orbit3d">
          <LunarOrbit3D points={points} />
        </Tabs.Panel>

        <Tabs.Panel value="help">
          <LunarHelpTab />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
