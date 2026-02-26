import type { NetworkMetric } from "@shared/schema";
import type { Duration } from "@/pages/dashboard";

let Chart: any = null;

const loadChart = async () => {
  if (!Chart && typeof window !== 'undefined') {
    const { default: ChartJS } = await import('chart.js/auto');
    Chart = ChartJS;
  }
  return Chart;
};

function downsample(metrics: NetworkMetric[], maxPoints: number): NetworkMetric[] {
  if (metrics.length <= maxPoints) return metrics;
  const step = Math.ceil(metrics.length / maxPoints);
  const result: NetworkMetric[] = [];
  for (let i = 0; i < metrics.length; i += step) {
    const chunk = metrics.slice(i, Math.min(i + step, metrics.length));
    const avg: any = { ...chunk[0] };
    avg.downloadMbps = chunk.reduce((s, m) => s + (m.downloadMbps || 0), 0) / chunk.length;
    avg.uploadMbps = chunk.reduce((s, m) => s + (m.uploadMbps || 0), 0) / chunk.length;
    avg.pingMs = chunk.reduce((s, m) => s + (m.pingMs || 0), 0) / chunk.length;
    avg.timestampIso = chunk[Math.floor(chunk.length / 2)].timestampIso;
    result.push(avg);
  }
  return result;
}

function formatLabel(ts: string | Date, duration: Duration): string {
  const d = new Date(ts);
  switch (duration) {
    case '1h':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case '6h':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case '24h':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case '7d':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit' });
  }
}

function getMaxPoints(duration: Duration): number {
  switch (duration) {
    case '1h': return 12;
    case '6h': return 24;
    case '24h': return 48;
    case '7d': return 56;
  }
}

export const createSpeedChart = async (
  canvas: HTMLCanvasElement,
  metrics: NetworkMetric[],
  duration: Duration
) => {
  const ChartJS = await loadChart();
  if (!ChartJS) return null;

  const sorted = metrics
    .slice()
    .sort((a, b) => new Date(a.timestampIso).getTime() - new Date(b.timestampIso).getTime());

  const sampled = downsample(sorted, getMaxPoints(duration));
  const labels = sampled.map(m => formatLabel(m.timestampIso, duration));
  const downloadData = sampled.map(m => Math.round((m.downloadMbps || 0) * 10) / 10);
  const uploadData = sampled.map(m => Math.round((m.uploadMbps || 0) * 10) / 10);

  return new ChartJS(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Download',
          data: downloadData,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: sampled.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Upload',
          data: uploadData,
          borderColor: '#1976D2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: sampled.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1f2937',
          titleColor: '#f3f4f6',
          bodyColor: '#d1d5db',
          borderColor: '#374151',
          borderWidth: 1,
          callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} Mbps`,
          }
        }
      },
      scales: {
        y: {
          grid: { color: '#374151' },
          ticks: { color: '#9CA3AF', callback: (v: any) => `${v}` },
          title: { display: true, text: 'Speed (Mbps)', color: '#9CA3AF' },
          beginAtZero: false,
        },
        x: {
          grid: { color: '#374151' },
          ticks: {
            color: '#9CA3AF',
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12,
          }
        }
      },
    }
  });
};

export const createLatencyChart = async (
  canvas: HTMLCanvasElement,
  metrics: NetworkMetric[],
  duration: Duration
) => {
  const ChartJS = await loadChart();
  if (!ChartJS) return null;

  const sorted = metrics
    .slice()
    .sort((a, b) => new Date(a.timestampIso).getTime() - new Date(b.timestampIso).getTime());

  const sampled = downsample(sorted, getMaxPoints(duration));
  const labels = sampled.map(m => formatLabel(m.timestampIso, duration));
  const pingData = sampled.map(m => Math.round((m.pingMs || 0) * 10) / 10);
  const jitterData = pingData.map((ping, i) => {
    if (i === 0) return 0;
    return Math.round(Math.abs(ping - pingData[i - 1]) * 10) / 10;
  });

  return new ChartJS(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Ping',
          data: pingData,
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: sampled.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Jitter',
          data: jitterData,
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: sampled.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1f2937',
          titleColor: '#f3f4f6',
          bodyColor: '#d1d5db',
          borderColor: '#374151',
          borderWidth: 1,
          callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} ms`,
          }
        }
      },
      scales: {
        y: {
          grid: { color: '#374151' },
          ticks: { color: '#9CA3AF' },
          title: { display: true, text: 'Latency (ms)', color: '#9CA3AF' },
          beginAtZero: true,
        },
        x: {
          grid: { color: '#374151' },
          ticks: {
            color: '#9CA3AF',
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12,
          }
        }
      },
    }
  });
};
