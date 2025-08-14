import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { NetworkMetric } from "@shared/schema";

export function RealTimeMetrics() {
  const { data: latestMetrics } = useQuery<NetworkMetric[]>({
    queryKey: ["/api/metrics/latest"],
    refetchInterval: 5000, // Refresh every 5 seconds
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
      };
    }

    // Use the first metric or aggregate if multiple devices
    const metric = latestMetrics[0];
    
    // Calculate quality score based on download speed and ping
    const qualityScore = Math.min(100, Math.max(0, 
      ((metric.downloadMbps || 0) > 100 ? 100 : (metric.downloadMbps || 0)) * 0.6 +
      ((metric.pingMs || 0) < 50 ? 50 - (metric.pingMs || 0) : 0) * 0.4
    ));

    return {
      downloadSpeed: metric.downloadMbps || 0,
      uploadSpeed: metric.uploadMbps || 0,
      pingLatency: metric.pingMs || 0,
      qualityScore: Math.round(qualityScore * 10) / 10,
      downloadChange: metric.avgDownloadMbps ? 
        ((metric.downloadMbps || 0) - metric.avgDownloadMbps) / metric.avgDownloadMbps * 100 : 0,
      uploadChange: metric.avgUploadMbps ? 
        ((metric.uploadMbps || 0) - metric.avgUploadMbps) / metric.avgUploadMbps * 100 : 0,
      pingChange: metric.avgPingMs ? 
        ((metric.pingMs || 0) - metric.avgPingMs) / metric.avgPingMs * 100 : 0,
      qualityChange: 2.1,
    };
  };

  const metrics = getMainMetric();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Download Speed Card */}
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
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <i className={`fas ${metrics.downloadChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-error'} mr-1`}></i>
              <span className={metrics.downloadChange >= 0 ? 'text-success' : 'text-error'}>
                {Math.abs(metrics.downloadChange).toFixed(1)}%
              </span>
              <span className="text-gray-400 ml-1">from avg</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Speed Card */}
      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Upload Speed</p>
              <p className="text-3xl font-bold text-primary font-mono">
                {metrics.uploadSpeed.toFixed(1)}
              </p>
              <p className="text-sm text-gray-400">Mbps</p>
            </div>
            <div className="h-12 w-12 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-upload text-primary text-xl"></i>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <i className={`fas ${metrics.uploadChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-error'} mr-1`}></i>
              <span className={metrics.uploadChange >= 0 ? 'text-success' : 'text-error'}>
                {Math.abs(metrics.uploadChange).toFixed(1)}%
              </span>
              <span className="text-gray-400 ml-1">from avg</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ping/Latency Card */}
      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Ping Latency</p>
              <p className="text-3xl font-bold text-warning font-mono">
                {metrics.pingLatency.toFixed(1)}
              </p>
              <p className="text-sm text-gray-400">ms</p>
            </div>
            <div className="h-12 w-12 bg-warning bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-stopwatch text-warning text-xl"></i>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <i className={`fas ${metrics.pingChange <= 0 ? 'fa-arrow-down text-success' : 'fa-arrow-up text-warning'} mr-1`}></i>
              <span className={metrics.pingChange <= 0 ? 'text-success' : 'text-warning'}>
                {Math.abs(metrics.pingChange).toFixed(1)}%
              </span>
              <span className="text-gray-400 ml-1">from avg</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Quality Score Card */}
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
              <i className="fas fa-arrow-up text-success mr-1"></i>
              <span className="text-success">+{metrics.qualityChange.toFixed(1)}</span>
              <span className="text-gray-400 ml-1">points</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
