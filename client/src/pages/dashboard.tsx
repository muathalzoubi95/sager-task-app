import { useState } from 'react';
import { useDroneStore } from '@/hooks/use-drone-store';
import { MapboxMap } from '@/components/mapbox-map';
import { DroneListSidebar } from '@/components/drone-list-sidebar';
import { TopBar } from '@/components/top-bar';
import { DroneCounter } from '@/components/drone-counter';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const {
    drones,
    allDrones,
    flightPaths,
    filter,
    selectedDroneId,
    isConnected,
    lastUpdate,
    getRestrictedDronesCount,
    getDroneStats,
    updateFilter,
    selectDrone,
    getFlightPath
  } = useDroneStore();

  const handleDroneSelected = (droneId: string) => {
    selectDrone(droneId);
    // Auto-close sidebar on mobile when drone is selected
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const droneStats = getDroneStats();
  const restrictedCount = getRestrictedDronesCount();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      
      {/* Sidebar */}
      <DroneListSidebar
        drones={drones}
        filter={filter}
        selectedDroneId={selectedDroneId}
        droneStats={droneStats}
        onFilterChange={updateFilter}
        onDroneSelected={handleDroneSelected}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Top Bar */}
        <TopBar
          isConnected={isConnected}
          lastUpdate={lastUpdate}
        />

        {/* Map Container */}
        <MapboxMap
          drones={allDrones}
          flightPaths={flightPaths}
          selectedDroneId={selectedDroneId}
          onDroneSelected={handleDroneSelected}
          className="flex-1"
        />

        {/* Red Drone Counter */}
        <DroneCounter restrictedCount={restrictedCount} />
      </div>
    </div>
  );
}
