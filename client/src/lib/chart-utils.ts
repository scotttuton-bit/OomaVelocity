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
    case '30d':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case '90d':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function getMaxPoints(duration: Duration): number {
  switch (duration) {
    case '1h': return 12;
    case '6h': return 24;
    case '24h': return 48;
    case '7d': return 56;
    case '30d': return 60;
    case '90d': return 90;
  }
}

const THEME = {
  download: '#34d399',
  downloadBg: 'rgba(52, 211, 153, 0.12)',
  upload: '#a855f7',
  uploadBg: 'rgba(168, 85, 247, 0.12)',
  ping: '#38bdf8',
  pingBg: 'rgba(56, 189, 248, 0.12)',
  jitter: '#6366f1',
  jitterBg: 'rgba(99, 102, 241, 0.12)',
  grid: 'rgba(139, 92, 246, 0.12)',
  tick: '#8b8da3',
  tooltipBg: 'hsl(258, 22%, 12%)',
  tooltipTitle: '#e2e0f0',
  tooltipBody: '#a5a3b8',
  tooltipBorder: 'hsl(258, 14%, 24%)',
};

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
          borderColor: THEME.download,
          backgroundColor: THEME.downloadBg,
          tension: 0.4,
          fill: true,
          pointRadius: sampled.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Upload',
          data: uploadData,
          borderColor: THEME.upload,
          backgroundColor: THEME.uploadBg,
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
          backgroundColor: THEME.tooltipBg,
          titleColor: THEME.tooltipTitle,
          bodyColor: THEME.tooltipBody,
          borderColor: THEME.tooltipBorder,
          borderWidth: 1,
          callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} Mbps`,
          }
        }
      },
      scales: {
        y: {
          grid: { color: THEME.grid },
          ticks: { color: THEME.tick, callback: (v: any) => `${v}` },
          title: { display: true, text: 'Speed (Mbps)', color: THEME.tick },
          beginAtZero: false,
        },
        x: {
          grid: { color: THEME.grid },
          ticks: {
            color: THEME.tick,
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
          borderColor: THEME.ping,
          backgroundColor: THEME.pingBg,
          tension: 0.4,
          fill: true,
          pointRadius: sampled.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Jitter',
          data: jitterData,
          borderColor: THEME.jitter,
          backgroundColor: THEME.jitterBg,
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
          backgroundColor: THEME.tooltipBg,
          titleColor: THEME.tooltipTitle,
          bodyColor: THEME.tooltipBody,
          borderColor: THEME.tooltipBorder,
          borderWidth: 1,
          callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} ms`,
          }
        }
      },
      scales: {
        y: {
          grid: { color: THEME.grid },
          ticks: { color: THEME.tick },
          title: { display: true, text: 'Latency (ms)', color: THEME.tick },
          beginAtZero: true,
        },
        x: {
          grid: { color: THEME.grid },
          ticks: {
            color: THEME.tick,
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12,
          }
        }
      },
    }
  });
};
