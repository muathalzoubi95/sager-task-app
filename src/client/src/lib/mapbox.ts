import mapboxgl from "mapbox-gl";
import { DroneData, FlightPathPoint, isDroneAllowed } from "@/types/drone";

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoibXluZXd3MDAiLCJhIjoiY21lc3V5Nnp0MDZndjJqczRkdjJ2NGlpOCJ9.wF4YelXlLVj7Ead9dGf2rQ";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

export interface MapboxMapManager {
  map: mapboxgl.Map;
  updateDroneMarker: (drone: DroneData) => void;
  updateFlightPath: (
    droneId: string,
    path: FlightPathPoint[],
    drone?: DroneData,
  ) => void;
  centerOnDrone: (drone: DroneData) => void;
  setMapStyle: (style: string) => void;
  toggleLayer: (layerId: string, visible: boolean) => void;
  showDronePopup: (drone: DroneData) => void;
  hideDronePopup: () => void;
  destroy: () => void;
}

export function createMapboxMap(
  container: string | HTMLElement,
): MapboxMapManager {
  const map = new mapboxgl.Map({
    container,
    style: "mapbox://styles/mapbox/satellite-v9",
    center: [-122.4194, 37.7749], //
    zoom: 12,
    pitch: 0,
    bearing: 0,
  });

  const droneMarkers = new Map<string, mapboxgl.Marker>();
  const flightPaths = new Map<string, string>(); // Map drone ID to source ID
  let activePopup: mapboxgl.Popup | null = null;

  // Initialize map layers
  map.on("load", () => {
    // Add flight paths source
    map.addSource("flight-paths", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });

    // Add flight paths layer
    map.addLayer({
      id: "flight-paths-layer",
      type: "line",
      source: "flight-paths",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2,
        "line-opacity": 0.86,
      },
    });
  });

  function createDroneMarkerElement(drone: DroneData): HTMLElement {
    const el = document.createElement("div");
    el.className = "drone-marker";
    el.style.width = "24px";
    el.style.height = "24px";
    el.style.position = "relative";
    el.style.cursor = "pointer";

    const isAllowed = isDroneAllowed(drone.registration);
    const color = isAllowed ? "#10b981" : "#ef4444";

    el.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background-color: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${drone.yaw}deg);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 8px solid white;
          transform: translateY(-1px);
        "></div>
      </div>
    `;

    return el;
  }

  const updateDroneMarker = (drone: DroneData) => {
    const existingMarker = droneMarkers.get(drone.id);

    if (existingMarker) {
      // Update position and rotation
      existingMarker.setLngLat([drone.longitude, drone.latitude]);
      const element = existingMarker.getElement();
      const iconElement = element.querySelector("div > div");
      if (iconElement) {
        (iconElement as HTMLElement).style.transform =
          `rotate(${drone.yaw}deg)`;
      }
    } else {
      // Create new marker
      const el = createDroneMarkerElement(drone);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([drone.longitude, drone.latitude])
        .addTo(map);

      // Add click handler
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        showDronePopup(drone);
        // Dispatch custom event for drone selection
        window.dispatchEvent(
          new CustomEvent("droneSelected", { detail: drone.id }),
        );
      });

      // Add hover handlers
      el.addEventListener("mouseenter", () => {
        showDronePopup(drone);
      });

      el.addEventListener("mouseleave", () => {
        setTimeout(() => {
          if (activePopup) {
            activePopup.remove();
            activePopup = null;
          }
        }, 100);
      });

      droneMarkers.set(drone.id, marker);
    }
  };

  const updateFlightPath = (
    droneId: string,
    path: FlightPathPoint[],
    drone?: DroneData,
  ) => {
    if (path.length < 2) return;

    const droneMarker = droneMarkers.get(droneId);
    if (!droneMarker) return;

    const coordinates = path.map((point) => [point.longitude, point.latitude]);

    const isAllowed = drone ? isDroneAllowed(drone.registration) : false;

    const feature = {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates,
      },
      properties: {
        droneId,
        color: isAllowed ? "#10b981" : "#ef4444",
      },
    };

    // Get current flight paths data
    const source = map.getSource("flight-paths") as mapboxgl.GeoJSONSource;
    if (source) {
      const currentData = source._data as any;
      const features = currentData.features || [];

      // Remove existing path for this drone
      const filteredFeatures = features.filter(
        (f: any) => f.properties.droneId !== droneId,
      );

      // Add updated path
      filteredFeatures.push(feature);

      source.setData({
        type: "FeatureCollection",
        features: filteredFeatures,
      });
    }
  };

  const centerOnDrone = (drone: DroneData) => {
    map.flyTo({
      center: [drone.longitude, drone.latitude],
      zoom: 15,
      duration: 1000,
    });
  };

  const setMapStyle = (style: string) => {
    const styleMap: Record<string, string> = {
      satellite: "mapbox://styles/mapbox/satellite-v9",
      streets: "mapbox://styles/mapbox/streets-v11",
      dark: "mapbox://styles/mapbox/dark-v10",
    };

    if (styleMap[style]) {
      map.setStyle(styleMap[style]);
    }
  };

  const toggleLayer = (layerId: string, visible: boolean) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(
        layerId,
        "visibility",
        visible ? "visible" : "none",
      );
    }
  };

  const showDronePopup = (drone: DroneData) => {
    if (activePopup) {
      activePopup.remove();
    }

    const isAllowed = isDroneAllowed(drone.registration);
    const statusColor = isAllowed ? "#10b981" : "#ef4444";
    const statusText = isAllowed ? "ALLOWED" : "RESTRICTED";

    const hours = Math.floor(drone.flightTime / 3600);
    const minutes = Math.floor((drone.flightTime % 3600) / 60);
    const seconds = drone.flightTime % 60;
    const flightTimeFormatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    activePopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 25,
    })
      .setLngLat([drone.longitude, drone.latitude])
      .setHTML(
        `
      <div class="text-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium text-foreground">${drone.registration}</span>
          <span class="px-2 py-1 text-xs rounded" style="background-color: ${statusColor}20; color: ${statusColor}">
            ${statusText}
          </span>
        </div>
        <div class="space-y-1 text-xs text-muted-foreground">
          <div>Flight Time: ${flightTimeFormatted}</div>
          <div>Altitude: ${Math.round(drone.altitude).toLocaleString()}ft</div>
          <div>Speed: ${Math.round(drone.speed)} mph</div>
          <div>Yaw: ${Math.round(drone.yaw)}°</div>
        </div>
      </div>
    `,
      )
      .addTo(map);
  };

  const hideDronePopup = () => {
    if (activePopup) {
      activePopup.remove();
      activePopup = null;
    }
  };

  const destroy = () => {
    // Clean up markers
    droneMarkers.forEach((marker) => marker.remove());
    droneMarkers.clear();

    // Remove popup
    if (activePopup) {
      activePopup.remove();
      activePopup = null;
    }

    // Remove map
    map.remove();
  };

  return {
    map,
    updateDroneMarker,
    updateFlightPath,
    centerOnDrone,
    setMapStyle,
    toggleLayer,
    showDronePopup,
    hideDronePopup,
    destroy,
  };
}
