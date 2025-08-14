import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log("WebSocket connected");
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case "metric_update":
                // Invalidate metrics queries to fetch fresh data
                queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
                queryClient.invalidateQueries({ queryKey: ["/api/metrics/latest"] });
                queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
                break;
                
              case "new_alert":
                // Invalidate alert queries
                queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
                break;
                
              default:
                console.log("Unknown WebSocket message type:", data.type);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        wsRef.current.onclose = () => {
          console.log("WebSocket disconnected");
          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Error creating WebSocket connection:", error);
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [queryClient]);

  return null;
}
