import { useState, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import { Sidebar } from "@/components/sidebar";
import { RealTimeMetrics } from "@/components/real-time-metrics";
import { ChartsSection } from "@/components/charts-section";
import { AlertsAndDevices } from "@/components/alerts-devices";
import { GeographicMap } from "@/components/geographic-map";
import { DataExport } from "@/components/data-export";
import { DeviceManagement } from "@/components/device-management";
import { AnalyticsSection } from "@/components/analytics-section";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSocket } from "@/hooks/use-websocket";
import { queryClient } from "@/lib/queryClient";
import { RefreshCw } from "lucide-react";

type ViewType = 'dashboard' | 'analytics' | 'alerts' | 'devices' | 'maps' | 'export';
export type Duration = '1h' | '6h' | '24h' | '7d';

export function durationToMs(duration: Duration): number {
  switch (duration) {
    case '1h': return 60 * 60 * 1000;
    case '6h': return 6 * 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
  }
}

export function durationToLabel(duration: Duration): string {
  switch (duration) {
    case '1h': return 'Last 1 Hour';
    case '6h': return 'Last 6 Hours';
    case '24h': return 'Last 24 Hours';
    case '7d': return 'Last 7 Days';
  }
}

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [duration, setDuration] = useState<Duration>('1h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  useWebSocket();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <>
            <RealTimeMetrics duration={duration} />
            <ChartsSection duration={duration} />
            <GeographicMap />
          </>
        );
      case 'analytics':
        return <AnalyticsSection />;
      case 'alerts':
        return <AlertsAndDevices />;
      case 'devices':
        return <DeviceManagement />;
      case 'maps':
        return <GeographicMap />;
      case 'export':
        return <DataExport />;
      default:
        return (
          <>
            <RealTimeMetrics duration={duration} />
            <ChartsSection duration={duration} />
          </>
        );
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Real-time Network Dashboard';
      case 'analytics': return 'Historical Analytics';
      case 'alerts': return 'Alert Management';
      case 'devices': return 'Device Management';
      case 'maps': return 'Geographic Network Map';
      case 'export': return 'Data Export';
      default: return 'Real-time Network Dashboard';
    }
  };

  const getViewDescription = () => {
    switch (activeView) {
      case 'dashboard': return 'Monitor network performance across all connected devices and locations';
      case 'analytics': return 'Analyze historical network performance trends and patterns';
      case 'alerts': return 'Manage network alerts and device monitoring notifications';
      case 'devices': return 'Configure and monitor network devices and their status';
      case 'maps': return 'Visualize network performance geographically across locations';
      case 'export': return 'Export network data and generate performance reports';
      default: return 'Monitor network performance across all connected devices and locations';
    }
  };

  return (
    <div className="bg-dark text-white font-sans dark min-h-screen">
      <Navigation activeView={activeView} setActiveView={setActiveView} />
      
      <div className="flex h-screen pt-16">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        
        <div className="lg:pl-64 flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                  <div className="sm:flex sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-white">{getViewTitle()}</h1>
                      <p className="mt-2 text-sm text-gray-400">{getViewDescription()}</p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-4 flex space-x-3">
                      <Select value={duration} onValueChange={(v) => setDuration(v as Duration)}>
                        <SelectTrigger className="bg-surface border-gray-600 text-white w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">Last 1 Hour</SelectItem>
                          <SelectItem value="6h">Last 6 Hours</SelectItem>
                          <SelectItem value="24h">Last 24 Hours</SelectItem>
                          <SelectItem value="7d">Last 7 Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        className="bg-primary hover:bg-violet-700"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>

                {renderActiveView()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
