import { useState, useEffect, useCallback } from "react";
import {
  DroneData,
  FlightPathPoint,
  DroneFilter,
  isDroneAllowed,
} from "@/types/drone";

interface DroneStore {
  drones: Map<string, DroneData>;
  flightPaths: Map<string, FlightPathPoint[]>;
  filter: DroneFilter;
  selectedDroneId: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
}

// Generate initial mock drone data
function generateMockDrones(): DroneData[] {
  return [
    {
      id: "drone-1",
      registration: "SG-BA1234",
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 1250,
      yaw: 45,
      speed: 30,
      flightTime: 8075,
      isActive: true,
    },
    {
      id: "drone-2",
      registration: "SG-XY9876",
      latitude: 37.7849,
      longitude: -122.4094,
      altitude: 890,
      yaw: 180,
      speed: 22,
      flightTime: 6312,
      isActive: true,
    },
    {
      id: "drone-3",
      registration: "SG-BC5678",
      latitude: 37.7649,
      longitude: -122.4294,
      altitude: 2100,
      yaw: 127,
      speed: 44,
      flightTime: 12161,
      isActive: true,
    },
    {
      id: "drone-4",
      registration: "US-AB7890",
      latitude: 37.7549,
      longitude: -122.4394,
      altitude: 750,
      yaw: 90,
      speed: 32,
      flightTime: 4521,
      isActive: true,
    },
    {
      id: "drone-5",
      registration: "SG-BX3456",
      latitude: 37.7949,
      longitude: -122.3994,
      altitude: 1800,
      yaw: 270,
      speed: 38,
      flightTime: 9876,
      isActive: true,
    },
    {
      id: "drone-6",
      registration: "EU-CD2109",
      latitude: 37.7449,
      longitude: -122.4494,
      altitude: 950,
      yaw: 315,
      speed: 25,
      flightTime: 3654,
      isActive: true,
    },
  ];
}

export function useDroneStore() {
  const [store, setStore] = useState<DroneStore>(() => {
    const initialDrones = generateMockDrones();
    const dronesMap = new Map<string, DroneData>();
    initialDrones.forEach((drone) => dronesMap.set(drone.id, drone));

    return {
      drones: dronesMap,
      flightPaths: new Map(),
      filter: {
        search: "",
        showAllowed: true,
        showRestricted: true,
      },
      selectedDroneId: null,
      isConnected: true, // Always connected in mock mode
      lastUpdate: new Date(),
    };
  });

  // Simulate real-time drone updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStore((prev) => {
        const newStore = { ...prev, lastUpdate: new Date() };
        newStore.drones = new Map(prev.drones);
        newStore.flightPaths = new Map(prev.flightPaths);

        // Update each drone's position and properties
        prev.drones.forEach((drone, id) => {
          // Simulate movement
          const latChange = (Math.random() - 0.5) * 0.001;
          const lngChange = (Math.random() - 0.5) * 0.001;
          const altChange = (Math.random() - 0.5) * 50;
          const yawChange = (Math.random() - 0.5) * 10;
          const speedChange = (Math.random() - 0.5) * 5;

          const updatedDrone: DroneData = {
            ...drone,
            latitude: Math.max(-90, Math.min(90, drone.latitude + latChange)),
            longitude: Math.max(
              -180,
              Math.min(180, drone.longitude + lngChange),
            ),
            altitude: Math.max(0, drone.altitude + altChange),
            yaw: (drone.yaw + yawChange + 360) % 360,
            speed: Math.max(0, drone.speed + speedChange),
            flightTime: drone.flightTime + 2, // Increment by 2 seconds
          };

          newStore.drones.set(id, updatedDrone);

          // Add flight path point
          const existingPath = newStore.flightPaths.get(id) || [];
          const newPathPoint: FlightPathPoint = {
            droneId: id,
            latitude: updatedDrone.latitude,
            longitude: updatedDrone.longitude,
            altitude: updatedDrone.altitude,
            timestamp: new Date(),
          };

          // Keep only last 100 points for performance
          const updatedPath = [...existingPath, newPathPoint].slice(-100);
          newStore.flightPaths.set(id, updatedPath);
        });

        return newStore;
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredDrones = useCallback(() => {
    const dronesArray = Array.from(store.drones.values());

    return dronesArray.filter((drone) => {
      // Search filter
      if (
        store.filter.search &&
        !drone.registration
          .toLowerCase()
          .includes(store.filter.search.toLowerCase())
      ) {
        return false;
      }

      // Allowed/Restricted filter
      const isAllowed = isDroneAllowed(drone.registration);
      if (!store.filter.showAllowed && isAllowed) return false;
      if (!store.filter.showRestricted && !isAllowed) return false;

      return true;
    });
  }, [store.drones, store.filter]);

  const getRestrictedDronesCount = useCallback(() => {
    return Array.from(store.drones.values()).filter(
      (drone) => !isDroneAllowed(drone.registration) && drone.isActive,
    ).length;
  }, [store.drones]);

  const getDroneStats = useCallback(() => {
    const drones = Array.from(store.drones.values());
    const activeDrones = drones.filter((drone) => drone.isActive);
    const allowedDrones = activeDrones.filter((drone) =>
      isDroneAllowed(drone.registration),
    );

    return {
      total: drones.length,
      active: activeDrones.length,
      allowed: allowedDrones.length,
      restricted: activeDrones.length - allowedDrones.length,
    };
  }, [store.drones]);

  const updateFilter = useCallback((newFilter: Partial<DroneFilter>) => {
    setStore((prev) => ({
      ...prev,
      filter: { ...prev.filter, ...newFilter },
    }));
  }, []);

  const selectDrone = useCallback((droneId: string | null) => {
    setStore((prev) => ({ ...prev, selectedDroneId: droneId }));
  }, []);

  const getDroneById = useCallback(
    (id: string) => {
      return store.drones.get(id);
    },
    [store.drones],
  );

  const getFlightPath = useCallback(
    (droneId: string) => {
      return store.flightPaths.get(droneId) || [];
    },
    [store.flightPaths],
  );

  return {
    drones: filteredDrones(),
    allDrones: Array.from(store.drones.values()),
    flightPaths: store.flightPaths,
    filter: store.filter,
    selectedDroneId: store.selectedDroneId,
    isConnected: store.isConnected,
    lastUpdate: store.lastUpdate,
    getRestrictedDronesCount,
    getDroneStats,
    updateFilter,
    selectDrone,
    getDroneById,
    getFlightPath,
  };
}
