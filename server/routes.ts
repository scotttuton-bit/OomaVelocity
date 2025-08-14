import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertNetworkMetricSchema, insertDeviceSchema, insertAlertSchema, insertExportRequestSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csv from "csv-parser";
import * as fs from "fs";
import { Readable } from "stream";

const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Network metrics endpoints
  app.get('/api/metrics', async (req, res) => {
    try {
      const { limit, deviceId, from, to } = req.query;
      let metrics;

      if (from && to) {
        metrics = await storage.getMetricsInRange(
          new Date(from as string),
          new Date(to as string),
          deviceId as string
        );
      } else {
        metrics = await storage.getNetworkMetrics(
          limit ? parseInt(limit as string) : undefined,
          deviceId as string
        );
      }

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  app.get('/api/metrics/latest', async (req, res) => {
    try {
      const { deviceId } = req.query;
      const metrics = await storage.getLatestMetrics(deviceId as string);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching latest metrics:', error);
      res.status(500).json({ error: 'Failed to fetch latest metrics' });
    }
  });

  app.post('/api/metrics', async (req, res) => {
    try {
      const metric = insertNetworkMetricSchema.parse(req.body);
      const newMetric = await storage.createNetworkMetric(metric);
      
      // Broadcast real-time update
      broadcast({ type: 'metric_update', data: newMetric });
      
      res.status(201).json(newMetric);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid metric data', details: error.errors });
      }
      console.error('Error creating metric:', error);
      res.status(500).json({ error: 'Failed to create metric' });
    }
  });

  // CSV import endpoint
  app.post('/api/metrics/import', upload.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No CSV file provided' });
      }

      const results: any[] = [];
      const stream = fs.createReadStream(req.file.path);
      
      stream
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
          try {
            let imported = 0;
            let errors = 0;

            for (const row of results) {
              try {
                const metric = {
                  timestampIso: new Date(row.timestamp_iso),
                  downloadMbps: parseFloat(row.download_mbps) || null,
                  uploadMbps: parseFloat(row.upload_mbps) || null,
                  pingMs: parseFloat(row.ping_ms) || null,
                  avgDownloadMbps: parseFloat(row.avg_download_mbps) || null,
                  avgUploadMbps: parseFloat(row.avg_upload_mbps) || null,
                  avgPingMs: parseFloat(row.avg_ping_ms) || null,
                  alertFlags: row.alert_flags || null,
                  deviceId: req.body.deviceId || 'default-device',
                  location: req.body.location || null,
                };

                await storage.createNetworkMetric(metric);
                imported++;
              } catch (err) {
                errors++;
                console.error('Error importing row:', err);
              }
            }

            // Clean up uploaded file
            if (req.file) {
              fs.unlinkSync(req.file.path);
            }

            res.json({ 
              message: 'CSV import completed', 
              imported, 
              errors,
              total: results.length 
            });
          } catch (error) {
            console.error('Error processing CSV:', error);
            res.status(500).json({ error: 'Failed to process CSV file' });
          }
        });
    } catch (error) {
      console.error('Error importing CSV:', error);
      res.status(500).json({ error: 'Failed to import CSV' });
    }
  });

  // Device management endpoints
  app.get('/api/devices', async (req, res) => {
    try {
      const devices = await storage.getDevices();
      res.json(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  });

  app.post('/api/devices', async (req, res) => {
    try {
      const device = insertDeviceSchema.parse(req.body);
      const newDevice = await storage.createDevice(device);
      res.status(201).json(newDevice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid device data', details: error.errors });
      }
      console.error('Error creating device:', error);
      res.status(500).json({ error: 'Failed to create device' });
    }
  });

  app.put('/api/devices/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertDeviceSchema.partial().parse(req.body);
      const updatedDevice = await storage.updateDevice(id, updates);
      res.json(updatedDevice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid device data', details: error.errors });
      }
      console.error('Error updating device:', error);
      res.status(500).json({ error: 'Failed to update device' });
    }
  });

  app.delete('/api/devices/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDevice(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(500).json({ error: 'Failed to delete device' });
    }
  });

  // Alert management endpoints
  app.get('/api/alerts', async (req, res) => {
    try {
      const { active, limit } = req.query;
      let alerts;
      
      if (active === 'true') {
        alerts = await storage.getActiveAlerts();
      } else {
        alerts = await storage.getAlerts(limit ? parseInt(limit as string) : undefined);
      }
      
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.post('/api/alerts', async (req, res) => {
    try {
      const alert = insertAlertSchema.parse(req.body);
      const newAlert = await storage.createAlert(alert);
      
      // Broadcast real-time alert
      broadcast({ type: 'new_alert', data: newAlert });
      
      res.status(201).json(newAlert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid alert data', details: error.errors });
      }
      console.error('Error creating alert:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  app.patch('/api/alerts/:id/acknowledge', async (req, res) => {
    try {
      const { id } = req.params;
      const alert = await storage.acknowledgeAlert(id);
      res.json(alert);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  });

  app.patch('/api/alerts/:id/resolve', async (req, res) => {
    try {
      const { id } = req.params;
      const alert = await storage.resolveAlert(id);
      res.json(alert);
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({ error: 'Failed to resolve alert' });
    }
  });

  // Export endpoints
  app.post('/api/export', async (req, res) => {
    try {
      const request = insertExportRequestSchema.parse(req.body);
      const exportRequest = await storage.createExportRequest(request);
      
      // Start export processing (simplified for this implementation)
      processExportRequest(exportRequest.id);
      
      res.status(201).json(exportRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid export request', details: error.errors });
      }
      console.error('Error creating export request:', error);
      res.status(500).json({ error: 'Failed to create export request' });
    }
  });

  app.get('/api/export/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const exportRequest = await storage.getExportRequest(id);
      
      if (!exportRequest) {
        return res.status(404).json({ error: 'Export request not found' });
      }
      
      res.json(exportRequest);
    } catch (error) {
      console.error('Error fetching export request:', error);
      res.status(500).json({ error: 'Failed to fetch export request' });
    }
  });

  // Simple export processing function
  async function processExportRequest(requestId: string) {
    try {
      const request = await storage.getExportRequest(requestId);
      if (!request) return;

      await storage.updateExportRequest(requestId, { status: 'processing' });

      // Get metrics data
      const metrics = await storage.getMetricsInRange(request.dateFrom, request.dateTo);
      
      // Generate CSV content
      const csvContent = [
        'timestamp,device_id,download_mbps,upload_mbps,ping_ms,location',
        ...metrics.map(m => 
          `${m.timestampIso.toISOString()},${m.deviceId || ''},${m.downloadMbps || ''},${m.uploadMbps || ''},${m.pingMs || ''},${m.location || ''}`
        )
      ].join('\n');

      // In a real implementation, you'd save this to a file and provide a download link
      await storage.updateExportRequest(requestId, { 
        status: 'completed',
        filePath: `/exports/${requestId}.csv`
      });

    } catch (error) {
      console.error('Error processing export:', error);
      await storage.updateExportRequest(requestId, { status: 'failed' });
    }
  }

  return httpServer;
}
