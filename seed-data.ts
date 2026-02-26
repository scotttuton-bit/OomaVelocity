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
    {
      name: 'Main Office Router',
      location: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      status: 'active' as const,
      ipAddress: '192.168.1.1',
      deviceType: 'router',
      lastSeen: new Date()
    },
    {
      name: 'Home Office Pi',
      location: 'Austin, TX',
      latitude: 30.2672,
      longitude: -97.7431,
      status: 'active' as const,
      ipAddress: '192.168.1.100',
      deviceType: 'pi',
      lastSeen: new Date()
    },
    {
      name: 'Remote Office Gateway',
      location: 'New York, NY',
      latitude: 40.7128,
      longitude: -74.0060,
      status: 'inactive' as const,
      ipAddress: '10.0.0.1',
      deviceType: 'router',
      lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ];

  const createdDevices = await db.insert(devices).values(deviceData).returning();
  console.log('Created devices:', createdDevices.length);

  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const INTERVAL_MS = 5 * 60 * 1000;

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

  const deviceProfiles = [
    {
      id: createdDevices[0].id,
      location: 'San Francisco, CA',
      baseDown: 185, varianceDown: 40,
      baseUp: 32, varianceUp: 8,
      basePing: 12, variancePing: 8,
    },
    {
      id: createdDevices[1].id,
      location: 'Austin, TX',
      baseDown: 95, varianceDown: 25,
      baseUp: 15, varianceUp: 6,
      basePing: 22, variancePing: 12,
    },
  ];

  const metricsData: any[] = [];
  let totalPoints = 0;

  for (const profile of deviceProfiles) {
    const rollingDown: number[] = [];
    const rollingUp: number[] = [];
    const rollingPing: number[] = [];
    const ROLLING_WINDOW = 12;

    for (let t = now - SEVEN_DAYS_MS; t <= now; t += INTERVAL_MS) {
      const date = new Date(t);
      const hour = date.getHours();
      const day = date.getDay();
      const offset = (t - (now - SEVEN_DAYS_MS)) / INTERVAL_MS;

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

  const alertData = [
    {
      title: 'High Ping Detected',
      description: 'Main Office Router ping exceeded 2x average (45ms vs 18ms avg)',
      severity: 'warning' as const,
      deviceId: createdDevices[0].id,
      acknowledged: false
    },
    {
      title: 'Speed Drop Alert',
      description: 'Home Office Pi download speed dropped below 50% of average',
      severity: 'error' as const,
      deviceId: createdDevices[1].id,
      acknowledged: false
    },
    {
      title: 'Device Offline',
      description: 'Remote Office Gateway has been offline for 24+ hours',
      severity: 'error' as const,
      deviceId: createdDevices[2].id,
      acknowledged: false
    }
  ];

  await db.insert(alerts).values(alertData);
  console.log('Created alerts:', alertData.length);

  console.log('Seed completed! Total data points:', totalPoints);
  process.exit(0);
}

seedData().catch(console.error);
