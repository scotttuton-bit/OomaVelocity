import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { NetworkMetric } from "@shared/schema";
import type { Duration } from "@/pages/dashboard";
import { durationToMs, durationToLabel } from "@/pages/dashboard";

interface RealTimeMetricsProps {
  duration: Duration;
}

function buildTimeRangeUrl(duration: Duration): string {
  const now = Date.now();
  const from = new Date(now - durationToMs(duration)).toISOString();
  const to = new Date(now).toISOString();
  return `/api/metrics?from=${from}&to=${to}`;
}

export function RealTimeMetrics({ duration }: RealTimeMetricsProps) {
  const { data: latestMetrics } = useQuery<NetworkMetric[]>({
    queryKey: ["/api/metrics/latest"],
    refetchInterval: 5000,
  });

  const { data: rangeMetrics } = useQuery<NetworkMetric[]>({
    queryKey: ['/api/metrics', duration],
    queryFn: async () => {
      const res = await fetch(buildTimeRangeUrl(duration));
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const getMainMetric = () => {
    if (!latestMetrics || latestMetrics.length === 0) {
      return {
        downloadSpeed: 0,
        uploadSpeed: 0,
        pingLatency: 0,
        qualityScore: 0,
        downloadChange: 0,
        uploadChange: 0,
        pingChange: 0,
        qualityChange: 0,
        peakDownload: 0,
        lowDownload: 0,
        peakUpload: 0,
        lowUpload: 0,
      };
    }

    const metric = latestMetrics[0];

    let avgDownload = metric.avgDownloadMbps || 0;
    let avgUpload = metric.avgUploadMbps || 0;
    let avgPing = metric.avgPingMs || 0;
    let peakDownload = metric.downloadMbps || 0;
    let lowDownload = metric.downloadMbps || 0;
    let peakUpload = metric.uploadMbps || 0;
    let lowUpload = metric.uploadMbps || 0;

    if (rangeMetrics && rangeMetrics.length > 0) {
      avgDownload = rangeMetrics.reduce((s, m) => s + (m.downloadMbps || 0), 0) / rangeMetrics.length;
      avgUpload = rangeMetrics.reduce((s, m) => s + (m.uploadMbps || 0), 0) / rangeMetrics.length;
      avgPing = rangeMetrics.reduce((s, m) => s + (m.pingMs || 0), 0) / rangeMetrics.length;
      peakDownload = Math.max(...rangeMetrics.map(m => m.downloadMbps || 0));
      lowDownload = Math.min(...rangeMetrics.map(m => m.downloadMbps || 0));
      peakUpload = Math.max(...rangeMetrics.map(m => m.uploadMbps || 0));
      lowUpload = Math.min(...rangeMetrics.map(m => m.uploadMbps || 0));
    }

    const qualityScore = Math.min(100, Math.max(0,
      ((metric.downloadMbps || 0) > 100 ? 100 : (metric.downloadMbps || 0)) * 0.6 +
      ((metric.pingMs || 0) < 50 ? 50 - (metric.pingMs || 0) : 0) * 0.4
    ));

    const avgQuality = rangeMetrics && rangeMetrics.length > 0
      ? rangeMetrics.reduce((s, m) => {
          const q = Math.min(100, Math.max(0,
            ((m.downloadMbps || 0) > 100 ? 100 : (m.downloadMbps || 0)) * 0.6 +
            ((m.pingMs || 0) < 50 ? 50 - (m.pingMs || 0) : 0) * 0.4
          ));
          return s + q;
        }, 0) / rangeMetrics.length
      : qualityScore;

    return {
      downloadSpeed: metric.downloadMbps || 0,
      uploadSpeed: metric.uploadMbps || 0,
      pingLatency: metric.pingMs || 0,
      qualityScore: Math.round(qualityScore * 10) / 10,
      downloadChange: avgDownload > 0
        ? ((metric.downloadMbps || 0) - avgDownload) / avgDownload * 100
        : 0,
      uploadChange: avgUpload > 0
        ? ((metric.uploadMbps || 0) - avgUpload) / avgUpload * 100
        : 0,
      pingChange: avgPing > 0
        ? ((metric.pingMs || 0) - avgPing) / avgPing * 100
        : 0,
      qualityChange: Math.round((qualityScore - avgQuality) * 10) / 10,
      peakDownload: Math.round(peakDownload * 10) / 10,
      lowDownload: Math.round(lowDownload * 10) / 10,
      peakUpload: Math.round(peakUpload * 10) / 10,
      lowUpload: Math.round(lowUpload * 10) / 10,
    };
  };

  const metrics = getMainMetric();
  const periodLabel = durationToLabel(duration);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Download Speed</p>
              <p className="text-3xl font-bold text-success font-mono">
                {metrics.downloadSpeed.toFixed(1)}
              </p>
              <p className="text-sm text-gray-400">Mbps</p>
            </div>
            <div className="h-12 w-12 bg-success bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-download text-success text-xl"></i>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-purple-300/50">Peak</span>
              <span className="font-mono text-emerald-300">{metrics.peakDownload}</span>
              <span className="text-purple-300/50">Low</span>
              <span className="font-mono text-rose-400">{metrics.lowDownload}</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center text-sm">
              <i className={`fas ${metrics.downloadChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-error'} mr-1`}></i>
              <span className={metrics.downloadChange >= 0 ? 'text-success' : 'text-error'}>
                {Math.abs(metrics.downloadChange).toFixed(1)}%
              </span>
              <span className="text-gray-400 ml-1">vs {periodLabel.toLowerCase()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Upload Speed</p>
              <p className="text-3xl font-bold text-purple-400 font-mono">
                {metrics.uploadSpeed.toFixed(1)}
              </p>
              <p className="text-sm text-gray-400">Mbps</p>
            </div>
            <div className="h-12 w-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <i className="fas fa-upload text-purple-400 text-xl"></i>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-purple-300/50">Peak</span>
              <span className="font-mono text-emerald-300">{metrics.peakUpload}</span>
              <span className="text-purple-300/50">Low</span>
              <span className="font-mono text-rose-400">{metrics.lowUpload}</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center text-sm">
              <i className={`fas ${metrics.uploadChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-error'} mr-1`}></i>
              <span className={metrics.uploadChange >= 0 ? 'text-success' : 'text-error'}>
                {Math.abs(metrics.uploadChange).toFixed(1)}%
              </span>
              <span className="text-gray-400 ml-1">vs {periodLabel.toLowerCase()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Ping Latency</p>
              <p className="text-3xl font-bold text-info font-mono">
                {metrics.pingLatency.toFixed(1)}
              </p>
              <p className="text-sm text-gray-400">ms</p>
            </div>
            <div className="h-12 w-12 bg-info/20 rounded-full flex items-center justify-center">
              <i className="fas fa-stopwatch text-info text-xl"></i>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <i className={`fas ${metrics.pingChange <= 0 ? 'fa-arrow-down text-success' : 'fa-arrow-up text-info'} mr-1`}></i>
              <span className={metrics.pingChange <= 0 ? 'text-success' : 'text-info'}>
                {Math.abs(metrics.pingChange).toFixed(1)}%
              </span>
              <span className="text-gray-400 ml-1">vs {periodLabel.toLowerCase()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Quality Score</p>
              <p className="text-3xl font-bold text-success font-mono">
                {metrics.qualityScore.toFixed(1)}
              </p>
              <p className="text-sm text-gray-400">/ 100</p>
            </div>
            <div className="h-12 w-12 bg-success bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-star text-success text-xl"></i>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <i className={`fas ${metrics.qualityChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-error'} mr-1`}></i>
              <span className={metrics.qualityChange >= 0 ? 'text-success' : 'text-error'}>
                {metrics.qualityChange >= 0 ? '+' : ''}{metrics.qualityChange.toFixed(1)}
              </span>
              <span className="text-gray-400 ml-1">pts vs {periodLabel.toLowerCase()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
