import {
  networkMetrics,
  devices,
  alerts,
  exportRequests,
  type NetworkMetric,
  type InsertNetworkMetric,
  type Device,
  type InsertDevice,
  type Alert,
  type InsertAlert,
  type ExportRequest,
  type InsertExportRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, lte, and, sql, asc } from "drizzle-orm";

export interface IStorage {
  // Network Metrics
  createNetworkMetric(metric: InsertNetworkMetric): Promise<NetworkMetric>;
  getNetworkMetrics(limit?: number, deviceId?: string): Promise<NetworkMetric[]>;
  getLatestMetrics(deviceId?: string, location?: string): Promise<NetworkMetric[]>;
  getMetricsInRange(from: Date, to: Date, deviceId?: string, location?: string): Promise<NetworkMetric[]>;
  
  // Devices
  createDevice(device: InsertDevice): Promise<Device>;
  getDevices(): Promise<Device[]>;
  getDevice(id: string): Promise<Device | undefined>;
  updateDevice(id: string, updates: Partial<InsertDevice>): Promise<Device>;
  deleteDevice(id: string): Promise<void>;
  
  // Alerts
  createAlert(alert: InsertAlert): Promise<Alert>;
  getActiveAlerts(): Promise<Alert[]>;
  getAlerts(limit?: number): Promise<Alert[]>;
  acknowledgeAlert(id: string): Promise<Alert>;
  resolveAlert(id: string): Promise<Alert>;
  
  // Export Requests
  createExportRequest(request: InsertExportRequest): Promise<ExportRequest>;
  getExportRequest(id: string): Promise<ExportRequest | undefined>;
  updateExportRequest(id: string, updates: Partial<InsertExportRequest>): Promise<ExportRequest>;
  
