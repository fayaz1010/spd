
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X, MapPin, Plus, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SuburbAutocompleteProps {
  selectedSuburbs: string[];
  onSuburbsChange: (suburbs: string[]) => void;
  label?: string;
  placeholder?: string;
}

interface PlaceResult {
  description: string;
  place_id: string;
}

interface AdjacentSuburb {
  name: string;
  distance: number;
}

export function SuburbAutocomplete({
  selectedSuburbs,
  onSuburbsChange,
  label = "Service Suburbs",
  placeholder = "Search for suburbs..."
}: SuburbAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<PlaceResult[]>([]);
  const [adjacentSuburbs, setAdjacentSuburbs] = useState<AdjacentSuburb[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    // Initialize Google Maps services
    if (typeof window !== 'undefined' && window.google?.maps) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      const div = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(div);
      geocoder.current = new google.maps.Geocoder();
    } else {
      // Load Google Maps script if not already loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        const div = document.createElement('div');
        placesService.current = new google.maps.places.PlacesService(div);
        geocoder.current = new google.maps.Geocoder();
      };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (inputValue.length < 2) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      if (autocompleteService.current) {
        autocompleteService.current.getPlacePredictions(
          {
            input: inputValue,
            componentRestrictions: { country: 'au' },
            types: ['(regions)'],
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              // Filter to only suburbs (remove state-level results)
              const suburbs = results.filter(r => 
                r.types.includes('locality') || 
                r.types.includes('sublocality') ||
                r.types.includes('postal_code')
              );
              setPredictions(suburbs);
              setShowSuggestions(true);
            } else {
              setPredictions([]);
            }
          }
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const findAdjacentSuburbs = async (placeId: string) => {
    if (!placesService.current || !geocoder.current) return;

    setLoading(true);
    try {
      // Get the coordinates of the selected suburb
      placesService.current.getDetails(
        { placeId, fields: ['geometry', 'name'] },
        async (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            // Search for nearby suburbs (within 10km radius)
            const nearbyRequest = {
              location: new google.maps.LatLng(lat, lng),
              radius: 10000, // 10km
              type: 'locality' as any,
            };

            placesService.current?.nearbySearch(nearbyRequest, (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                // Calculate distances and filter out already selected
                const adjacent = results
                  .filter(r => r.name && !selectedSuburbs.includes(r.name))
                  .slice(0, 10) // Limit to 10 suggestions
                  .map(r => ({
                    name: r.name!,
                    distance: calculateDistance(
                      lat,
                      lng,
                      r.geometry?.location?.lat() || 0,
                      r.geometry?.location?.lng() || 0
                    ),
                  }))
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, 6); // Show top 6 closest

                setAdjacentSuburbs(adjacent);
              }
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error finding adjacent suburbs:', error);
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  const extractSuburbName = (description: string): string => {
    // Extract suburb name from Google's formatted address
    // Format is usually "Suburb, State Postcode, Country"
    const parts = description.split(',');
    return parts[0].trim();
  };

  const handleSelectSuburb = (prediction: PlaceResult) => {
    const suburbName = extractSuburbName(prediction.description);
    if (!selectedSuburbs.includes(suburbName)) {
      onSuburbsChange([...selectedSuburbs, suburbName]);
      findAdjacentSuburbs(prediction.place_id);
    }
    setInputValue('');
    setPredictions([]);
    setShowSuggestions(false);
  };

  const handleAddAdjacentSuburb = (suburbName: string) => {
    if (!selectedSuburbs.includes(suburbName)) {
      onSuburbsChange([...selectedSuburbs, suburbName]);
      // Remove from suggestions
      setAdjacentSuburbs(adjacentSuburbs.filter(s => s.name !== suburbName));
    }
  };

  const handleRemoveSuburb = (suburb: string) => {
    onSuburbsChange(selectedSuburbs.filter(s => s !== suburb));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="suburb-search">{label}</Label>
        <div className="relative">
          <Input
            id="suburb-search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="pr-10"
          />
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && predictions.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
              <div className="p-2">
                {predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleSelectSuburb(prediction)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2 text-sm"
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{prediction.description}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Selected Suburbs */}
      {selectedSuburbs.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Suburbs ({selectedSuburbs.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedSuburbs.map((suburb) => (
              <Badge
                key={suburb}
                variant="secondary"
                className="px-3 py-1.5 text-sm"
              >
                {suburb}
                <button
                  onClick={() => handleRemoveSuburb(suburb)}
                  className="ml-2 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Adjacent Suburbs Suggestions */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Finding nearby suburbs...</span>
        </div>
      )}
      
      {!loading && adjacentSuburbs.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">
            Nearby Suburbs (one-click add)
          </Label>
          <div className="flex flex-wrap gap-2">
            {adjacentSuburbs.map((suburb) => (
              <Button
                key={suburb.name}
                variant="outline"
                size="sm"
                onClick={() => handleAddAdjacentSuburb(suburb.name)}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                {suburb.name} ({suburb.distance.toFixed(1)}km)
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
