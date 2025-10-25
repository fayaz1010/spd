
'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, placeData?: any) => void;
  placeholder?: string;
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

export function AddressAutocomplete({ value, onChange, placeholder }: AddressAutocompleteProps) {
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          setScriptLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Define global callback before loading script
    (window as any).initGoogleMaps = () => {
      setScriptLoaded(true);
      delete (window as any).initGoogleMaps;
    };

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setIsLoading(false);
      delete (window as any).initGoogleMaps;
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current) return;

    try {
      // Initialize autocomplete
      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: 'au' },
          fields: ['formatted_address', 'geometry', 'address_components', 'name'],
          types: ['address'],
        }
      );

      // Add listener for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        console.log('🏠 Google place_changed event fired:', { 
          hasPlace: !!place, 
          hasAddress: !!place?.formatted_address,
          address: place?.formatted_address 
        });
        if (place?.formatted_address) {
          console.log('✅ Setting address from Google:', place.formatted_address);
          setInternalValue(place.formatted_address);
          onChange(place.formatted_address, place);
        } else {
          console.log('❌ No formatted_address in place object');
        }
      });

      // WORKAROUND: Sometimes place_changed doesn't fire, so also check on blur
      const handleBlur = () => {
        // Small delay to let autocomplete finish
        setTimeout(() => {
          const place = autocompleteRef.current?.getPlace();
          const currentInputValue = inputRef.current?.value || '';
          
          console.log('👁️ Blur event - checking for place:', {
            hasPlace: !!place,
            hasAddress: !!place?.formatted_address,
            currentValue: currentInputValue,
            internalValue: internalValue
          });
          
          // If we have a place with formatted_address, use it
          if (place?.formatted_address && place.formatted_address !== internalValue) {
            console.log('✅ Blur: Setting address from Google place object:', place.formatted_address);
            setInternalValue(place.formatted_address);
            onChange(place.formatted_address, place);
          } 
          // FALLBACK: If no place object but input value looks like a full address (has comma)
          // and is different from what we have, geocode it
          else if (!place?.formatted_address && currentInputValue.includes(',') && 
                   currentInputValue.length > 20 && currentInputValue !== internalValue) {
            console.log('🔍 No place object but input looks like full address, geocoding:', currentInputValue);
            
            // Use Geocoder to get place details
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ address: currentInputValue }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                console.log('✅ Geocoded successfully:', results[0].formatted_address);
                const geocodedPlace = results[0];
                setInternalValue(geocodedPlace.formatted_address);
                onChange(geocodedPlace.formatted_address, geocodedPlace);
              } else {
                console.log('❌ Geocoding failed:', status);
              }
            });
          }
        }, 100);
      };

      inputRef.current.addEventListener('blur', handleBlur);

      return () => {
        if (autocompleteRef.current) {
          (window as any).google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        }
        if (inputRef.current) {
          inputRef.current.removeEventListener('blur', handleBlur);
        }
      };
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }, [scriptLoaded, onChange, internalValue]);

  // Sync external value changes to internal state
  // BUT: Don't overwrite if we have a longer value (user typed or selected)
  useEffect(() => {
    if (value !== internalValue) {
      // If incoming value is shorter than current, ignore it
      // This prevents reverting to partial typed text after selection
      if (value.length < internalValue.length) {
        console.log('🚫 Ignoring shorter value to preserve address:', { 
          current: internalValue, 
          incoming: value 
        });
        return;
      }
      
      // If incoming value is longer or different, update
      console.log('✅ Syncing address from parent:', value);
      setInternalValue(value);
      if (inputRef.current) {
        inputRef.current.value = value;
      }
    }
  }, [value, internalValue]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setInternalValue(newValue);
          // Only update the text value, don't clear place data
          onChange(newValue);
        }}
        placeholder={placeholder ?? 'Start typing your address...'}
        className="text-lg py-6"
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-5 w-5 animate-spin text-coral" />
        </div>
      )}
      {!scriptLoaded && (
        <p className="text-xs text-gray-500 mt-1">Loading address autocomplete...</p>
      )}
    </div>
  );
}
