import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Base types for the application
export interface User {
  id: string;
  username: string;
  email: string;
}

export interface InsertUser {
  username: string;
  email: string;
}

export interface Drone {
  id: string;
  registration: string;
  latitude: number;
  longitude: number;
  altitude: number;
  yaw: number;
  speed: number;
  flightTime: number;
  isActive: boolean;
  lastSeen: Date;
}

export interface InsertDrone {
  registration: string;
  latitude: number;
  longitude: number;
  altitude: number;
  yaw: number;
  speed: number;
  flightTime: number;
  isActive: boolean;
}

export interface FlightPath {
  id: string;
  droneId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: Date;
}

export interface InsertFlightPath {
  droneId: string;
  latitude: number;
  longitude: number;
  altitude: number;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
});

export const insertDroneSchema = z.object({
  registration: z.string().min(1, "Registration is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().min(0),
  yaw: z.number().min(0).max(360),
  speed: z.number().min(0),
  flightTime: z.number().min(0),
  isActive: z.boolean(),
});

export const insertFlightPathSchema = z.object({
  droneId: z.string().min(1, "Drone ID is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().min(0),
});

// Type inference
export type InsertUserType = z.infer<typeof insertUserSchema>;
export type InsertDroneType = z.infer<typeof insertDroneSchema>;
export type InsertFlightPathType = z.infer<typeof insertFlightPathSchema>;