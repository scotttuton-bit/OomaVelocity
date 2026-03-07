import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { NetworkMetric } from "@shared/schema";
import type { Duration } from "@/pages/dashboard";
import { durationToMs } from "@/pages/dashboard";

interface RealTimeMetricsProps {
  duration: Duration;
  location: string;
}

function buildTimeRangeUrl(duration: Duration, location: string): string {
  const now = Date.now();
  const from = new Date(now - durationToMs(duration)).toISOString();
  const to = new Date(now).toISOString();
  let url = `/api/metrics?from=${from}&to=${to}`;
  if (location && location !== 'all') url += `&location=${encodeURIComponent(location)}`;
  return url;
}

function buildLatestUrl(location: string): string {
  let url = '/api/metrics/latest';
  if (location && location !== 'all') url += `?location=${encodeURIComponent(location)}`;
  return url;
}

function calcQuality(down: number, ping: number): number {
  return Math.min(100, Math.max(0,
    (down > 100 ? 100 : down) * 0.6 +
    (ping < 50 ? 50 - ping : 0) * 0.4
  ));
}

export function RealTimeMetrics({ duration, location }: RealTimeMetricsProps) {
  const { data: latestMetrics } = useQuery<NetworkMetric[]>({
    queryKey: ["/api/metrics/latest", location],
    queryFn: async () => {
      const res = await fetch(buildLatestUrl(location));
      if (!res.ok) throw new Error('Failed to fetch latest metrics');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: rangeMetrics } = useQuery<NetworkMetric[]>({
    queryKey: ['/api/metrics', duration, location],
    queryFn: async () => {
      const res = await fetch(buildTimeRangeUrl(duration, location));
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const getMainMetric = () => {
    const empty = {
      avgDownload: 0, avgUpload: 0, avgPing: 0, avgQuality: 0,
      currentDownload: 0, currentUpload: 0, currentPing: 0, currentQuality: 0,
      downloadChange: 0, uploadChange: 0, pingChange: 0, qualityChange: 0,
      peakDownload: 0, lowDownload: 0, peakUpload: 0, lowUpload: 0,
    };

    let currentDown = 0, currentUp = 0, currentPing = 0;
    if (latestMetrics && latestMetrics.length > 0) {
      currentDown = latestMetrics.reduce((s, m) => s + (m.downloadMbps || 0), 0) / latestMetrics.length;
      currentUp = latestMetrics.reduce((s, m) => s + (m.uploadMbps || 0), 0) / latestMetrics.length;
      currentPing = latestMetrics.reduce((s, m) => s + (m.pingMs || 0), 0) / latestMetrics.length;
    }
    const currentQuality = calcQuality(currentDown, currentPing);

    if (!rangeMetrics || rangeMetrics.length === 0) {
      return {
        ...empty,
        avgDownload: Math.round(currentDown * 10) / 10,
        avgUpload: Math.round(currentUp * 10) / 10,
        avgPing: Math.round(currentPing * 10) / 10,
        avgQuality: Math.round(currentQuality * 10) / 10,
        currentDownload: Math.round(currentDown * 10) / 10,
        currentUpload: Math.round(currentUp * 10) / 10,
        currentPing: Math.round(currentPing * 10) / 10,
        currentQuality: Math.round(currentQuality * 10) / 10,
      };
    }

    const avgDownload = rangeMetrics.reduce((s, m) => s + (m.downloadMbps || 0), 0) / rangeMetrics.length;
    const avgUpload = rangeMetrics.reduce((s, m) => s + (m.uploadMbps || 0), 0) / rangeMetrics.length;
    const avgPing = rangeMetrics.reduce((s, m) => s + (m.pingMs || 0), 0) / rangeMetrics.length;
    const avgQuality = rangeMetrics.reduce((s, m) => s + calcQuality(m.downloadMbps || 0, m.pingMs || 0), 0) / rangeMetrics.length;

    const peakDownload = Math.max(...rangeMetrics.map(m => m.downloadMbps || 0));
    const lowDownload = Math.min(...rangeMetrics.map(m => m.downloadMbps || 0));
    const peakUpload = Math.max(...rangeMetrics.map(m => m.uploadMbps || 0));
    const lowUpload = Math.min(...rangeMetrics.map(m => m.uploadMbps || 0));

    return {
      avgDownload: Math.round(avgDownload * 10) / 10,
      avgUpload: Math.round(avgUpload * 10) / 10,
      avgPing: Math.round(avgPing * 10) / 10,
      avgQuality: Math.round(avgQuality * 10) / 10,
      currentDownload: Math.round(currentDown * 10) / 10,
      currentUpload: Math.round(currentUp * 10) / 10,
      currentPing: Math.round(currentPing * 10) / 10,
      currentQuality: Math.round(currentQuality * 10) / 10,
      downloadChange: avgDownload > 0 ? (currentDown - avgDownload) / avgDownload * 100 : 0,
      uploadChange: avgUpload > 0 ? (currentUp - avgUpload) / avgUpload * 100 : 0,
      pingChange: avgPing > 0 ? (currentPing - avgPing) / avgPing * 100 : 0,
      qualityChange: Math.round((currentQuality - avgQuality) * 10) / 10,
      peakDownload: Math.round(peakDownload * 10) / 10,
      lowDownload: Math.round(lowDownload * 10) / 10,
      peakUpload: Math.round(peakUpload * 10) / 10,
      lowUpload: Math.round(lowUpload * 10) / 10,
    };
  };

  const m = getMainMetric();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Download</p>
              <p className="text-3xl font-bold text-success font-mono">
                {m.avgDownload.toFixed(1)}
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
              <span className="font-mono text-emerald-300">{m.peakDownload}</span>
              <span className="text-purple-300/50">Low</span>
              <span className="font-mono text-rose-400">{m.lowDownload}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center text-sm">
              <i className={`fas ${m.downloadChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-error'} mr-1`}></i>
              <span className={m.downloadChange >= 0 ? 'text-success' : 'text-error'}>
                {Math.abs(m.downloadChange).toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-purple-300/50">Current: <span className="font-mono text-white">{m.currentDownload}</span></span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Upload</p>
              <p className="text-3xl font-bold text-purple-400 font-mono">
                {m.avgUpload.toFixed(1)}
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
              <span className="font-mono text-emerald-300">{m.peakUpload}</span>
              <span className="text-purple-300/50">Low</span>
              <span className="font-mono text-rose-400">{m.lowUpload}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center text-sm">
              <i className={`fas ${m.uploadChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-error'} mr-1`}></i>
              <span className={m.uploadChange >= 0 ? 'text-success' : 'text-error'}>
                {Math.abs(m.uploadChange).toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-purple-300/50">Current: <span className="font-mono text-white">{m.currentUpload}</span></span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Ping</p>
              <p className="text-3xl font-bold text-info font-mono">
                {m.avgPing.toFixed(1)}
              </p>
              <p className="text-sm text-gray-400">ms</p>
            </div>
            <div className="h-12 w-12 bg-info/20 rounded-full flex items-center justify-center">
              <i className="fas fa-stopwatch text-info text-xl"></i>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-sm">
              <i className={`fas ${m.pingChange <= 0 ? 'fa-arrow-down text-success' : 'fa-arrow-up text-info'} mr-1`}></i>
              <span className={m.pingChange <= 0 ? 'text-success' : 'text-info'}>
                {Math.abs(m.pingChange).toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-purple-300/50">Current: <span className="font-mono text-white">{m.currentPing}</span></span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Quality</p>
              <p className="text-3xl font-bold text-success font-mono">
                {m.avgQuality.toFixed(1)}
              </p>
              <p className="text-sm text-gray-400">/ 100</p>
            </div>
            <div className="h-12 w-12 bg-success bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-star text-success text-xl"></i>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-sm">
              <i className={`fas ${m.qualityChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-error'} mr-1`}></i>
              <span className={m.qualityChange >= 0 ? 'text-success' : 'text-error'}>
                {m.qualityChange >= 0 ? '+' : ''}{m.qualityChange.toFixed(1)}
              </span>
              <span className="text-gray-400 ml-1">pts</span>
            </div>
            <span className="text-xs text-purple-300/50">Current: <span className="font-mono text-white">{m.currentQuality}</span></span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
