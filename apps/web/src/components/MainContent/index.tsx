import { Box, Tabs } from '@mantine/core';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import type { CalculationResponse, OrbitalElements } from '@lab/shared';
import HeightTab from './tabs/HeightTab.tsx';
import AnomalyTab from './tabs/AnomalyTab.tsx';
import Orbit3DTab from './tabs/Orbit3DTab.tsx';
import HelpTab from './tabs/HelpTab.tsx';

interface MainContentProps {
  result: CalculationResponse | null;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  coordinateSystem: 'ECI' | 'ECEF';
  orbit: OrbitalElements;
  desktopOpened: boolean;
}

export default function MainContent({
  result,
  selectedIndex,
  onSelectedIndexChange,
  coordinateSystem,
  orbit,
  desktopOpened,
}: MainContentProps) {
  const points = result?.data.points ?? [];
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRefs = useRef<{ [key: string]: any }>({});
  const latestSelectedIndex = useRef(selectedIndex);
  
  const perigee = useMemo(() => {
    if (!points.length) return null;
    return points.reduce((min, p) => (p.height < min.height ? p : min), points[0]);
  }, [points]);

  const apogee = useMemo(() => {
    if (!points.length) return null;
    return points.reduce((max, p) => (p.height > max.height ? p : max), points[0]);
  }, [points]);

  // Update latest selected index when it changes
  useEffect(() => {
    console.log(`selectedIndex changed from ${latestSelectedIndex.current} to ${selectedIndex}`);
    latestSelectedIndex.current = selectedIndex;
  }, [selectedIndex]);
  
  // Register a plot instance
  const registerPlot = useCallback((name: string, plotDiv: HTMLDivElement | null) => {
    if (plotDiv) {
      console.log(`Registering plot: ${name}`, plotDiv);
      plotRefs.current[name] = plotDiv;
    } else {
      console.log(`Unregistering plot: ${name}`);
      delete plotRefs.current[name];
    }
  }, []);

  // Resize specific plot by name
  const resizePlot = useCallback((name: string) => {
    const plotDiv = plotRefs.current[name];
    console.log(`Attempting to resize plot ${name}:`, plotDiv);
    // Only resize if plot div exists and is in DOM
    if (plotDiv && document.contains(plotDiv) && typeof window !== 'undefined' && (window as any).Plotly) {
      try {
        console.log(`Resizing plot ${name} successfully`);
        (window as any).Plotly.Plots.resize(plotDiv);
      } catch (error) {
        console.warn(`Failed to resize plot ${name}:`, error);
      }
    } else {
      console.warn(`Cannot resize plot ${name}: plotDiv=${plotDiv}, in DOM=${plotDiv ? document.contains(plotDiv) : false}`);
    }
  }, []);

  // Resize plots when sidebar state changes
  useEffect(() => {
    // Use latest selected index which is always up-to-date
    const currentSelectedIndex = latestSelectedIndex.current;
    console.log(`Sidebar toggle: desktopOpened=${desktopOpened}, tab=${currentSelectedIndex}`);
    
    // First resize - quick attempt
    const timer1 = setTimeout(() => {
      console.log(`Timer1: Resizing plots for tab ${currentSelectedIndex}`);
      if (currentSelectedIndex === 0) {
        resizePlot('height-1');
        resizePlot('height-2');
      } else if (currentSelectedIndex === 1) {
        resizePlot('anomaly-1');
        resizePlot('anomaly-2');
      }
    }, 50);
    
    // Second resize - after animation completes (300ms Mantine + 100ms buffer)
    const timer2 = setTimeout(() => {
      console.log(`Timer2: Resizing plots for tab ${currentSelectedIndex}`);
      if (currentSelectedIndex === 0) {
        resizePlot('height-1');
        resizePlot('height-2');
      } else if (currentSelectedIndex === 1) {
        resizePlot('anomaly-1');
        resizePlot('anomaly-2');
      }
    }, 400);
    
    return () => {
      console.log('Cleaning up sidebar resize timers');
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [desktopOpened, resizePlot]);

  return (
    <Box ref={containerRef} style={{ height: '100%' }}>
      <Tabs 
        value={selectedIndex === 0 ? "height" : selectedIndex === 1 ? "anomaly" : "orbit3d"}
        onChange={(value) => {
          if (value === "height") onSelectedIndexChange(0);
          else if (value === "anomaly") onSelectedIndexChange(1);
          else if (value === "orbit3d") onSelectedIndexChange(2);
        }}
        keepMounted={false}
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
            onPlotRef={registerPlot}
          />
        </Tabs.Panel>

        <Tabs.Panel value="anomaly">
          <AnomalyTab
            points={points}
            perigee={perigee}
            apogee={apogee}
            coordinateSystem={coordinateSystem}
            onPlotRef={registerPlot}
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
            desktopOpened={desktopOpened}
          />
        </Tabs.Panel>

        <Tabs.Panel value="help">
          <HelpTab />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
