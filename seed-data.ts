import { db } from "./server/db";
import { devices, networkMetrics, alerts } from "./shared/schema";

async function seedData() {
  console.log('Seeding database with sample data...');
  
  // Create sample devices
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

  // Create sample network metrics
  const metricsData = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Every hour for 24 hours
    
    // Main office metrics
    metricsData.push({
      timestampIso: timestamp,
      downloadMbps: 150 + Math.random() * 50,
      uploadMbps: 25 + Math.random() * 10,
      pingMs: 15 + Math.random() * 10,
      avgDownloadMbps: 160,
      avgUploadMbps: 28,
      avgPingMs: 18,
      alertFlags: Math.random() < 0.1 ? 'PING2X' : null,
      deviceId: createdDevices[0].id,
      location: 'San Francisco, CA'
    });
    
    // Home office metrics
    metricsData.push({
      timestampIso: timestamp,
      downloadMbps: 80 + Math.random() * 30,
      uploadMbps: 12 + Math.random() * 8,
      pingMs: 25 + Math.random() * 15,
      avgDownloadMbps: 85,
      avgUploadMbps: 15,
      avgPingMs: 28,
      alertFlags: Math.random() < 0.05 ? 'DOWN50' : null,
      deviceId: createdDevices[1].id,
      location: 'Austin, TX'
    });
  }

  await db.insert(networkMetrics).values(metricsData);
  console.log('Created network metrics:', metricsData.length);

  // Create sample alerts
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
  
  console.log('Sample data seeding completed!');
  process.exit(0);
}

seedData().catch(console.error);