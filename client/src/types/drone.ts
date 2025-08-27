export interface DroneData {
  id: string;
  registration: string;
  latitude: number;
  longitude: number;
  altitude: number;
  yaw: number;
  speed: number;
  flightTime: number;
  isActive: boolean;
  lastSeen?: Date;
}

export interface FlightPathPoint {
  droneId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp?: Date;
}

export interface DroneFilter {
  search: string;
  showAllowed: boolean;
  showRestricted: boolean;
}

export interface MapSettings {
  style: 'satellite' | 'streets' | 'dark';
  showFlightPaths: boolean;
  showRestrictedZones: boolean;
  showAirports: boolean;
}

export function isDroneAllowed(registration: string): boolean {
  return registration.toUpperCase().includes('-B');
}

export function formatFlightTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatAltitude(altitude: number): string {
  return `${Math.round(altitude).toLocaleString()}ft`;
}
