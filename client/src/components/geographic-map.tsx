import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import 'leaflet/dist/leaflet.css';

interface LocationGroup {
  location: string;
  latitude: number;
  longitude: number;
  total: number;
  active: number;
  inactive: number;
  offline: number;
  deviceTypes: Record<string, number>;
}

export function GeographicMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const { data: locations, isLoading } = useQuery<LocationGroup[]>({
    queryKey: ["/api/devices/locations"],
  });

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;

        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }

        mapInstance.current = L.map(mapRef.current!, {
          zoomControl: true,
          scrollWheelZoom: true,
        }).setView([39.0, -98.0], 4);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }).addTo(mapInstance.current);

        if (!locations || locations.length === 0) return;

        const maxDevices = Math.max(...locations.map(l => l.total));
        const minRadius = 12;
        const maxRadius = 45;

        locations.forEach((loc) => {
          const ratio = loc.total / maxDevices;
          const radius = minRadius + (maxRadius - minRadius) * Math.sqrt(ratio);

          const activeRatio = loc.active / loc.total;
          let fillColor: string;
          let borderColor: string;
          if (activeRatio >= 0.9) {
            fillColor = 'rgba(52, 211, 153, 0.3)';
            borderColor = '#34d399';
          } else if (activeRatio >= 0.5) {
            fillColor = 'rgba(250, 204, 21, 0.3)';
            borderColor = '#facc15';
          } else {
            fillColor = 'rgba(244, 63, 94, 0.3)';
            borderColor = '#f43f5e';
          }

          const circle = L.circleMarker([loc.latitude, loc.longitude], {
            radius: radius,
            color: borderColor,
            weight: 2,
            opacity: 0.9,
            fillColor: fillColor,
            fillOpacity: 1,
          }).addTo(mapInstance.current);

          const countLabel = L.divIcon({
            className: 'device-count-label',
            html: `<div style="
              color: white;
              font-weight: 700;
              font-size: ${radius > 25 ? '14px' : '11px'};
              font-family: ui-monospace, monospace;
              text-align: center;
              line-height: ${radius * 2}px;
              width: ${radius * 2}px;
              height: ${radius * 2}px;
              pointer-events: none;
            ">${loc.total}</div>`,
            iconSize: [radius * 2, radius * 2],
            iconAnchor: [radius, radius],
          });

          L.marker([loc.latitude, loc.longitude], { icon: countLabel, interactive: false })
            .addTo(mapInstance.current);

          const typeBreakdown = Object.entries(loc.deviceTypes)
            .map(([type, count]) => `<span style="color:#9ca3af">${type}:</span> ${count}`)
            .join('<br>');

          circle.bindPopup(`
            <div style="font-family: system-ui; min-width: 180px;">
              <div style="font-weight:700; font-size:14px; margin-bottom:8px; color:#e2e0f0;">${loc.location}</div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-bottom:8px;">
                <div style="background:rgba(52,211,153,0.12); padding:4px 8px; border-radius:6px; text-align:center; border:1px solid rgba(52,211,153,0.2);">
                  <div style="font-size:18px; font-weight:700; color:#34d399;">${loc.active}</div>
                  <div style="font-size:10px; color:#6ee7b7;">Active</div>
                </div>
                <div style="background:rgba(250,204,21,0.1); padding:4px 8px; border-radius:6px; text-align:center; border:1px solid rgba(250,204,21,0.2);">
                  <div style="font-size:18px; font-weight:700; color:#facc15;">${loc.inactive + loc.offline}</div>
                  <div style="font-size:10px; color:#fde68a;">Down</div>
                </div>
              </div>
              <div style="font-size:11px; border-top:1px solid rgba(139,92,246,0.2); padding-top:6px;">
                <div style="font-weight:600; margin-bottom:4px; color:#a78bfa;">Device Types</div>
                ${typeBreakdown}
              </div>
            </div>
          `, { className: 'device-popup' });
        });

        const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude] as [number, number]));
        mapInstance.current.fitBounds(bounds.pad(0.3));

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [locations]);

  const totalDevices = locations?.reduce((s, l) => s + l.total, 0) || 0;
  const totalActive = locations?.reduce((s, l) => s + l.active, 0) || 0;
  const totalLocations = locations?.length || 0;

  return (
    <Card className="bg-surface border-gray-700 mb-8">
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-medium text-white">Device Distribution Map</h3>
            <p className="text-xs text-gray-400 mt-1">
              Circle size proportional to device count at each location
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5 bg-purple-950/40 px-3 py-1.5 rounded-md border border-purple-500/10">
                <span className="text-purple-300/60">Locations</span>
                <span className="text-white font-bold">{totalLocations}</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-purple-950/40 px-3 py-1.5 rounded-md border border-purple-500/10">
                <span className="text-purple-300/60">Devices</span>
                <span className="text-white font-bold">{totalDevices}</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-purple-950/40 px-3 py-1.5 rounded-md border border-purple-500/10">
                <span className="text-purple-300/60">Active</span>
                <span className="text-emerald-400 font-bold">{totalActive}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1 border-2 border-emerald-400 bg-emerald-400/20"></div>
                <span className="text-purple-200/60">All up</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1 border-2 border-yellow-400 bg-yellow-400/20"></div>
                <span className="text-purple-200/60">Partial</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1 border-2 border-rose-400 bg-rose-400/20"></div>
                <span className="text-purple-200/60">Majority down</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-0">
        <div
          ref={mapRef}
          className="h-96 bg-gray-800 rounded-b-lg relative"
          style={{ minHeight: '420px' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-10">
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
