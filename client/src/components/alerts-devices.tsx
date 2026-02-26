import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export function AlertsAndDevices() {
  const queryClient = useQueryClient();

  const { data: alerts } = useQuery<any[]>({
    queryKey: ["/api/alerts?active=true"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: devices } = useQuery<any[]>({
    queryKey: ["/api/devices"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("PATCH", `/api/alerts/${alertId}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <i className="fas fa-exclamation-triangle text-error text-lg mt-1"></i>;
      case 'warning':
        return <i className="fas fa-clock text-warning text-lg mt-1"></i>;
      default:
        return <i className="fas fa-info-circle text-primary text-lg mt-1"></i>;
    }
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'inactive':
        return 'bg-warning';
      case 'offline':
        return 'bg-error';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Active Alerts */}
      <Card className="bg-surface border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Active Alerts</h3>
            <Badge variant="destructive" className="bg-error bg-opacity-20 text-error">
              {alerts?.length || 0} Active
            </Badge>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert: any) => (
                <div key={alert.id} className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-white">{alert.title}</p>
                      <p className="text-sm text-gray-400">{alert.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveAlertMutation.mutate(alert.id)}
                        disabled={resolveAlertMutation.isPending}
                        className="text-gray-400 hover:text-white"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-400">
                <i className="fas fa-check-circle text-2xl mb-2"></i>
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </CardContent>
        <div className="px-6 py-3 bg-gray-800 rounded-b-lg">
          <Button variant="link" className="text-sm text-primary hover:text-blue-400 font-medium p-0">
            View all alerts →
          </Button>
        </div>
      </Card>

      {/* Top Devices */}
      <Card className="bg-surface border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Device Performance</h3>
            <span className="text-sm text-gray-400">
              {devices?.length || 0} devices
            </span>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
            {devices && devices.length > 0 ? (
              devices.slice(0, 5).map((device: any) => (
                <div key={device.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 ${getDeviceStatusColor(device.status)} rounded-full`}></div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">{device.name}</p>
                        <p className="text-xs text-gray-400">{device.location || 'Unknown location'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {device.status === 'active' ? (
                        <>
                          <p className="text-sm font-mono text-success">Active</p>
                          <p className="text-xs text-gray-400">
                            {device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true }) : 'Never'}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-mono text-error capitalize">{device.status}</p>
                          <p className="text-xs text-gray-400">
                            {device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true }) : 'Never seen'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-400">
                <i className="fas fa-server text-2xl mb-2"></i>
                <p>No devices found</p>
              </div>
            )}
          </div>
        </CardContent>
        <div className="px-6 py-3 bg-gray-800 rounded-b-lg">
          <Button variant="link" className="text-sm text-primary hover:text-blue-400 font-medium p-0">
            Manage devices →
          </Button>
        </div>
      </Card>
    </div>
  );
}
