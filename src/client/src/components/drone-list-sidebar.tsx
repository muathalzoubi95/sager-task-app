import { useState } from "react";
import { Search, Check, X, Plane, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DroneData,
  DroneFilter,
  isDroneAllowed,
  formatFlightTime,
  formatAltitude,
} from "@/types/drone";

interface DroneListSidebarProps {
  drones: DroneData[];
  filter: DroneFilter;
  selectedDroneId: string | null;
  droneStats: {
    total: number;
    active: number;
    allowed: number;
    restricted: number;
  };
  onFilterChange: (filter: Partial<DroneFilter>) => void;
  onDroneSelected: (droneId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function DroneListSidebar({
  drones,
  filter,
  selectedDroneId,
  droneStats,
  onFilterChange,
  onDroneSelected,
  isOpen,
  onToggle,
}: DroneListSidebarProps) {
  const [searchValue, setSearchValue] = useState(filter.search);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onFilterChange({ search: value });
  };

  const handleFilterAllowed = () => {
    onFilterChange({
      showAllowed: true,
      showRestricted: false,
    });
  };

  const handleFilterRestricted = () => {
    onFilterChange({
      showAllowed: false,
      showRestricted: true,
    });
  };

  const handleShowAll = () => {
    onFilterChange({
      showAllowed: true,
      showRestricted: true,
    });
  };

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <Button
        className="md:hidden fixed top-3 left-3 z-50 shadow-lg"
        variant="secondary"
        size="sm"
        onClick={onToggle}
        data-testid="button-toggle-sidebar"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Sidebar */}
      <div
        className={`sidebar bg-card border-r border-border w-80 flex flex-col fixed md:relative h-full z-40 md:z-auto ${isOpen ? "open" : ""}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <img
                src="https://sagerdrone.com/frontend/img/sager_log.svg"
                alt="Logo"
                className="h-12 w-full mb-2"
              />
              <p className="text-sm text-muted-foreground">
                Drone Tracking System
              </p>
            </div>
            <div className="bg-primary/20 p-2 rounded-lg">
              <Plane className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="p-6 border-b border-border">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Total Drones
                  </p>
                  <p
                    className="text-xl font-bold text-foreground"
                    data-testid="text-total-drones"
                  >
                    {droneStats.total}
                  </p>
                </div>
                <Plane className="h-4 w-4 text-primary" />
              </div>
            </Card>
            <Card className="bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Active
                  </p>
                  <p
                    className="text-xl font-bold text-chart-2"
                    data-testid="text-active-drones"
                  >
                    {droneStats.allowed}
                  </p>
                </div>
                <Check className="h-4 w-4 text-chart-2" />
              </div>
            </Card>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-border">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Search by registration..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1"
                data-testid="input-search-drones"
              />
              <Button variant="default" size="sm" data-testid="button-search">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleShowAll}
                data-testid="button-filter-all"
              >
                All ({droneStats.total})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs hover:bg-chart-2/20 hover:text-chart-2"
                onClick={handleFilterAllowed}
                data-testid="button-filter-allowed"
              >
                <Check className="h-3 w-3 mr-1" />
                Allowed ({droneStats.allowed})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs hover:bg-destructive/20 hover:text-destructive"
                onClick={handleFilterRestricted}
                data-testid="button-filter-restricted"
              >
                <X className="h-3 w-3 mr-1" />
                Restricted ({droneStats.restricted})
              </Button>
            </div>
          </div>
        </div>

        {/* Drone List */}
        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Live Drones
            </h3>

            <ScrollArea className="h-full custom-scrollbar">
              <div className="space-y-2">
                {drones.length === 0 ? (
                  <div className="text-center py-8">
                    <Plane className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No drones found
                    </p>
                  </div>
                ) : (
                  drones.map((drone) => {
                    const isAllowed = isDroneAllowed(drone.registration);
                    const isSelected = selectedDroneId === drone.id;

                    return (
                      <Card
                        key={drone.id}
                        className={`
                          drone-list-item p-3 cursor-pointer border transition-colors
                          ${isSelected ? "selected border-primary bg-primary/5" : "hover:bg-muted/50"}
                        `}
                        onClick={() => onDroneSelected(drone.id)}
                        data-testid={`card-drone-${drone.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-full ${isAllowed ? "bg-chart-2/20" : "bg-destructive/20"}`}
                            >
                              <Plane
                                className={`h-3 w-3 ${isAllowed ? "text-chart-2" : "text-destructive"}`}
                              />
                            </div>
                            <div>
                              <p
                                className="font-medium text-foreground text-sm"
                                data-testid={`text-drone-registration-${drone.id}`}
                              >
                                {drone.registration}
                              </p>
                              <p
                                className="text-xs text-muted-foreground"
                                data-testid={`text-drone-flight-time-${drone.id}`}
                              >
                                Flight: {formatFlightTime(drone.flightTime)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-medium ${isAllowed ? "drone-allowed" : "drone-restricted"}`}
                            >
                              {isAllowed ? "ALLOWED" : "RESTRICTED"}
                            </p>
                            <p
                              className="text-xs text-muted-foreground"
                              data-testid={`text-drone-altitude-${drone.id}`}
                            >
                              Alt: {formatAltitude(drone.altitude)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onToggle}
          data-testid="overlay-sidebar"
        />
      )}
    </>
  );
}
