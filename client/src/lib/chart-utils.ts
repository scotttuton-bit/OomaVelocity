import type { NetworkMetric } from "@shared/schema";

// Dynamically import Chart.js to avoid SSR issues
let Chart: any = null;

const loadChart = async () => {
  if (!Chart && typeof window !== 'undefined') {
    const { default: ChartJS } = await import('chart.js/auto');
    Chart = ChartJS;
  }
  return Chart;
};

export const createSpeedChart = async (canvas: HTMLCanvasElement, metrics: NetworkMetric[]) => {
  const ChartJS = await loadChart();
  if (!ChartJS) return null;

  // Sort metrics by timestamp and take last 20 for readability
  const sortedMetrics = metrics
    .slice()
    .sort((a, b) => new Date(a.timestampIso).getTime() - new Date(b.timestampIso).getTime())
    .slice(-20);

  const labels = sortedMetrics.map(m => 
    new Date(m.timestampIso).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  );

  const downloadData = sortedMetrics.map(m => m.downloadMbps || 0);
  const uploadData = sortedMetrics.map(m => m.uploadMbps || 0);

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
          fill: false,
        },
        {
          label: 'Upload',
          data: uploadData,
          borderColor: '#1976D2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          grid: { 
            color: '#374151' 
          },
          ticks: { 
            color: '#9CA3AF' 
          },
          title: {
            display: true,
            text: 'Speed (Mbps)',
            color: '#9CA3AF'
          }
        },
        x: {
          grid: { 
            color: '#374151' 
          },
          ticks: { 
            color: '#9CA3AF' 
          }
        }
      },
      elements: {
        point: {
          radius: 3,
          hoverRadius: 5
        }
      }
    }
  });
};

export const createLatencyChart = async (canvas: HTMLCanvasElement, metrics: NetworkMetric[]) => {
  const ChartJS = await loadChart();
  if (!ChartJS) return null;

  // Sort metrics by timestamp and take last 20 for readability
  const sortedMetrics = metrics
    .slice()
    .sort((a, b) => new Date(a.timestampIso).getTime() - new Date(b.timestampIso).getTime())
    .slice(-20);

  const labels = sortedMetrics.map(m => 
    new Date(m.timestampIso).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  );

  const pingData = sortedMetrics.map(m => m.pingMs || 0);
  // Calculate jitter as the difference between consecutive ping values
  const jitterData = pingData.map((ping, index) => {
    if (index === 0) return 0;
    return Math.abs(ping - pingData[index - 1]);
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
          fill: false,
        },
        {
          label: 'Jitter',
          data: jitterData,
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          grid: { 
            color: '#374151' 
          },
          ticks: { 
            color: '#9CA3AF' 
          },
          title: {
            display: true,
            text: 'Latency (ms)',
            color: '#9CA3AF'
          }
        },
        x: {
          grid: { 
            color: '#374151' 
          },
          ticks: { 
            color: '#9CA3AF' 
          }
        }
      },
      elements: {
        point: {
          radius: 3,
          hoverRadius: 5
        }
      }
    }
  });
};
