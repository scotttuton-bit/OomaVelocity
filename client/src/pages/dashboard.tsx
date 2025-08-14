import { Navigation } from "@/components/navigation";
import { Sidebar } from "@/components/sidebar";
import { RealTimeMetrics } from "@/components/real-time-metrics";
import { ChartsSection } from "@/components/charts-section";
import { AlertsAndDevices } from "@/components/alerts-devices";
import { GeographicMap } from "@/components/geographic-map";
import { DataExport } from "@/components/data-export";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Dashboard() {
  useWebSocket(); // Initialize WebSocket connection for real-time updates

  return (
    <div className="bg-dark text-white font-sans dark min-h-screen">
      <Navigation />
      
      <div className="flex h-screen pt-16">
        <Sidebar />
        
        {/* Main Content */}
        <div className="lg:pl-64 flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="mb-8">
                  <div className="sm:flex sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-white">Real-time Network Dashboard</h1>
                      <p className="mt-2 text-sm text-gray-400">Monitor network performance across all connected devices and locations</p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-4 flex space-x-3">
                      <Select defaultValue="1h">
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
                      <Button className="bg-primary hover:bg-blue-700">
                        <i className="fas fa-sync-alt mr-2"></i>
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>

                <RealTimeMetrics />
                <ChartsSection />
                <AlertsAndDevices />
                <GeographicMap />
                <DataExport />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
