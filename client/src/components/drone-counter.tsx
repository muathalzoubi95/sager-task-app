import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DroneCounterProps {
  restrictedCount: number;
}

export function DroneCounter({ restrictedCount }: DroneCounterProps) {
  return (
    <Card className="fixed bottom-6 right-6 bg-red-500/90 text-destructive-foreground p-4 shadow-lg z-30">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-5 w-5" />
        <div>
          <div className="text-xs opacity-90">Restricted Drones</div>
          <div
            className="text-xl font-bold"
            data-testid="text-restricted-count"
          >
            {restrictedCount}
          </div>
        </div>
      </div>
    </Card>
  );
}
