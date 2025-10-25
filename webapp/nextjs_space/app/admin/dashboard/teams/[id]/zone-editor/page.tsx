
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Trash2, MapPin, Info, Search, Plus, X, Pencil } from 'lucide-react';
import Link from 'next/link';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface Team {
  id: string;
  name: string;
  color: string;
  serviceAreaGeoJSON: {
    type: string;
    coordinates: number[][][];
  } | null;
}

interface PostcodeData {
  postcode: string;
  locality: string;
  formatted_address: string;
  center: { lat: number; lng: number };
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  polygon: {
    type: string;
    coordinates: number[][][];
  };
}

function ZoneEditorMap({ 
  team, 
  onSave, 
  mode,
  selectedPostcodes,
  onPostcodePolygonsChange 
}: { 
  team: Team; 
  onSave: (geoJSON: any) => void;
  mode: 'draw' | 'postcode';
  selectedPostcodes: PostcodeData[];
  onPostcodePolygonsChange: (polygons: google.maps.Polygon[]) => void;
}) {
  const map = useMap();
  const drawing = useMapsLibrary('drawing');
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<google.maps.Polygon | null>(null);
  const [postcodePolygons, setPostcodePolygons] = useState<google.maps.Polygon[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize drawing manager (only for draw mode)
  useEffect(() => {
    if (!map || !drawing || mode !== 'draw') return;

    const manager = new drawing.DrawingManager({
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: team.color,
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: team.color,
        editable: true,
        draggable: true,
      },
    });

    manager.setMap(map);
    setDrawingManager(manager);

    // Listen for polygon complete
    google.maps.event.addListener(manager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      // Remove previous polygon if exists
      if (currentPolygon) {
        currentPolygon.setMap(null);
      }
      
      setCurrentPolygon(polygon);
      setHasChanges(true);
      manager.setDrawingMode(null);

      // Listen for edits
      google.maps.event.addListener(polygon.getPath(), 'set_at', () => setHasChanges(true));
      google.maps.event.addListener(polygon.getPath(), 'insert_at', () => setHasChanges(true));
      google.maps.event.addListener(polygon.getPath(), 'remove_at', () => setHasChanges(true));
    });

    return () => {
      manager.setMap(null);
    };
  }, [map, drawing, team.color, currentPolygon, mode]);

  // Handle postcode polygons
  useEffect(() => {
    if (!map || mode !== 'postcode') return;

    // Clear existing postcode polygons
    postcodePolygons.forEach(p => p.setMap(null));

    // Create new polygons for selected postcodes
    const newPolygons = selectedPostcodes.map(postcodeData => {
      const coordinates = postcodeData.polygon.coordinates[0];
      const paths = coordinates.map(([lng, lat]) => ({ lat, lng }));

      return new google.maps.Polygon({
        paths,
        fillColor: team.color,
        fillOpacity: 0.2,
        strokeWeight: 2,
        strokeColor: team.color,
        strokeOpacity: 0.8,
        map,
      });
    });

    setPostcodePolygons(newPolygons);
    onPostcodePolygonsChange(newPolygons);

    // Fit map to show all postcodes
    if (newPolygons.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      selectedPostcodes.forEach(pc => {
        bounds.extend(pc.bounds.northeast);
        bounds.extend(pc.bounds.southwest);
      });
      map.fitBounds(bounds);
    }

    return () => {
      newPolygons.forEach(p => p.setMap(null));
    };
  }, [map, selectedPostcodes, team.color, mode]);

  // Load existing polygon (only in draw mode)
  useEffect(() => {
    if (!map || currentPolygon || !team.serviceAreaGeoJSON || mode !== 'draw') return;

    const coordinates = team.serviceAreaGeoJSON.coordinates[0];
    const paths = coordinates.map(([lng, lat]) => ({ lat, lng }));

    const polygon = new google.maps.Polygon({
      paths,
      fillColor: team.color,
      fillOpacity: 0.3,
      strokeWeight: 2,
      strokeColor: team.color,
      editable: true,
      draggable: true,
      map,
    });

    setCurrentPolygon(polygon);

    // Listen for edits
    google.maps.event.addListener(polygon.getPath(), 'set_at', () => setHasChanges(true));
    google.maps.event.addListener(polygon.getPath(), 'insert_at', () => setHasChanges(true));
    google.maps.event.addListener(polygon.getPath(), 'remove_at', () => setHasChanges(true));
  }, [map, team.serviceAreaGeoJSON, team.color, currentPolygon, mode]);

  const handleSave = () => {
    if (mode === 'draw') {
      if (!currentPolygon) {
        alert('No zone to save. Please draw a zone first.');
        return;
      }

      const path = currentPolygon.getPath();
      const coordinates: number[][] = [];

      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push([point.lng(), point.lat()]);
      }

      // Close the polygon by adding the first point at the end
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]);
      }

      const geoJSON = {
        type: 'Polygon',
        coordinates: [coordinates],
      };

      onSave(geoJSON);
      setHasChanges(false);
    } else if (mode === 'postcode') {
      if (selectedPostcodes.length === 0) {
        alert('No postcodes selected. Please add postcodes first.');
        return;
      }

      // Merge all postcode polygons into one
      const allPolygons = selectedPostcodes.map(pc => pc.polygon);
      
      // Find the bounding box that contains all polygons
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;

      allPolygons.forEach(polygon => {
        const coords = polygon.coordinates[0];
        coords.forEach((coord: number[]) => {
          const [lng, lat] = coord;
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        });
      });

      // Create a merged polygon from the bounding box
      const mergedCoordinates = [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ];

      const geoJSON = {
        type: 'Polygon',
        coordinates: [mergedCoordinates],
      };

      onSave(geoJSON);
      setHasChanges(false);
    }
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this zone?')) return;

    if (currentPolygon) {
      currentPolygon.setMap(null);
      setCurrentPolygon(null);
    }

    onSave(null);
    setHasChanges(false);
  };

  const handleClear = () => {
    if (!confirm('Clear the current zone? (This won\'t delete the saved zone)')) return;

    if (currentPolygon) {
      currentPolygon.setMap(null);
      setCurrentPolygon(null);
    }
    setHasChanges(false);
  };

  return (
    <div className="relative h-full">
      <Map
        defaultCenter={{ lat: -31.9505, lng: 115.8605 }} // Perth coordinates
        defaultZoom={10}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="team-zone-editor"
      />
      
      {/* Control Panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-4 flex gap-3 items-center">
        <div className="flex items-center gap-2 pr-3 border-r border-gray-300">
          <div 
            className="h-4 w-4 rounded"
            style={{ backgroundColor: team.color }}
          />
          <span className="text-sm font-medium text-gray-700">{team.name}</span>
        </div>

        {mode === 'draw' ? (
          <>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Zone
            </Button>

            {currentPolygon && (
              <>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Zone
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="text-sm text-gray-600">
              {selectedPostcodes.length} postcode{selectedPostcodes.length !== 1 ? 's' : ''} selected
            </div>
            <Button
              onClick={handleSave}
              disabled={selectedPostcodes.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Zone
            </Button>
            {selectedPostcodes.length > 0 && (
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Zone
              </Button>
            )}
          </>
        )}
      </div>

      {/* Instructions */}
      {mode === 'draw' && (
        <div className="absolute top-6 left-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Draw Zone</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click the polygon tool above the map</li>
                <li>• Click on the map to draw points</li>
                <li>• Click the first point again to close</li>
                <li>• Drag points or edges to edit</li>
                <li>• Click "Save Zone" when done</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ZoneEditorPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'draw' | 'postcode'>('draw');
  
  // Postcode search state
  const [postcodeSearch, setPostcodeSearch] = useState('');
  const [searchingPostcode, setSearchingPostcode] = useState(false);
  const [selectedPostcodes, setSelectedPostcodes] = useState<PostcodeData[]>([]);
  const [postcodePolygons, setPostcodePolygons] = useState<google.maps.Polygon[]>([]);

  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch(`/api/admin/teams/${teamId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team');
      }

      const data = await response.json();
      setTeam(data.team);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPostcode = async () => {
    if (!postcodeSearch.trim()) return;

    setSearchingPostcode(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch(
        `/api/admin/postcodes/search?postcode=${encodeURIComponent(postcodeSearch.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to search postcode');
      }

      const postcodeData = await response.json();

      // Check if already added
      if (selectedPostcodes.some(pc => pc.postcode === postcodeData.postcode)) {
        alert('This postcode is already added');
        return;
      }

      setSelectedPostcodes([...selectedPostcodes, postcodeData]);
      setPostcodeSearch('');
    } catch (err: any) {
      setError(err.message);
      alert('Error: ' + err.message);
    } finally {
      setSearchingPostcode(false);
    }
  };

  const handleRemovePostcode = (postcode: string) => {
    setSelectedPostcodes(selectedPostcodes.filter(pc => pc.postcode !== postcode));
  };

  const handleSave = async (geoJSON: any) => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch(`/api/admin/teams/${teamId}/zone`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ serviceAreaGeoJSON: geoJSON }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save zone');
      }

      // Update local state
      setTeam((prev) => prev ? { ...prev, serviceAreaGeoJSON: geoJSON } : null);
      
      alert('Zone saved successfully!');
    } catch (err: any) {
      setError(err.message);
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading team...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Team not found</p>
      </div>
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Google Maps API key not configured</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href={`/admin/dashboard/teams/${teamId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Team
                </Button>
              </Link>
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-primary mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-primary">Service Zone Editor</h1>
                  <p className="text-xs text-gray-500">{team.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 flex">
        {/* Sidebar for Postcode Mode */}
        {mode === 'postcode' && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Add Postcodes</h3>
              
              {/* Search Input */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter postcode (e.g., 6000)"
                  value={postcodeSearch}
                  onChange={(e) => setPostcodeSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPostcode()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearchPostcode}
                  disabled={!postcodeSearch.trim() || searchingPostcode}
                  size="sm"
                >
                  {searchingPostcode ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Search and add Australian postcodes to build your service zone
              </p>
            </div>

            {/* Selected Postcodes List */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Selected Postcodes ({selectedPostcodes.length})
              </h4>
              
              {selectedPostcodes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No postcodes selected</p>
                  <p className="text-xs mt-1">Search and add postcodes above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedPostcodes.map((pc) => (
                    <div
                      key={pc.postcode}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{pc.postcode}</div>
                        <div className="text-sm text-gray-600 truncate">{pc.locality}</div>
                        <div className="text-xs text-gray-500 truncate">{pc.formatted_address}</div>
                      </div>
                      <Button
                        onClick={() => handleRemovePostcode(pc.postcode)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Container */}
        <main className="flex-1 relative flex flex-col">
          {/* Mode Selector */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'draw' | 'postcode')}>
              <TabsList>
                <TabsTrigger value="draw" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Draw Zone
                </TabsTrigger>
                <TabsTrigger value="postcode" className="gap-2">
                  <Search className="h-4 w-4" />
                  Postcode Search
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            {error && (
              <div className="absolute top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
                {error}
              </div>
            )}
            
            <APIProvider apiKey={apiKey}>
              <ZoneEditorMap 
                team={team} 
                onSave={handleSave}
                mode={mode}
                selectedPostcodes={selectedPostcodes}
                onPostcodePolygonsChange={setPostcodePolygons}
              />
            </APIProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
