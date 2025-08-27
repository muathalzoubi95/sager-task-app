// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  drones;
  flightPaths;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.drones = /* @__PURE__ */ new Map();
    this.flightPaths = /* @__PURE__ */ new Map();
    this.initializeMockData();
  }
  initializeMockData() {
    const sampleDrones = [
      {
        registration: "SG-BA1234",
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 1250,
        yaw: 45,
        speed: 35,
        flightTime: 8075,
        // 02:14:35
        isActive: true
      },
      {
        registration: "SG-XY9876",
        latitude: 37.7849,
        longitude: -122.4094,
        altitude: 890,
        yaw: 180,
        speed: 28,
        flightTime: 6312,
        // 01:45:12
        isActive: true
      },
      {
        registration: "SG-BC5678",
        latitude: 37.7649,
        longitude: -122.4294,
        altitude: 2100,
        yaw: 127,
        speed: 42,
        flightTime: 12161,
        // 03:22:41
        isActive: true
      }
    ];
    sampleDrones.forEach((drone) => {
      const id = randomUUID();
      const fullDrone = {
        ...drone,
        id,
        lastSeen: /* @__PURE__ */ new Date()
      };
      this.drones.set(id, fullDrone);
    });
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getAllDrones() {
    return Array.from(this.drones.values());
  }
  async getDrone(id) {
    return this.drones.get(id);
  }
  async createDrone(drone) {
    const id = randomUUID();
    const fullDrone = {
      ...drone,
      id,
      lastSeen: /* @__PURE__ */ new Date()
    };
    this.drones.set(id, fullDrone);
    return fullDrone;
  }
  async updateDrone(id, updates) {
    const existing = this.drones.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updates,
      lastSeen: /* @__PURE__ */ new Date()
    };
    this.drones.set(id, updated);
    return updated;
  }
  async deleteDrone(id) {
    return this.drones.delete(id);
  }
  async getFlightPathsForDrone(droneId) {
    return Array.from(this.flightPaths.values()).filter(
      (path3) => path3.droneId === droneId
    );
  }
  async addFlightPath(path3) {
    const id = randomUUID();
    const fullPath = {
      ...path3,
      id,
      timestamp: /* @__PURE__ */ new Date()
    };
    this.flightPaths.set(id, fullPath);
    return fullPath;
  }
  async clearOldFlightPaths(beforeDate) {
    const entries = Array.from(this.flightPaths.entries());
    for (const [id, path3] of entries) {
      if (path3.timestamp < beforeDate) {
        this.flightPaths.delete(id);
      }
    }
  }
};
var storage = new MemStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/health", async (req, res) => {
    try {
      await storage.getAllDrones();
      res.status(200).json({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        error: "Storage check failed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/drones", async (req, res) => {
    try {
      const drones = await storage.getAllDrones();
      res.json(drones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drones" });
    }
  });
  app2.get("/api/drones/:id/flight-paths", async (req, res) => {
    try {
      const { id } = req.params;
      const paths = await storage.getFlightPathsForDrone(id);
      res.json(paths);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flight paths" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const connectedClients = /* @__PURE__ */ new Set();
  wss.on("connection", (ws) => {
    connectedClients.add(ws);
    console.log("Client connected to WebSocket");
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
                isActive: drone.isActive
              }
            })
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
  const simulateUpdates = () => {
    storage.getAllDrones().then((drones) => {
      drones.forEach(async (drone) => {
        const latChange = (Math.random() - 0.5) * 1e-3;
        const lngChange = (Math.random() - 0.5) * 1e-3;
        const altChange = (Math.random() - 0.5) * 50;
        const yawChange = (Math.random() - 0.5) * 10;
        const speedChange = (Math.random() - 0.5) * 5;
        const updatedDrone = await storage.updateDrone(drone.id, {
          latitude: Math.max(-90, Math.min(90, drone.latitude + latChange)),
          longitude: Math.max(-180, Math.min(180, drone.longitude + lngChange)),
          altitude: Math.max(0, drone.altitude + altChange),
          yaw: (drone.yaw + yawChange + 360) % 360,
          speed: Math.max(0, drone.speed + speedChange),
          flightTime: drone.flightTime + 1
        });
        if (updatedDrone) {
          await storage.addFlightPath({
            droneId: updatedDrone.id,
            latitude: updatedDrone.latitude,
            longitude: updatedDrone.longitude,
            altitude: updatedDrone.altitude
          });
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
              isActive: updatedDrone.isActive
            }
          });
          connectedClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
          const pathMessage = JSON.stringify({
            type: "flight_path_update",
            path: {
              droneId: updatedDrone.id,
              latitude: updatedDrone.latitude,
              longitude: updatedDrone.longitude,
              altitude: updatedDrone.altitude
            }
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
  setInterval(simulateUpdates, 2e3);
  setInterval(
    () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
      storage.clearOldFlightPaths(oneHourAgo);
    },
    60 * 60 * 1e3
  );
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  server.listen(3e3, "0.0.0.0");
})();