  // Analytics
  getDashboardStats(): Promise<{
    activeDevices: number;
    networkScore: number;
    activeAlerts: number;
    totalMetrics: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async createNetworkMetric(metric: InsertNetworkMetric): Promise<NetworkMetric> {
    const [newMetric] = await db
      .insert(networkMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  async getNetworkMetrics(limit = 100, deviceId?: string): Promise<NetworkMetric[]> {
    const query = db
      .select()
      .from(networkMetrics)
      .orderBy(desc(networkMetrics.timestampIso))
      .limit(limit);

    if (deviceId) {
      return query.where(eq(networkMetrics.deviceId, deviceId));
    }
    
    return query;
  }

  async getLatestMetrics(deviceId?: string, location?: string): Promise<NetworkMetric[]> {
    if (deviceId) {
      const [latest] = await db
        .select()
        .from(networkMetrics)
        .where(eq(networkMetrics.deviceId, deviceId))
        .orderBy(desc(networkMetrics.timestampIso))
        .limit(1);
      return latest ? [latest] : [];
    }

    if (location) {
      const latestMetrics = await db
        .select()
        .from(networkMetrics)
        .where(and(
          eq(networkMetrics.location, location),
          sql`(${networkMetrics.deviceId}, ${networkMetrics.timestampIso}) IN (
            SELECT ${networkMetrics.deviceId}, MAX(${networkMetrics.timestampIso})
            FROM ${networkMetrics}
            WHERE ${networkMetrics.location} = ${location}
            GROUP BY ${networkMetrics.deviceId}
          )`
        ));
      return latestMetrics;
    }

    const latestMetrics = await db
      .select()
      .from(networkMetrics)
      .where(sql`(${networkMetrics.deviceId}, ${networkMetrics.timestampIso}) IN (
        SELECT ${networkMetrics.deviceId}, MAX(${networkMetrics.timestampIso})
        FROM ${networkMetrics}
        GROUP BY ${networkMetrics.deviceId}
      )`);
    
    return latestMetrics;
  }

  async getMetricsInRange(from: Date, to: Date, deviceId?: string, location?: string): Promise<NetworkMetric[]> {
    const conditions = [
      gte(networkMetrics.timestampIso, from),
      lte(networkMetrics.timestampIso, to),
    ];
    if (deviceId) conditions.push(eq(networkMetrics.deviceId, deviceId));
    if (location) conditions.push(eq(networkMetrics.location, location));

    return db
      .select()
      .from(networkMetrics)
      .where(and(...conditions))
      .orderBy(asc(networkMetrics.timestampIso));
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const [newDevice] = await db
      .insert(devices)
      .values({
        ...device,
        updatedAt: new Date(),
      })
      .returning();
    return newDevice;
  }

  async getDevices(): Promise<Device[]> {
    return db.select().from(devices).orderBy(asc(devices.name));
  }

  async getDevice(id: string): Promise<Device | undefined> {
    const [device] = await db
      .select()
      .from(devices)
      .where(eq(devices.id, id));
    return device;
  }

  async updateDevice(id: string, updates: Partial<InsertDevice>): Promise<Device> {
    const [updated] = await db
      .update(devices)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(devices.id, id))
      .returning();
    return updated;
  }

  async deleteDevice(id: string): Promise<void> {
    await db.delete(devices).where(eq(devices.id, id));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.acknowledged, false),
          sql`${alerts.resolvedAt} IS NULL`
        )
      )
      .orderBy(desc(alerts.createdAt));
  }

  async getAlerts(limit = 50): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt))
      .limit(limit);
  }

  async acknowledgeAlert(id: string): Promise<Alert> {
    const [updated] = await db
      .update(alerts)
      .set({ acknowledged: true })
      .where(eq(alerts.id, id))
      .returning();
    return updated;
  }

  async resolveAlert(id: string): Promise<Alert> {
    const [updated] = await db
      .update(alerts)
      .set({ 
        acknowledged: true,
        resolvedAt: new Date()
      })
      .where(eq(alerts.id, id))
      .returning();
    return updated;
  }

  async createExportRequest(request: InsertExportRequest): Promise<ExportRequest> {
    const [newRequest] = await db
      .insert(exportRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async getExportRequest(id: string): Promise<ExportRequest | undefined> {
    const [request] = await db
      .select()
      .from(exportRequests)
      .where(eq(exportRequests.id, id));
    return request;
  }

  async updateExportRequest(id: string, updates: Partial<InsertExportRequest>): Promise<ExportRequest> {
    const [updated] = await db
      .update(exportRequests)
      .set(updates)
      .where(eq(exportRequests.id, id))
      .returning();
    return updated;
  }

  async getDashboardStats(): Promise<{
    activeDevices: number;
    networkScore: number;
    activeAlerts: number;
    totalMetrics: number;
  }> {
    const [deviceCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(devices)
      .where(eq(devices.status, "active"));

    const [alertCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(
        and(
          eq(alerts.acknowledged, false),
          sql`${alerts.resolvedAt} IS NULL`
        )
      );

    const [metricCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(networkMetrics);

    // Calculate network score based on recent metrics
    const recentMetrics = await db
      .select({
        downloadMbps: networkMetrics.downloadMbps,
        pingMs: networkMetrics.pingMs,
      })
      .from(networkMetrics)
      .where(
        gte(networkMetrics.timestampIso, new Date(Date.now() - 60 * 60 * 1000)) // Last hour
      );

    let networkScore = 100;
    if (recentMetrics.length > 0) {
      const avgDownload = recentMetrics.reduce((sum, m) => sum + (m.downloadMbps || 0), 0) / recentMetrics.length;
      const avgPing = recentMetrics.reduce((sum, m) => sum + (m.pingMs || 0), 0) / recentMetrics.length;
      
      // Simple scoring algorithm
      networkScore = Math.min(100, Math.max(0, 
        (avgDownload > 100 ? 100 : avgDownload) * 0.6 +
        (avgPing < 50 ? 50 - avgPing : 0) * 0.4
      ));
    }

    return {
      activeDevices: deviceCount.count,
      networkScore: Math.round(networkScore * 10) / 10,
      activeAlerts: alertCount.count,
      totalMetrics: metricCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
