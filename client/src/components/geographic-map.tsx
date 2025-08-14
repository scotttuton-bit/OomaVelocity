import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef } from "react";

export function GeographicMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const { data: devices } = useQuery<any[]>({
    queryKey: ["/api/devices"],
  });

  useEffect(() => {
    if (mapRef.current && typeof window !== 'undefined') {
      // Initialize Leaflet map when component mounts
      const initMap = async () => {
        try {
          // Dynamically import Leaflet to avoid SSR issues
          const L = (await import('leaflet')).default;
          
          if (!mapInstance.current && mapRef.current) {
            mapInstance.current = L.map(mapRef.current).setView([39.8283, -98.5795], 4); // Center of US
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstance.current);
          }

          // Clear existing markers (circle markers)
          mapInstance.current.eachLayer((layer: any) => {
            if (layer instanceof L.CircleMarker) {
              mapInstance.current.removeLayer(layer);
            }
          });

          // Add device markers
          if (devices) {
            devices.forEach((device: any) => {
              if (device.latitude && device.longitude) {
                const color = device.status === 'active' ? '#4CAF50' : 
                             device.status === 'inactive' ? '#FF9800' : '#F44336';
                
                const marker = L.circleMarker([device.latitude, device.longitude], {
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.6,
                  radius: 8
                }).addTo(mapInstance.current);

                marker.bindPopup(`
                  <div>
                    <strong>${device.name}</strong><br>
                    Location: ${device.location || 'Unknown'}<br>
                    Status: ${device.status}<br>
                    Type: ${device.deviceType || 'Unknown'}
                  </div>
                `);
              }
            });
          }
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      };

      initMap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [devices]);

  return (
    <Card className="bg-surface border-gray-700 mb-8">
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Geographic Network Heatmap</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success rounded-full mr-1"></div>
                <span className="text-gray-400">Active</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-warning rounded-full mr-1"></div>
                <span className="text-gray-400">Inactive</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-error rounded-full mr-1"></div>
                <span className="text-gray-400">Offline</span>
              </div>
            </div>
            <Select defaultValue="status">
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Device Status</SelectItem>
                <SelectItem value="download">Download Speed</SelectItem>
                <SelectItem value="upload">Upload Speed</SelectItem>
                <SelectItem value="ping">Ping Latency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          className="h-96 bg-gray-800 rounded-b-lg relative"
          style={{ minHeight: '384px' }}
        >
          {!devices && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <i className="fas fa-map text-4xl mb-4"></i>
                <p className="text-lg font-medium">Loading Network Map</p>
                <p className="text-sm mt-2">Fetching device locations...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
