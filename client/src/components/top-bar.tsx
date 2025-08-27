import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function TopBar({ isConnected, lastUpdate }: TopBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-card border-b border-border p-4 flex items-center justify-between relative z-30">
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2">
          <div className="w-3 h-3 bg-chart-2 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live Tracking</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Last Update:
          <span
            className="text-foreground font-medium ml-1"
            data-testid="text-last-update"
          >
            {lastUpdate ? formatTime(lastUpdate) : "--:--:--"}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* WebSocket Status */}
        <Badge
          variant={isConnected ? "default" : "destructive"}
          className="flex items-center space-x-2"
          data-testid="badge-connection-status"
        >
          {isConnected ? (
            <>
              <div className="w-2 h-2 bg-chart-2 rounded-full animate-pulse"></div>
              <Wifi className="h-3 w-3" />
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
            </>
          )}
        </Badge>

        {/* Current Time */}
        <div className="hidden sm:block text-sm text-muted-foreground">
          <span
            className="text-foreground font-medium"
            data-testid="text-current-time"
          >
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
