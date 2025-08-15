import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function DeviceManagement() {
  const { data: devices, isLoading } = useQuery<any[]>({
    queryKey: ["/api/devices"],
    refetchInterval: 30000,
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-800 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-800 h-32 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices?.map((device, index) => (
          <Card key={device.id} className="bg-surface border-gray-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center">
                  <i className={`${device.deviceType === 'router' ? 'fas fa-wifi' : 'fas fa-microchip'} mr-2 text-primary`}></i>
                  {device.name}
                </CardTitle>
                <Badge className={`${getStatusBadgeColor(device.status)} text-white`}>
                  {device.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-white">{device.location}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">IP Address:</span>
                  <span className="text-white font-mono">{device.ipAddress}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{device.deviceType}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last Seen:</span>
                  <span className="text-white">
                    {new Date(device.lastSeen).toLocaleString()}
                  </span>
                </div>
                
                <Separator className="bg-gray-600" />
                
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:text-white">
                    <i className="fas fa-cog mr-2"></i>
                    Configure
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:text-white">
                    <i className="fas fa-chart-line mr-2"></i>
                    View Stats
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="bg-surface border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Add New Device</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="bg-primary hover:bg-blue-700">
            <i className="fas fa-plus mr-2"></i>
            Register New Device
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}