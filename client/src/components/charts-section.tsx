import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useMemo } from "react";
import { createSpeedChart, createLatencyChart } from "@/lib/chart-utils";
import type { NetworkMetric } from "@shared/schema";
import type { Duration } from "@/pages/dashboard";
import { durationToMs } from "@/pages/dashboard";

interface ChartsSectionProps {
  duration: Duration;
}

function buildTimeRangeUrl(duration: Duration): string {
  const now = Date.now();
  const from = new Date(now - durationToMs(duration)).toISOString();
  const to = new Date(now).toISOString();
  return `/api/metrics?from=${from}&to=${to}`;
}

export function ChartsSection({ duration }: ChartsSectionProps) {
  const speedChartRef = useRef<HTMLCanvasElement>(null);
  const latencyChartRef = useRef<HTMLCanvasElement>(null);
  const speedChartInstance = useRef<any>(null);
  const latencyChartInstance = useRef<any>(null);

  const { data: metrics, isLoading } = useQuery<NetworkMetric[]>({
    queryKey: ['/api/metrics', duration],
    queryFn: async () => {
      const res = await fetch(buildTimeRangeUrl(duration));
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  useEffect(() => {
    if (metrics && speedChartRef.current && latencyChartRef.current) {
      if (speedChartInstance.current) {
        speedChartInstance.current.destroy();
      }
      if (latencyChartInstance.current) {
        latencyChartInstance.current.destroy();
      }

      const initCharts = async () => {
        speedChartInstance.current = await createSpeedChart(speedChartRef.current!, metrics, duration);
        latencyChartInstance.current = await createLatencyChart(latencyChartRef.current!, metrics, duration);
      };
      initCharts();
    }

    return () => {
      if (speedChartInstance.current) {
        speedChartInstance.current.destroy();
        speedChartInstance.current = null;
      }
      if (latencyChartInstance.current) {
        latencyChartInstance.current.destroy();
        latencyChartInstance.current = null;
      }
    };
  }, [metrics, duration]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Speed Over Time</h3>
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded">
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></span>
                Download
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                Upload
              </span>
            </div>
          </div>
          <div className="h-64 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-10">
                <div className="text-gray-400">Loading chart data...</div>
              </div>
            )}
            <canvas ref={speedChartRef} className="w-full h-full"></canvas>
          </div>
          {metrics && (
            <div className="mt-3 text-xs text-gray-500">
              {metrics.length} data points
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-surface border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Ping & Jitter</h3>
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-sky-500/20 text-sky-400 rounded">
                <span className="w-2 h-2 bg-sky-400 rounded-full mr-1"></span>
                Ping
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-400 rounded">
                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-1"></span>
                Jitter
              </span>
            </div>
          </div>
          <div className="h-64 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-10">
                <div className="text-gray-400">Loading chart data...</div>
              </div>
            )}
            <canvas ref={latencyChartRef} className="w-full h-full"></canvas>
          </div>
          {metrics && (
            <div className="mt-3 text-xs text-gray-500">
              {metrics.length} data points
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
