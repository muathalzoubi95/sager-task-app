import { type User, type InsertUser, type Drone, type InsertDrone, type FlightPath, type InsertFlightPath } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Drone operations
  getAllDrones(): Promise<Drone[]>;
  getDrone(id: string): Promise<Drone | undefined>;
  createDrone(drone: InsertDrone): Promise<Drone>;
  updateDrone(id: string, updates: Partial<InsertDrone>): Promise<Drone | undefined>;
  deleteDrone(id: string): Promise<boolean>;
  
  // Flight path operations
  getFlightPathsForDrone(droneId: string): Promise<FlightPath[]>;
  addFlightPath(path: InsertFlightPath): Promise<FlightPath>;
  clearOldFlightPaths(beforeDate: Date): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private drones: Map<string, Drone>;
  private flightPaths: Map<string, FlightPath>;

  constructor() {
    this.users = new Map();
    this.drones = new Map();
    this.flightPaths = new Map();
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with some sample drones for testing
    const sampleDrones: InsertDrone[] = [
      {
        registration: "SG-BA1234",
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 1250,
        yaw: 45,
        speed: 35,
        flightTime: 8075, // 02:14:35
        isActive: true,
      },
      {
        registration: "SG-XY9876",
        latitude: 37.7849,
        longitude: -122.4094,
        altitude: 890,
        yaw: 180,
        speed: 28,
        flightTime: 6312, // 01:45:12
        isActive: true,
      },
      {
        registration: "SG-BC5678",
        latitude: 37.7649,
        longitude: -122.4294,
        altitude: 2100,
        yaw: 127,
        speed: 42,
        flightTime: 12161, // 03:22:41
        isActive: true,
      },
    ];

    sampleDrones.forEach(drone => {
      const id = randomUUID();
      const fullDrone: Drone = {
        ...drone,
        id,
        lastSeen: new Date(),
      };
      this.drones.set(id, fullDrone);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllDrones(): Promise<Drone[]> {
    return Array.from(this.drones.values());
  }

  async getDrone(id: string): Promise<Drone | undefined> {
    return this.drones.get(id);
  }

  async createDrone(drone: InsertDrone): Promise<Drone> {
    const id = randomUUID();
    const fullDrone: Drone = {
      ...drone,
      id,
      lastSeen: new Date(),
    };
    this.drones.set(id, fullDrone);
    return fullDrone;
  }

  async updateDrone(id: string, updates: Partial<InsertDrone>): Promise<Drone | undefined> {
    const existing = this.drones.get(id);
    if (!existing) return undefined;

    const updated: Drone = {
      ...existing,
      ...updates,
      lastSeen: new Date(),
    };
    this.drones.set(id, updated);
    return updated;
  }

  async deleteDrone(id: string): Promise<boolean> {
    return this.drones.delete(id);
  }

  async getFlightPathsForDrone(droneId: string): Promise<FlightPath[]> {
    return Array.from(this.flightPaths.values()).filter(
      path => path.droneId === droneId
    );
  }

  async addFlightPath(path: InsertFlightPath): Promise<FlightPath> {
    const id = randomUUID();
    const fullPath: FlightPath = {
      ...path,
      id,
      timestamp: new Date(),
    };
    this.flightPaths.set(id, fullPath);
    return fullPath;
  }

  async clearOldFlightPaths(beforeDate: Date): Promise<void> {
    const entries = Array.from(this.flightPaths.entries());
    for (const [id, path] of entries) {
      if (path.timestamp < beforeDate) {
        this.flightPaths.delete(id);
      }
    }
  }
}

export const storage = new MemStorage();
