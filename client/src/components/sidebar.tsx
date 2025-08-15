import { useQuery } from "@tanstack/react-query";

type ViewType = 'dashboard' | 'analytics' | 'alerts' | 'devices' | 'maps' | 'export';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const { data: stats } = useQuery<{
    activeDevices: number;
    networkScore: number;
    activeAlerts: number;
    totalMetrics: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16 bg-surface border-r border-gray-700">
      <div className="flex-1 flex flex-col min-h-0 pt-5 pb-4 overflow-y-auto">
        <div className="flex-1 px-3 space-y-1">
          {/* Quick Stats */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Quick Overview</h3>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Active Devices</span>
                <span className="text-sm font-mono text-success">
                  {stats?.activeDevices ?? '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Network Score</span>
                <span className="text-sm font-mono text-success">
                  {stats?.networkScore ?? '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Active Alerts</span>
                <span className="text-sm font-mono text-warning">
                  {stats?.activeAlerts ?? '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Navigation</h3>
            <nav className="mt-3 space-y-1">
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  activeView === 'dashboard' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <i className="fas fa-tachometer-alt mr-3"></i>
                Real-time Dashboard
              </button>
              <button 
                onClick={() => setActiveView('analytics')}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  activeView === 'analytics' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <i className="fas fa-chart-line mr-3"></i>
                Historical Analytics
              </button>
              <button 
                onClick={() => setActiveView('alerts')}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  activeView === 'alerts' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <i className="fas fa-exclamation-triangle mr-3"></i>
                Alert Management
              </button>
              <button 
                onClick={() => setActiveView('devices')}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  activeView === 'devices' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <i className="fas fa-server mr-3"></i>
                Device Management
              </button>
              <button 
                onClick={() => setActiveView('maps')}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  activeView === 'maps' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <i className="fas fa-globe-americas mr-3"></i>
                Geographic Map
              </button>
              <button 
                onClick={() => setActiveView('export')}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  activeView === 'export' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <i className="fas fa-download mr-3"></i>
                Export Data
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
