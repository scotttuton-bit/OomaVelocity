import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartsSection } from "@/components/charts-section";
import type { NetworkMetric } from "@shared/schema";

export function AnalyticsSection() {
  const { data: metrics, isLoading } = useQuery<NetworkMetric[]>({
    queryKey: ["/api/metrics", { limit: 100 }],
    refetchInterval: 30000,
  });

  const calculateStats = () => {
    if (!metrics || metrics.length === 0) return null;

    const avgDownload = metrics.reduce((sum, m) => sum + (m.downloadMbps || 0), 0) / metrics.length;
    const avgUpload = metrics.reduce((sum, m) => sum + (m.uploadMbps || 0), 0) / metrics.length;
    const avgPing = metrics.reduce((sum, m) => sum + (m.pingMs || 0), 0) / metrics.length;

    const maxDownload = Math.max(...metrics.map(m => m.downloadMbps || 0));
    const minDownload = Math.min(...metrics.map(m => m.downloadMbps || 0));

    return {
      avgDownload: avgDownload.toFixed(1),
      avgUpload: avgUpload.toFixed(1),
      avgPing: avgPing.toFixed(1),
      maxDownload: maxDownload.toFixed(1),
      minDownload: minDownload.toFixed(1),
      totalTests: metrics.length
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-800 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-800 h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Controls */}
      <Card className="bg-surface border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-sliders-h mr-2 text-primary"></i>
            Analytics Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-sm text-gray-400 mb-2">Time Range</label>
              <Select defaultValue="24h">
                <SelectTrigger className="bg-dark border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last 1 Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-48">
              <label className="block text-sm text-gray-400 mb-2">Device Filter</label>
              <Select defaultValue="all">
                <SelectTrigger className="bg-dark border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="routers">Routers Only</SelectItem>
                  <SelectItem value="pi">Pi Devices Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="bg-primary hover:bg-blue-700">
              <i className="fas fa-filter mr-2"></i>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-surface border-gray-600">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.avgDownload}</div>
              <div className="text-sm text-gray-400">Avg Download (Mbps)</div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface border-gray-600">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.avgUpload}</div>
              <div className="text-sm text-gray-400">Avg Upload (Mbps)</div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface border-gray-600">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.avgPing}</div>
              <div className="text-sm text-gray-400">Avg Ping (ms)</div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface border-gray-600">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{stats.maxDownload}</div>
              <div className="text-sm text-gray-400">Peak Download</div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface border-gray-600">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{stats.minDownload}</div>
              <div className="text-sm text-gray-400">Min Download</div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface border-gray-600">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalTests}</div>
              <div className="text-sm text-gray-400">Total Tests</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <ChartsSection />
    </div>
  );
}