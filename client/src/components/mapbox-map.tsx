import { useEffect, useRef, useState } from "react";
import { createMapboxMap, MapboxMapManager } from "@/lib/mapbox";
import { DroneData, MapSettings } from "@/types/drone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Maximize2, Navigation } from "lucide-react";

interface MapboxMapProps {
  drones: DroneData[];
  flightPaths: Map<string, any[]>;
  selectedDroneId: string | null;
  onDroneSelected: (droneId: string) => void;
  className?: string;
}

export function MapboxMap({
  drones,
  flightPaths,
  selectedDroneId,
  onDroneSelected,
  className,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMapManager | null>(null);
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    style: "satellite",
    showFlightPaths: true,
    showRestrictedZones: true,
    showAirports: false,
  });

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      mapRef.current = createMapboxMap(containerRef.current);
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  // Update drone markers
  useEffect(() => {
    if (!mapRef.current) return;

    drones.forEach((drone) => {
      mapRef.current!.updateDroneMarker(drone);
    });
  }, [drones]);

  // Update flight paths
  useEffect(() => {
    if (!mapRef.current) return;

    flightPaths.forEach((path, droneId) => {
      const drone = drones.find((d) => d.id === droneId);
      mapRef.current!.updateFlightPath(droneId, path, drone);
    });
  }, [flightPaths, drones]);

  // Center on selected drone
  useEffect(() => {
    if (!mapRef.current || !selectedDroneId) return;

    const selectedDrone = drones.find((d) => d.id === selectedDroneId);
    if (selectedDrone) {
      mapRef.current.centerOnDrone(selectedDrone);
    }
  }, [selectedDroneId, drones]);

  // Listen for drone selection from map
  useEffect(() => {
    const handleDroneSelected = (event: CustomEvent) => {
      onDroneSelected(event.detail);
    };

    window.addEventListener(
      "droneSelected",
      handleDroneSelected as EventListener,
    );
    return () => {
      window.removeEventListener(
        "droneSelected",
        handleDroneSelected as EventListener,
      );
    };
  }, [onDroneSelected]);

  const handleStyleChange = (style: string) => {
    if (mapRef.current) {
      mapRef.current.setMapStyle(style);
      setMapSettings((prev) => ({ ...prev, style: style as any }));
    }
  };

  const handleLayerToggle = (layerId: string, visible: boolean) => {
    if (mapRef.current) {
      mapRef.current.toggleLayer(layerId, visible);
    }
  };

  const handleCenterMap = () => {
    if (mapRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current!.map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 12,
          });
        },
        () => {
          // Fallback to San Francisco
          mapRef.current!.map.flyTo({
            center: [-122.4194, 37.7749],
            zoom: 12,
          });
        },
      );
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="w-full h-full"
        data-testid="mapbox-container"
      />

      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 space-y-3 z-20">
        {/* Map Style Switcher */}
        <Card className="p-2 shadow-lg">
          <div className="flex flex-col space-y-1">
            {[
              { key: "satellite", label: "Satellite" },
              { key: "streets", label: "Streets" },
              { key: "dark", label: "Dark" },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={mapSettings.style === key ? "default" : "ghost"}
                size="sm"
                onClick={() => handleStyleChange(key)}
                className="text-xs justify-start"
                data-testid={`button-map-style-${key}`}
              >
                {label}
              </Button>
            ))}
          </div>
        </Card>

 
        {/* Map Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCenterMap}
            data-testid="button-center-map"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFullscreen}
            data-testid="button-fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Map Legend */}
      <Card className="absolute bottom-20 left-4 p-4 shadow-lg z-20">
        <h4 className="text-sm font-medium text-foreground mb-3">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
            <span className="text-xs text-muted-foreground">
              Allowed (B-series)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-destructive rounded-full"></div>
            <span className="text-xs text-muted-foreground">Restricted</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-1 bg-primary/50"></div>
            <span className="text-xs text-muted-foreground">Flight Path</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
