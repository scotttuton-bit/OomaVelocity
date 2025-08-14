import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const networkMetrics = pgTable("network_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestampIso: timestamp("timestamp_iso").notNull(),
  downloadMbps: real("download_mbps"),
  uploadMbps: real("upload_mbps"),
  pingMs: real("ping_ms"),
  avgDownloadMbps: real("avg_download_mbps"),
  avgUploadMbps: real("avg_upload_mbps"),
  avgPingMs: real("avg_ping_ms"),
  alertFlags: text("alert_flags"),
  deviceId: varchar("device_id"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: text("status").notNull().default("active"), // active, inactive, offline
  lastSeen: timestamp("last_seen"),
  ipAddress: text("ip_address"),
  deviceType: text("device_type"), // router, agent, pi
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull(), // error, warning, info
  deviceId: varchar("device_id").references(() => devices.id),
  metricId: varchar("metric_id").references(() => networkMetrics.id),
  acknowledged: boolean("acknowledged").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exportRequests = pgTable("export_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  format: text("format").notNull(), // csv, pdf, json
  dateFrom: timestamp("date_from").notNull(),
  dateTo: timestamp("date_to").notNull(),
  deviceIds: jsonb("device_ids"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  filePath: text("file_path"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Insert schemas
export const insertNetworkMetricSchema = createInsertSchema(networkMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertExportRequestSchema = createInsertSchema(exportRequests).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type NetworkMetric = typeof networkMetrics.$inferSelect;
export type InsertNetworkMetric = z.infer<typeof insertNetworkMetricSchema>;

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type ExportRequest = typeof exportRequests.$inferSelect;
export type InsertExportRequest = z.infer<typeof insertExportRequestSchema>;
