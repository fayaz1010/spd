"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Map as MapIcon, Filter, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from "@vis.gl/react-google-maps";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  suburb: string | null;
  latitude: number;
  longitude: number;
  status: string;
  systemSizeKw: number;
  numPanels: number;
  batterySizeKwh: number;
  quarterlyBill: number | null;
  quoteReference: string;
  depositPaid: boolean;
  depositAmount: number | null;
  createdAt: string;
  quote: any;
  job: any;
}

// Lead status color mapping
const leadStatusColors: Record<string, string> = {
  new: "#6366f1", // indigo - potential lead
  quoted: "#3b82f6", // blue - quote sent
  deposit_paid: "#f59e0b", // amber - deposit received
  confirmed: "#10b981", // green - confirmed/scheduled
  completed: "#22c55e", // bright green - completed
  cancelled: "#6b7280", // gray - cancelled
  lost: "#ef4444", // red - lost opportunity
};

const leadStatusLabels: Record<string, string> = {
  new: "Potential Lead",
  quoted: "Quoted",
  deposit_paid: "Deposit Paid",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  lost: "Lost",
};

export default function LeadsMapPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "new",
    "quoted",
    "deposit_paid",
    "confirmed",
  ]);
  const [showFilters, setShowFilters] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

  useEffect(() => {
    console.log("LeadsMap: Component mounted, fetching leads...");
    fetchLeads();
  }, [selectedStatuses]);

  useEffect(() => {
    console.log("LeadsMap: Current state -", {
      leadsCount: leads.length,
      loading,
      apiKey: apiKey ? "Present" : "Missing",
      selectedStatuses
    });
  }, [leads, loading, apiKey, selectedStatuses]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      const params = new URLSearchParams();
      if (selectedStatuses.length > 0) {
        params.append("statuses", selectedStatuses.join(","));
      }

      const response = await fetch(`/api/admin/leads-map?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const validLeads = (data.leads || []).filter((lead: Lead) => 
          lead.latitude != null && lead.longitude != null
        );
        console.log("Leads data received:", data.leads?.length || 0, "total,", validLeads.length, "with valid coordinates");
        if (validLeads.length > 0) {
          console.log("Sample lead coordinates:", {
            lat: validLeads[0].latitude,
            lng: validLeads[0].longitude,
            name: validLeads[0].name
          });
        }
        setLeads(validLeads);
      } else {
        console.error("Failed to fetch leads:", response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
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
            <CardTitle>Leads Map</CardTitle>
            <CardDescription>Google Maps API key is not configured</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please add NEXT_PUBLIC_GOOGLE_API_KEY to your .env.local file.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Get your API key from: https://console.cloud.google.com/google/maps-apis
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

  // Calculate map center based on leads
  const mapCenter = leads.length > 0
    ? {
        lat: leads.reduce((sum, lead) => sum + lead.latitude, 0) / leads.length,
        lng: leads.reduce((sum, lead) => sum + lead.longitude, 0) / leads.length,
      }
    : { lat: -31.9505, lng: 115.8605 }; // Default to Greater Perth, Western Australia

  // Calculate appropriate zoom level based on lead spread
  const calculateZoom = () => {
    if (leads.length === 0) return 10; // Zoom level 10 for Greater Perth area
    
    const lats = leads.map(l => l.latitude);
    const lngs = leads.map(l => l.longitude);
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    
    if (maxSpread > 10) return 6;
    if (maxSpread > 5) return 7;
    if (maxSpread > 2) return 8;
    if (maxSpread > 1) return 9;
    if (maxSpread > 0.5) return 10;
    if (maxSpread > 0.2) return 11;
    return 12;
  };

  const mapZoom = calculateZoom();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MapIcon className="h-6 w-6" />
                Leads Map
              </h1>
              <p className="text-sm text-muted-foreground">
                {leads.length} leads with locations
              </p>
            </div>
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
            {/* Status Filters */}
            <div>
              <h3 className="font-semibold mb-3">Lead Status</h3>
              <div className="space-y-2">
                {Object.entries(leadStatusLabels).map(([status, label]) => (
                  <div key={status} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => toggleStatusFilter(status)}
                    />
                    <Label
                      htmlFor={`status-${status}`}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: leadStatusColors[status] }}
                      />
                      <span className="flex-1">{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {leads.filter((l) => l.status === status).length}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Leads:</span>
                  <span className="font-medium">{leads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With Quotes:</span>
                  <span className="font-medium">
                    {leads.filter((l) => l.quote).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With Jobs:</span>
                  <span className="font-medium">
                    {leads.filter((l) => l.job).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposits Paid:</span>
                  <span className="font-medium">
                    {leads.filter((l) => l.depositPaid).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <APIProvider apiKey={apiKey} onLoad={() => console.log("Google Maps API loaded")}>
            <Map
              key={`map-${leads.length}`}
              defaultCenter={mapCenter}
              defaultZoom={mapZoom}
              mapId="5c0f37b3c536eba5c0274781"
              className="w-full h-full"
              gestureHandling="greedy"
              onCameraChanged={(ev) => console.log("Camera changed:", ev.detail.center)}
            >
              {/* Render lead markers */}
              {(() => { 
                if (leads.length > 0) {
                  console.log("Rendering", leads.length, "lead markers");
                  console.log("Map center:", mapCenter);
                  console.log("Map zoom:", mapZoom);
                  console.log("First 3 marker positions:", leads.slice(0, 3).map(l => ({ 
                    id: l.id, 
                    lat: l.latitude, 
                    lng: l.longitude,
                    status: l.status 
                  })));
                }
                return null; 
              })()}
              {leads.map((lead, index) => {
                const color = leadStatusColors[lead.status] || "#6b7280";
                const position = { lat: lead.latitude, lng: lead.longitude };
                
                if (index === 0) {
                  console.log("Creating first marker:", { position, color, leadId: lead.id });
                }
                
                return (
                  <AdvancedMarker
                    key={lead.id}
                    position={position}
                    onClick={() => {
                      console.log("Marker clicked:", lead.name);
                      setSelectedLead(lead);
                    }}
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
              {selectedLead && (
                <InfoWindow
                  position={{
                    lat: selectedLead.latitude,
                    lng: selectedLead.longitude,
                  }}
                  onCloseClick={() => setSelectedLead(null)}
                >
                  <div className="p-2 min-w-[280px]">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{selectedLead.name}</h3>
                      <Badge
                        style={{
                          backgroundColor: leadStatusColors[selectedLead.status],
                          color: "#ffffff",
                        }}
                      >
                        {leadStatusLabels[selectedLead.status]}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Email:</strong> {selectedLead.email}
                      </p>
                      {selectedLead.phone && (
                        <p>
                          <strong>Phone:</strong> {selectedLead.phone}
                        </p>
                      )}
                      <p>
                        <strong>Address:</strong> {selectedLead.address}
                      </p>
                      <p>
                        <strong>System:</strong> {selectedLead.systemSizeKw}kW ({selectedLead.numPanels} panels)
                      </p>
                      {selectedLead.batterySizeKwh > 0 && (
                        <p>
                          <strong>Battery:</strong> {selectedLead.batterySizeKwh}kWh
                        </p>
                      )}
                      {selectedLead.quarterlyBill && (
                        <p>
                          <strong>Quarterly Bill:</strong> ${selectedLead.quarterlyBill}
                        </p>
                      )}
                      
                      {selectedLead.quote && (
                        <div className="pt-2 border-t mt-2">
                          <p className="text-xs text-muted-foreground">Quote Status: {selectedLead.quote.status}</p>
                          {selectedLead.quote.totalCostAfterRebates && (
                            <p className="text-xs">
                              <strong>Total:</strong> ${selectedLead.quote.totalCostAfterRebates.toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {selectedLead.job && (
                        <div className="pt-2 border-t mt-2">
                          <p className="text-xs">
                            <strong>Job:</strong> {selectedLead.job.jobNumber}
                          </p>
                          {selectedLead.job.team && (
                            <p className="text-xs">
                              <strong>Team:</strong> {selectedLead.job.team.name}
                            </p>
                          )}
                          {selectedLead.job.scheduledDate && (
                            <p className="text-xs">
                              <strong>Scheduled:</strong>{" "}
                              {new Date(selectedLead.job.scheduledDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {selectedLead.depositPaid && selectedLead.depositAmount && (
                        <div className="pt-2 border-t mt-2">
                          <p className="text-xs text-green-600 font-medium">
                            ✓ Deposit Paid: ${selectedLead.depositAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          window.location.href = `/admin/dashboard/leads?id=${selectedLead.id}`;
                        }}
                      >
                        View Lead
                      </Button>
                      {selectedLead.job && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            window.location.href = `/admin/jobs/${selectedLead.job.id}`;
                          }}
                        >
                          View Job
                        </Button>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>

          {/* No Data Message */}
          {leads.length === 0 && !loading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border rounded-lg p-6 shadow-lg text-center">
              <MapIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No Leads Found</h3>
              <p className="text-sm text-muted-foreground">
                No leads with location data match the selected filters.
              </p>
            </div>
          )}

          {/* Legend */}
          {leads.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg max-w-xs">
            <h3 className="font-semibold mb-2 text-sm">Legend</h3>
            <div className="space-y-1 text-xs">
              {Object.entries(leadStatusLabels)
                .filter(([status]) => selectedStatuses.includes(status))
                .map(([status, label]) => {
                  const count = leads.filter((l) => l.status === status).length;
                  return (
                    <div key={status} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: leadStatusColors[status] }}
                        />
                        <span>{label}</span>
                      </div>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
