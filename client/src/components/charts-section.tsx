import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import { createSpeedChart, createLatencyChart } from "@/lib/chart-utils";
import type { NetworkMetric } from "@shared/schema";

export function ChartsSection() {
  const speedChartRef = useRef<HTMLCanvasElement>(null);
  const latencyChartRef = useRef<HTMLCanvasElement>(null);
  const speedChartInstance = useRef<any>(null);
  const latencyChartInstance = useRef<any>(null);

  const { data: metrics } = useQuery<NetworkMetric[]>({
    queryKey: ["/api/metrics", { limit: 100 }],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (metrics && speedChartRef.current && latencyChartRef.current) {
      // Destroy existing charts
      if (speedChartInstance.current) {
        speedChartInstance.current.destroy();
      }
      if (latencyChartInstance.current) {
        latencyChartInstance.current.destroy();
      }

      // Create new charts
      speedChartInstance.current = createSpeedChart(speedChartRef.current, metrics);
      latencyChartInstance.current = createLatencyChart(latencyChartRef.current, metrics);
    }

    return () => {
      if (speedChartInstance.current) {
        speedChartInstance.current.destroy();
      }
      if (latencyChartInstance.current) {
        latencyChartInstance.current.destroy();
      }
    };
  }, [metrics]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Speed Chart */}
      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Speed Over Time</h3>
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-success bg-opacity-20 text-success rounded">
                <span className="w-2 h-2 bg-success rounded-full mr-1"></span>
                Download
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary bg-opacity-20 text-primary rounded">
                <span className="w-2 h-2 bg-primary rounded-full mr-1"></span>
                Upload
              </span>
            </div>
          </div>
          <div className="h-64">
            <canvas ref={speedChartRef} className="w-full h-full"></canvas>
          </div>
        </CardContent>
      </Card>

      {/* Latency Chart */}
      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Ping & Jitter</h3>
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-warning bg-opacity-20 text-warning rounded">
                <span className="w-2 h-2 bg-warning rounded-full mr-1"></span>
                Ping
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-error bg-opacity-20 text-error rounded">
                <span className="w-2 h-2 bg-error rounded-full mr-1"></span>
                Jitter
              </span>
            </div>
          </div>
          <div className="h-64">
            <canvas ref={latencyChartRef} className="w-full h-full"></canvas>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
