import { db } from "./server/db";
import { devices, networkMetrics, alerts } from "./shared/schema";
import { sql } from "drizzle-orm";

async function seedData() {
  console.log('Clearing existing data...');
  await db.delete(alerts);
  await db.delete(networkMetrics);
  await db.delete(devices);

  console.log('Seeding database with realistic performance data...');

  const deviceData = [
    { name: 'SF-HQ-RTR-01', location: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194, status: 'active' as const, ipAddress: '192.168.1.1', deviceType: 'router', lastSeen: new Date() },
    { name: 'SF-HQ-RTR-02', location: 'San Francisco, CA', latitude: 37.7751, longitude: -122.4180, status: 'active' as const, ipAddress: '192.168.1.2', deviceType: 'router', lastSeen: new Date() },
    { name: 'SF-HQ-PI-01', location: 'San Francisco, CA', latitude: 37.7745, longitude: -122.4200, status: 'active' as const, ipAddress: '192.168.1.10', deviceType: 'pi', lastSeen: new Date() },
    { name: 'SF-DC-AGT-01', location: 'San Francisco, CA', latitude: 37.7755, longitude: -122.4175, status: 'active' as const, ipAddress: '192.168.1.20', deviceType: 'agent', lastSeen: new Date() },
    { name: 'SF-DC-AGT-02', location: 'San Francisco, CA', latitude: 37.7740, longitude: -122.4210, status: 'active' as const, ipAddress: '192.168.1.21', deviceType: 'agent', lastSeen: new Date() },

    { name: 'NYC-OFF-RTR-01', location: 'New York, NY', latitude: 40.7128, longitude: -74.0060, status: 'active' as const, ipAddress: '10.0.0.1', deviceType: 'router', lastSeen: new Date() },
    { name: 'NYC-OFF-RTR-02', location: 'New York, NY', latitude: 40.7135, longitude: -74.0050, status: 'active' as const, ipAddress: '10.0.0.2', deviceType: 'router', lastSeen: new Date() },
    { name: 'NYC-OFF-PI-01', location: 'New York, NY', latitude: 40.7120, longitude: -74.0070, status: 'active' as const, ipAddress: '10.0.0.10', deviceType: 'pi', lastSeen: new Date() },
    { name: 'NYC-DC-AGT-01', location: 'New York, NY', latitude: 40.7140, longitude: -74.0040, status: 'inactive' as const, ipAddress: '10.0.0.20', deviceType: 'agent', lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000) },

    { name: 'ATX-OFF-PI-01', location: 'Austin, TX', latitude: 30.2672, longitude: -97.7431, status: 'active' as const, ipAddress: '172.16.0.1', deviceType: 'pi', lastSeen: new Date() },
    { name: 'ATX-OFF-PI-02', location: 'Austin, TX', latitude: 30.2680, longitude: -97.7420, status: 'active' as const, ipAddress: '172.16.0.2', deviceType: 'pi', lastSeen: new Date() },
    { name: 'ATX-OFF-RTR-01', location: 'Austin, TX', latitude: 30.2665, longitude: -97.7440, status: 'active' as const, ipAddress: '172.16.0.10', deviceType: 'router', lastSeen: new Date() },

    { name: 'CHI-OFF-RTR-01', location: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298, status: 'active' as const, ipAddress: '10.1.0.1', deviceType: 'router', lastSeen: new Date() },
    { name: 'CHI-OFF-AGT-01', location: 'Chicago, IL', latitude: 41.8790, longitude: -87.6285, status: 'active' as const, ipAddress: '10.1.0.10', deviceType: 'agent', lastSeen: new Date() },
    { name: 'CHI-OFF-AGT-02', location: 'Chicago, IL', latitude: 41.8775, longitude: -87.6310, status: 'active' as const, ipAddress: '10.1.0.11', deviceType: 'agent', lastSeen: new Date() },
    { name: 'CHI-DC-RTR-01', location: 'Chicago, IL', latitude: 41.8800, longitude: -87.6270, status: 'active' as const, ipAddress: '10.1.0.20', deviceType: 'router', lastSeen: new Date() },
    { name: 'CHI-DC-RTR-02', location: 'Chicago, IL', latitude: 41.8770, longitude: -87.6320, status: 'inactive' as const, ipAddress: '10.1.0.21', deviceType: 'router', lastSeen: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    { name: 'CHI-DC-PI-01', location: 'Chicago, IL', latitude: 41.8785, longitude: -87.6295, status: 'active' as const, ipAddress: '10.1.0.30', deviceType: 'pi', lastSeen: new Date() },
    { name: 'CHI-DC-AGT-03', location: 'Chicago, IL', latitude: 41.8795, longitude: -87.6280, status: 'active' as const, ipAddress: '10.1.0.12', deviceType: 'agent', lastSeen: new Date() },

    { name: 'SEA-OFF-RTR-01', location: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321, status: 'active' as const, ipAddress: '10.2.0.1', deviceType: 'router', lastSeen: new Date() },
    { name: 'SEA-OFF-PI-01', location: 'Seattle, WA', latitude: 47.6070, longitude: -122.3310, status: 'active' as const, ipAddress: '10.2.0.10', deviceType: 'pi', lastSeen: new Date() },

    { name: 'DEN-OFF-AGT-01', location: 'Denver, CO', latitude: 39.7392, longitude: -104.9903, status: 'active' as const, ipAddress: '10.3.0.1', deviceType: 'agent', lastSeen: new Date() },
    { name: 'DEN-OFF-PI-01', location: 'Denver, CO', latitude: 39.7400, longitude: -104.9890, status: 'active' as const, ipAddress: '10.3.0.10', deviceType: 'pi', lastSeen: new Date() },
    { name: 'DEN-OFF-RTR-01', location: 'Denver, CO', latitude: 39.7385, longitude: -104.9915, status: 'active' as const, ipAddress: '10.3.0.20', deviceType: 'router', lastSeen: new Date() },
    { name: 'DEN-DC-AGT-01', location: 'Denver, CO', latitude: 39.7410, longitude: -104.9880, status: 'offline' as const, ipAddress: '10.3.0.30', deviceType: 'agent', lastSeen: new Date(Date.now() - 48 * 60 * 60 * 1000) },

    { name: 'MIA-OFF-RTR-01', location: 'Miami, FL', latitude: 25.7617, longitude: -80.1918, status: 'active' as const, ipAddress: '10.4.0.1', deviceType: 'router', lastSeen: new Date() },

    { name: 'LAX-DC-RTR-01', location: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437, status: 'active' as const, ipAddress: '10.5.0.1', deviceType: 'router', lastSeen: new Date() },
    { name: 'LAX-DC-RTR-02', location: 'Los Angeles, CA', latitude: 34.0530, longitude: -118.2425, status: 'active' as const, ipAddress: '10.5.0.2', deviceType: 'router', lastSeen: new Date() },
    { name: 'LAX-DC-AGT-01', location: 'Los Angeles, CA', latitude: 34.0515, longitude: -118.2450, status: 'active' as const, ipAddress: '10.5.0.10', deviceType: 'agent', lastSeen: new Date() },
    { name: 'LAX-DC-AGT-02', location: 'Los Angeles, CA', latitude: 34.0525, longitude: -118.2430, status: 'active' as const, ipAddress: '10.5.0.11', deviceType: 'agent', lastSeen: new Date() },
    { name: 'LAX-DC-PI-01', location: 'Los Angeles, CA', latitude: 34.0535, longitude: -118.2445, status: 'active' as const, ipAddress: '10.5.0.20', deviceType: 'pi', lastSeen: new Date() },
    { name: 'LAX-OFF-RTR-01', location: 'Los Angeles, CA', latitude: 34.0510, longitude: -118.2460, status: 'active' as const, ipAddress: '10.5.0.30', deviceType: 'router', lastSeen: new Date() },
    { name: 'LAX-OFF-AGT-01', location: 'Los Angeles, CA', latitude: 34.0540, longitude: -118.2420, status: 'inactive' as const, ipAddress: '10.5.0.40', deviceType: 'agent', lastSeen: new Date(Date.now() - 6 * 60 * 60 * 1000) },

    { name: 'ATL-OFF-RTR-01', location: 'Atlanta, GA', latitude: 33.7490, longitude: -84.3880, status: 'active' as const, ipAddress: '10.6.0.1', deviceType: 'router', lastSeen: new Date() },
    { name: 'ATL-OFF-PI-01', location: 'Atlanta, GA', latitude: 33.7500, longitude: -84.3870, status: 'active' as const, ipAddress: '10.6.0.10', deviceType: 'pi', lastSeen: new Date() },
    { name: 'ATL-OFF-AGT-01', location: 'Atlanta, GA', latitude: 33.7480, longitude: -84.3890, status: 'active' as const, ipAddress: '10.6.0.20', deviceType: 'agent', lastSeen: new Date() },
  ];

  const createdDevices = await db.insert(devices).values(deviceData).returning();
  console.log('Created devices:', createdDevices.length);

  const now = Date.now();
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

  function getInterval(ageMs: number): number {
    if (ageMs < 7 * 24 * 60 * 60 * 1000) return 5 * 60 * 1000;
    if (ageMs < 30 * 24 * 60 * 60 * 1000) return 15 * 60 * 1000;
    return 60 * 60 * 1000;
  }

  function generateRealisticValue(
    base: number,
    variance: number,
    hourOfDay: number,
    dayOfWeek: number,
    trendOffset: number
  ): number {
    const isPeakHour = hourOfDay >= 9 && hourOfDay <= 17;
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isEvening = hourOfDay >= 19 && hourOfDay <= 23;
    const isNight = hourOfDay >= 0 && hourOfDay <= 6;

    let modifier = 0;
    if (isPeakHour && isWeekday) modifier = -variance * 0.3;
    else if (isEvening) modifier = -variance * 0.15;
    else if (isNight) modifier = variance * 0.1;

    const noise = (Math.random() - 0.5) * variance;
    const slowTrend = Math.sin(trendOffset * 0.001) * variance * 0.1;

    return Math.max(0, base + modifier + noise + slowTrend);
  }

  const sfDevice = createdDevices.find(d => d.name === 'SF-HQ-RTR-01')!;
  const nycDevice = createdDevices.find(d => d.name === 'NYC-OFF-RTR-01')!;
  const atxDevice = createdDevices.find(d => d.name === 'ATX-OFF-PI-01')!;
  const chiDevice = createdDevices.find(d => d.name === 'CHI-OFF-RTR-01')!;

  const deviceProfiles = [
    {
      id: sfDevice.id,
      location: 'San Francisco, CA',
      baseDown: 185, varianceDown: 40,
      baseUp: 32, varianceUp: 8,
      basePing: 12, variancePing: 8,
    },
    {
      id: nycDevice.id,
      location: 'New York, NY',
      baseDown: 150, varianceDown: 35,
      baseUp: 28, varianceUp: 7,
      basePing: 18, variancePing: 10,
    },
    {
      id: atxDevice.id,
      location: 'Austin, TX',
      baseDown: 95, varianceDown: 25,
      baseUp: 15, varianceUp: 6,
      basePing: 22, variancePing: 12,
    },
    {
      id: chiDevice.id,
      location: 'Chicago, IL',
      baseDown: 120, varianceDown: 30,
      baseUp: 20, varianceUp: 5,
      basePing: 15, variancePing: 9,
    },
  ];

  const metricsData: any[] = [];
  let totalPoints = 0;

  for (const profile of deviceProfiles) {
    const rollingDown: number[] = [];
    const rollingUp: number[] = [];
    const rollingPing: number[] = [];
    const ROLLING_WINDOW = 12;

    for (let t = now - NINETY_DAYS_MS; t <= now; t += getInterval(now - t)) {
      const date = new Date(t);
      const hour = date.getHours();
      const day = date.getDay();
      const offset = (t - (now - NINETY_DAYS_MS)) / (5 * 60 * 1000);

      const hasOutage = Math.random() < 0.003;

      let download: number, upload: number, ping: number;

      if (hasOutage) {
        download = profile.baseDown * (0.1 + Math.random() * 0.3);
        upload = profile.baseUp * (0.1 + Math.random() * 0.3);
        ping = profile.basePing * (3 + Math.random() * 5);
      } else {
        download = generateRealisticValue(profile.baseDown, profile.varianceDown, hour, day, offset);
        upload = generateRealisticValue(profile.baseUp, profile.varianceUp, hour, day, offset);
        ping = generateRealisticValue(profile.basePing, profile.variancePing, hour, day, offset);
      }

      download = Math.round(download * 10) / 10;
      upload = Math.round(upload * 10) / 10;
      ping = Math.max(1, Math.round(ping * 10) / 10);

      rollingDown.push(download);
      rollingUp.push(upload);
      rollingPing.push(ping);
      if (rollingDown.length > ROLLING_WINDOW) {
        rollingDown.shift();
        rollingUp.shift();
        rollingPing.shift();
      }

      const avgDown = Math.round((rollingDown.reduce((a, b) => a + b, 0) / rollingDown.length) * 10) / 10;
      const avgUp = Math.round((rollingUp.reduce((a, b) => a + b, 0) / rollingUp.length) * 10) / 10;
      const avgPing = Math.round((rollingPing.reduce((a, b) => a + b, 0) / rollingPing.length) * 10) / 10;

      let alertFlags: string | null = null;
      if (ping > profile.basePing * 2) alertFlags = 'PING2X';
      if (download < profile.baseDown * 0.5) alertFlags = 'DOWN50';

      metricsData.push({
        timestampIso: date,
        downloadMbps: download,
        uploadMbps: upload,
        pingMs: ping,
        avgDownloadMbps: avgDown,
        avgUploadMbps: avgUp,
        avgPingMs: avgPing,
        alertFlags,
        deviceId: profile.id,
        location: profile.location
      });

      totalPoints++;
    }
  }

  const BATCH_SIZE = 500;
  for (let i = 0; i < metricsData.length; i += BATCH_SIZE) {
    const batch = metricsData.slice(i, i + BATCH_SIZE);
    await db.insert(networkMetrics).values(batch);
    console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(metricsData.length / BATCH_SIZE)}`);
  }
  console.log('Created network metrics:', totalPoints);

  const nycInactive = createdDevices.find(d => d.name === 'NYC-DC-AGT-01')!;
  const denOffline = createdDevices.find(d => d.name === 'DEN-DC-AGT-01')!;

  const alertData = [
    {
      title: 'High Ping Detected',
      description: 'SF-HQ-RTR-01 ping exceeded 2x average (45ms vs 18ms avg)',
      severity: 'warning' as const,
      deviceId: sfDevice.id,
      acknowledged: false
    },
    {
      title: 'Speed Drop Alert',
      description: 'CHI-OFF-RTR-01 download speed dropped below 50% of average',
      severity: 'error' as const,
      deviceId: chiDevice.id,
      acknowledged: false
    },
    {
      title: 'Device Offline',
      description: 'DEN-DC-AGT-01 has been offline for 48+ hours',
      severity: 'error' as const,
      deviceId: denOffline.id,
      acknowledged: false
    },
    {
      title: 'Agent Disconnected',
      description: 'NYC-DC-AGT-01 agent stopped reporting metrics',
      severity: 'warning' as const,
      deviceId: nycInactive.id,
      acknowledged: false
    }
  ];

  await db.insert(alerts).values(alertData);
  console.log('Created alerts:', alertData.length);

  console.log('Seed completed! Total data points:', totalPoints);
  process.exit(0);
}

seedData().catch(console.error);
