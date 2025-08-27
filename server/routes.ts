import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployments
  app.get("/health", async (req, res) => {
    try {
      // Check if storage is accessible
      await storage.getAllDrones();
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        error: "Storage check failed",
        timestamp: new Date().toISOString()
      });
    }
  });

  // REST API routes
  app.get("/api/drones", async (req, res) => {
    try {
      const drones = await storage.getAllDrones();
      res.json(drones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drones" });
    }
  });

  app.get("/api/drones/:id/flight-paths", async (req, res) => {
    try {
      const { id } = req.params;
      const paths = await storage.getFlightPathsForDrone(id);
      res.json(paths);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flight paths" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time drone updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const connectedClients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    connectedClients.add(ws);
    console.log("Client connected to WebSocket");

    // Send initial drone data
    storage.getAllDrones().then((drones) => {
      drones.forEach((drone) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "drone_update",
              drone: {
                id: drone.id,
                registration: drone.registration,
                latitude: drone.latitude,
                longitude: drone.longitude,
                altitude: drone.altitude,
                yaw: drone.yaw,
                speed: drone.speed,
                flightTime: drone.flightTime,
                isActive: drone.isActive,
              },
            }),
          );
        }
      });
    });

    ws.on("close", () => {
      connectedClients.delete(ws);
      console.log("Client disconnected from WebSocket");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      connectedClients.delete(ws);
    });
  });

  // Simulate real-time drone updates
  const simulateUpdates = () => {
    storage.getAllDrones().then((drones) => {
      drones.forEach(async (drone) => {
        // Simulate movement
        const latChange = (Math.random() - 0.5) * 0.001;
        const lngChange = (Math.random() - 0.5) * 0.001;
        const altChange = (Math.random() - 0.5) * 50;
        const yawChange = (Math.random() - 0.5) * 10;
        const speedChange = (Math.random() - 0.5) * 5;

        const updatedDrone = await storage.updateDrone(drone.id, {
          latitude: Math.max(-90, Math.min(90, drone.latitude + latChange)),
          longitude: Math.max(-180, Math.min(180, drone.longitude + lngChange)),
          altitude: Math.max(0, drone.altitude + altChange),
          yaw: (drone.yaw + yawChange + 360) % 360,
          speed: Math.max(0, drone.speed + speedChange),
          flightTime: drone.flightTime + 1,
        });

        if (updatedDrone) {
          // Add to flight path
          await storage.addFlightPath({
            droneId: updatedDrone.id,
            latitude: updatedDrone.latitude,
            longitude: updatedDrone.longitude,
            altitude: updatedDrone.altitude,
          });

          // Broadcast to all connected clients
          const message = JSON.stringify({
            type: "drone_update",
            drone: {
              id: updatedDrone.id,
              registration: updatedDrone.registration,
              latitude: updatedDrone.latitude,
              longitude: updatedDrone.longitude,
              altitude: updatedDrone.altitude,
              yaw: updatedDrone.yaw,
              speed: updatedDrone.speed,
              flightTime: updatedDrone.flightTime,
              isActive: updatedDrone.isActive,
            },
          });

          connectedClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });

          // Also send flight path update
          const pathMessage = JSON.stringify({
            type: "flight_path_update",
            path: {
              droneId: updatedDrone.id,
              latitude: updatedDrone.latitude,
              longitude: updatedDrone.longitude,
              altitude: updatedDrone.altitude,
            },
          });

          connectedClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(pathMessage);
            }
          });
        }
      });
    });
  };

  // Start simulation
  setInterval(simulateUpdates, 2000); // Update every 2 seconds

  // Clean up old flight paths every hour
  setInterval(
    () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      storage.clearOldFlightPaths(oneHourAgo);
    },
    60 * 60 * 1000,
  );

  return httpServer;
}
