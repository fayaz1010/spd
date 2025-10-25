
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Map as MapIcon, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Map component with Google Maps
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from "@vis.gl/react-google-maps";

interface Team {
  id: string;
  name: string;
  color: string;
  serviceAreaGeoJSON: any;
  serviceSuburbs: string[];
}

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  latitude: number;
  longitude: number;
  suburb: string | null;
  scheduledDate: string | null;
  systemSize: number;
  teamId: string | null;
  teamName: string | null;
  teamColor: string | null;
  subcontractorId: string | null;
  subcontractorName: string | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
}

interface MapData {
  teams: Team[];
  jobs: Job[];
}

// Status color mapping
const statusColors: Record<string, string> = {
  PENDING_SCHEDULE: "#eab308", // yellow
  SCHEDULED: "#3b82f6", // blue
  PENDING_SUB_CONFIRM: "#f97316", // orange
  SUB_CONFIRMED: "#8b5cf6", // purple
  MATERIALS_ORDERED: "#06b6d4", // cyan
  MATERIALS_READY: "#10b981", // green
  IN_PROGRESS: "#14b8a6", // teal
  COMPLETED: "#22c55e", // green
  CANCELLED: "#6b7280", // gray
};

const statusLabels: Record<string, string> = {
  PENDING_SCHEDULE: "Pending Schedule",
  SCHEDULED: "Scheduled",
  PENDING_SUB_CONFIRM: "Pending Sub Confirmation",
  SUB_CONFIRMED: "Sub Confirmed",
  MATERIALS_ORDERED: "Materials Ordered",
  MATERIALS_READY: "Materials Ready",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function OperationsMapPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "PENDING_SCHEDULE",
    "SCHEDULED",
    "IN_PROGRESS",
  ]);
  const [showFilters, setShowFilters] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

  useEffect(() => {
    console.log("OperationsMap: Component mounted, fetching data...");
    fetchMapData();
  }, [selectedTeams, selectedStatuses]);

  useEffect(() => {
    console.log("OperationsMap: Current state -", {
      jobsCount: mapData?.jobs.length || 0,
      teamsCount: mapData?.teams.length || 0,
      loading,
      apiKey: apiKey ? "Present" : "Missing"
    });
  }, [mapData, loading, apiKey]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      
      const params = new URLSearchParams();
      if (selectedTeams.length > 0) {
        params.append("teamIds", selectedTeams.join(","));
      }
      if (selectedStatuses.length > 0) {
        params.append("statuses", selectedStatuses.join(","));
      }

      const response = await fetch(`/api/admin/operations-map/data?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const validJobs = (data.jobs || []).filter((job: Job) => 
          job.latitude != null && job.longitude != null
        );
        console.log("Operations map data received:", data.jobs?.length || 0, "total,", validJobs.length, "with valid coordinates");
        if (validJobs.length > 0) {
          console.log("Sample job coordinates:", {
            lat: validJobs[0].latitude,
            lng: validJobs[0].longitude,
            jobNumber: validJobs[0].jobNumber
          });
        }
        setMapData({ ...data, jobs: validJobs });
      } else {
        console.error("Failed to fetch operations map data:", response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Error fetching map data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamFilter = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  if (!apiKey) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Operations Map</CardTitle>
            <CardDescription>Google Maps API key is not configured</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please add NEXT_PUBLIC_GOOGLE_API_KEY to your environment variables.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapIcon className="h-6 w-6" />
              Operations Map
            </h1>
            <p className="text-sm text-muted-foreground">
              {mapData?.jobs.length || 0} jobs • {mapData?.teams.length || 0} teams
            </p>
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 border-r bg-background p-4 overflow-y-auto">
            {/* Team Filters */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Teams</h3>
              <div className="space-y-2">
                {mapData?.teams.map((team) => (
                  <div key={team.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`team-${team.id}`}
                      checked={
                        selectedTeams.length === 0 || selectedTeams.includes(team.id)
                      }
                      onCheckedChange={() => toggleTeamFilter(team.id)}
                    />
                    <Label
                      htmlFor={`team-${team.id}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: team.color }}
                      />
                      {team.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Filters */}
            <div>
              <h3 className="font-semibold mb-3">Status</h3>
              <div className="space-y-2">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <div key={status} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => toggleStatusFilter(status)}
                    />
                    <Label
                      htmlFor={`status-${status}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: statusColors[status] }}
                      />
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <APIProvider apiKey={apiKey} onLoad={() => console.log("Google Maps API loaded (Operations)")}>
            <Map
              defaultCenter={{ lat: -31.9505, lng: 115.8605 }} // Greater Perth, Western Australia
              defaultZoom={10}
              mapId="5c0f37b3c536eba5c0274781"
              className="w-full h-full"
              gestureHandling="greedy"
              onCameraChanged={(ev) => console.log("Camera changed:", ev.detail.center)}
            >
              {/* Render team zones - TODO: Implement with Google Maps Polygon or custom overlay */}
              {/* Note: Polygon rendering requires additional Google Maps library setup */}

              {/* Render job markers */}
              {(() => { if (mapData?.jobs.length) console.log("Rendering", mapData.jobs.length, "job markers"); return null; })()}
              {mapData?.jobs.map((job) => {
                const color = statusColors[job.status] || "#6b7280";
                return (
                  <AdvancedMarker
                    key={job.id}
                    position={{ lat: job.latitude, lng: job.longitude }}
                    onClick={() => setSelectedJob(job)}
                  >
                    <Pin
                      background={color}
                      borderColor={color}
                      glyphColor="#ffffff"
                    />
                  </AdvancedMarker>
                );
              })}

              {/* Info Window */}
              {selectedJob && (
                <InfoWindow
                  position={{
                    lat: selectedJob.latitude,
                    lng: selectedJob.longitude,
                  }}
                  onCloseClick={() => setSelectedJob(null)}
                >
                  <div className="p-2 min-w-[250px]">
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedJob.jobNumber}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Customer:</strong> {selectedJob.customer.name}
                      </p>
                      <p>
                        <strong>System:</strong> {selectedJob.systemSize}kW
                      </p>
                      {selectedJob.teamName && (
                        <p>
                          <strong>Team:</strong> {selectedJob.teamName}
                        </p>
                      )}
                      {selectedJob.subcontractorName && (
                        <p>
                          <strong>Subcontractor:</strong>{" "}
                          {selectedJob.subcontractorName}
                        </p>
                      )}
                      {selectedJob.scheduledDate && (
                        <p>
                          <strong>Scheduled:</strong>{" "}
                          {new Date(selectedJob.scheduledDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="pt-2">
                        <Badge
                          style={{
                            backgroundColor: statusColors[selectedJob.status],
                            color: "#ffffff",
                          }}
                        >
                          {statusLabels[selectedJob.status]}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => {
                        window.location.href = `/admin/jobs/${selectedJob.id}`;
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>

          {/* No Data Message */}
          {(!mapData?.jobs.length && !loading) && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border rounded-lg p-6 shadow-lg text-center">
              <MapIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No Jobs Found</h3>
              <p className="text-sm text-muted-foreground">
                No jobs with location data match the selected filters.
              </p>
            </div>
          )}

          {/* Legend */}
          {(mapData?.jobs.length ?? 0) > 0 && (
          <div className="absolute bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg">
            <h3 className="font-semibold mb-2 text-sm">Legend</h3>
            <div className="space-y-1 text-xs">
              {Object.entries(statusLabels)
                .filter(([status]) => selectedStatuses.includes(status))
                .map(([status, label]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusColors[status] }}
                    />
                    <span>{label}</span>
                  </div>
                ))}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
