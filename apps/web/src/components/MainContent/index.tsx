import { Box, Tabs } from '@mantine/core';
import type { CalculationResponse, OrbitalElements } from '@lab/shared';
import HeightTab from './tabs/HeightTab.tsx';
import AnomalyTab from './tabs/AnomalyTab.tsx';
import Orbit3DTab from './tabs/Orbit3DTab.tsx';
import GeopotentialHelpTab from './tabs/GeopotentialHelpTab.tsx';

interface MainContentProps {
  result: CalculationResponse | null;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  coordinateSystem: 'ECI' | 'ECEF';
  orbit: OrbitalElements;
}

export default function MainContent({
  result,
  selectedIndex,
  onSelectedIndexChange,
  coordinateSystem,
  orbit,
}: MainContentProps) {
  const points = result?.data.points ?? [];
  const perigee = result?.data.points && result.data.points.length > 0
    ? result.data.points.reduce((min, p) => (p.height < min.height ? p : min), result.data.points[0])
    : null;

  const apogee = result?.data.points && result.data.points.length > 0
    ? result.data.points.reduce((max, p) => (p.height > max.height ? p : max), result.data.points[0])
    : null;




  return (
    <Box style={{ height: '100%' }}>
      <Tabs 
        value={selectedIndex === 0 ? "height" : selectedIndex === 1 ? "anomaly" : selectedIndex === 2 ? "orbit3d" : "help"}
        onChange={(value) => {
          if (value === "height") onSelectedIndexChange(0);
          else if (value === "anomaly") onSelectedIndexChange(1);
          else if (value === "orbit3d") onSelectedIndexChange(2);
          else if (value === "help") onSelectedIndexChange(3);
        }}
      >
        <Tabs.List mb="sm">
          <Tabs.Tab value="height">Зависимость от высоты</Tabs.Tab>
          <Tabs.Tab value="anomaly">От положения на орбите</Tabs.Tab>
          <Tabs.Tab value="orbit3d">3D орбита</Tabs.Tab>
          <Tabs.Tab value="help">Справка</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="height">
          <HeightTab 
            points={points}
            perigee={perigee}
            apogee={apogee}
            coordinateSystem={coordinateSystem}
          />
        </Tabs.Panel>

        <Tabs.Panel value="anomaly">
          <AnomalyTab
            points={points}
            perigee={perigee}
            apogee={apogee}
            coordinateSystem={coordinateSystem}
          />
        </Tabs.Panel>

        <Tabs.Panel value="orbit3d">
          <Orbit3DTab
            result={result}
            points={points}
            selectedIndex={selectedIndex}
            onSelectedIndexChange={onSelectedIndexChange}
            coordinateSystem={coordinateSystem}
            orbit={orbit}
          />
        </Tabs.Panel>

        <Tabs.Panel value="help">
          <GeopotentialHelpTab />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
