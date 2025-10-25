'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Home, Building2, MapPin, Loader2 } from 'lucide-react';
import { CalculatorData } from './calculator-flow-v2';
import { AddressAutocomplete } from '@/components/calculator/address-autocomplete';

interface Step1Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
}

const PROPERTY_TYPES = [
  { value: 'house', label: 'House', icon: Home, description: 'Detached or semi-detached' },
  { value: 'townhouse', label: 'Townhouse', icon: Building2, description: 'Attached dwelling' },
  { value: 'apartment', label: 'Apartment', icon: Building2, description: 'Multi-unit building' },
];

const ROOF_TYPES = [
  { value: 'tile', label: 'Tile Roof', description: 'Terracotta or concrete tiles' },
  { value: 'metal', label: 'Metal Roof', description: 'Colorbond or steel' },
  { value: 'flat', label: 'Flat Roof', description: 'Membrane or concrete' },
];

export function Step1Address({ data, updateData, nextStep }: Step1Props) {
  const [address, setAddress] = useState(data.address || '');
  const [propertyType, setPropertyType] = useState(data.propertyType || '');
  const [roofType, setRoofType] = useState(data.roofType || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isValidating, setIsValidating] = useState(false);
  // Use placeData from parent data if available, otherwise null
  const [placeData, setPlaceData] = useState<any>((data as any).placeData || null);
  // Track if address was selected from autocomplete to prevent overwriting
  // Use ref instead of state for immediate updates
  const addressLockedRef = useRef(false);

  // Sync local state with parent data when it changes
  // This ensures the address field stays in sync with the parent state
  // BUT: Don't overwrite if address is locked (user selected from autocomplete)
  useEffect(() => {
    console.log('🔄 Address sync check:', { 
      parentAddress: data.address, 
      localAddress: address,
      parentLength: data.address?.length || 0,
      localLength: address.length,
      addressLocked: addressLockedRef.current
    });
    
    // If address is locked (user selected from autocomplete), never sync from parent
    if (addressLockedRef.current) {
      console.log('🔒 Address is locked - not syncing from parent');
      return;
    }
    
    if (data.address && data.address !== address) {
      // Only sync if parent address is longer or if local is empty
      // This prevents overwriting user's typed/selected address
      if (data.address.length > address.length || !address) {
        console.log('✅ Syncing parent address to local:', data.address);
        setAddress(data.address);
      } else {
        console.log('🚫 Not syncing - local address is longer');
      }
    }
  }, [data.address, address]);

  useEffect(() => {
    if (data.propertyType && data.propertyType !== propertyType) {
      setPropertyType(data.propertyType);
    }
  }, [data.propertyType]);

  useEffect(() => {
    if (data.roofType && data.roofType !== roofType) {
      setRoofType(data.roofType);
    }
  }, [data.roofType]);

  useEffect(() => {
    if ((data as any).placeData && (data as any).placeData !== placeData) {
      setPlaceData((data as any).placeData);
    }
  }, [(data as any).placeData]);

  const handleAddressChange = (value: string, place?: any) => {
    console.log('📍 handleAddressChange called:', { value, hasPlace: !!place });
    
    // If place data is provided (user selected from dropdown), save everything
    if (place) {
      // Update local state FIRST with the full address
      setAddress(value);
      setPlaceData(place);
      addressLockedRef.current = true; // LOCK the address to prevent overwriting (using ref for immediate effect)
      
      // IMMEDIATELY save the address when selected from autocomplete
      // This prevents loss of data when clicking other fields
      const lat = typeof place.geometry?.location?.lat === 'function' 
        ? place.geometry.location.lat() 
        : place.geometry?.location?.lat;
      const lng = typeof place.geometry?.location?.lng === 'function'
        ? place.geometry.location.lng()
        : place.geometry?.location?.lng;
      
      const addressComponents = place.address_components || [];
      const suburbComponent = addressComponents.find((c: any) =>
        c.types.includes('locality') || c.types.includes('sublocality')
      );
      
      console.log('✅ Saving full address to parent AND local + LOCKING:', value.trim());
      // Save address data AND placeData immediately to persist across re-renders
      updateData({
        address: value.trim(),
        latitude: lat,
        longitude: lng,
        suburb: suburbComponent?.long_name || null,
        placeData: place, // CRITICAL: Save placeData to parent state
      } as any);
    } else {
      // User is typing - only update local state
      setAddress(value);
      // If user is typing and deleting, unlock the address
      if (value.length < address.length) {
        addressLockedRef.current = false;
      }
      console.log('⏭️ Skipping parent update (user typing)');
    }
    
    if (errors.address) {
      setErrors({ ...errors, address: '' });
    }
  };

  const validateAndContinue = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!address.trim()) {
      newErrors.address = 'Please enter your address';
    }
    if (!propertyType) {
      newErrors.propertyType = 'Please select your property type';
    }
    if (!roofType) {
      newErrors.roofType = 'Please select your roof type';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsValidating(true);
    setErrors({});

    try {
      // If we have place data from autocomplete, use it directly
      if (placeData?.geometry?.location) {
        const lat = typeof placeData.geometry.location.lat === 'function' 
          ? placeData.geometry.location.lat() 
          : placeData.geometry.location.lat;
        const lng = typeof placeData.geometry.location.lng === 'function'
          ? placeData.geometry.location.lng()
          : placeData.geometry.location.lng;

        // Extract suburb from address components
        const addressComponents = placeData.address_components || [];
        const suburbComponent = addressComponents.find((c: any) =>
          c.types.includes('locality') || c.types.includes('sublocality')
        );
        const stateComponent = addressComponents.find((c: any) =>
          c.types.includes('administrative_area_level_1')
        );

        // Verify it's in WA
        if (stateComponent && stateComponent.short_name !== 'WA') {
          setErrors({ address: 'We currently only service Western Australia. Please enter a WA address.' });
          setIsValidating(false);
          return;
        }

        // Save data and proceed
        updateData({
          address: address.trim(),
          propertyType,
          roofType,
          latitude: lat,
          longitude: lng,
          suburb: suburbComponent?.long_name || null,
        });

        nextStep();
        return;
      }

      // Fallback: Validate address with Google Geocoding API
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`
      );
      
      if (!response.ok) {
        setErrors({ address: 'Unable to verify address. Please check and try again.' });
        setIsValidating(false);
        return;
      }

      const result = await response.json();
      
      if (!result.success) {
        setErrors({ address: 'Address not found. Please enter a valid Western Australian address.' });
        setIsValidating(false);
        return;
      }

      // Save data to state
      const addressData = {
        address: address.trim(),
        propertyType,
        roofType,
        latitude: result.latitude,
        longitude: result.longitude,
        suburb: result.suburb,
      };
      
      updateData(addressData);

      // Save to database using existing /api/quotes/save endpoint
      try {
        const quoteResponse = await fetch('/api/quotes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data.sessionId,
            ...addressData,
          }),
        });

        if (quoteResponse.ok) {
          const result = await quoteResponse.json();
          if (result.quote) {
            updateData({ 
              quoteId: result.quote.id, 
              quoteReference: result.quote.quoteReference 
            });
            console.log(`✅ Saved address data to database`);
          }
        } else {
          console.error('Failed to save address data');
        }
      } catch (error) {
        console.error('Error saving address data:', error);
        // Continue anyway - data is in state
      }

      nextStep();
    } catch (error) {
      console.error('Address validation error:', error);
      setErrors({ address: 'Error validating address. Please try again.' });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <MapPin className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          Let's Start Your Solar Journey
        </h1>
        <p className="text-xl text-gray-600">
          Enter your address to see how much you can save with solar
        </p>
      </div>

      {/* Address Input */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-base font-semibold">
              Your Property Address
            </Label>
            <div className={errors.address ? 'border-2 border-red-500 rounded-lg' : ''}>
              <AddressAutocomplete
                value={address}
                onChange={handleAddressChange}
                placeholder="Start typing your address... (e.g., 123 Main Street, Perth)"
              />
            </div>
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address}</p>
            )}
            <p className="text-sm text-gray-500">
              ✨ Start typing and select from suggestions • We'll use satellite imagery to analyze your roof's solar potential
            </p>
          </div>

          {/* Property Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Property Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PROPERTY_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setPropertyType(type.value);
                      // Save property type immediately
                      updateData({ propertyType: type.value });
                      if (errors.propertyType) {
                        setErrors({ ...errors, propertyType: '' });
                      }
                    }}
                    disabled={isValidating}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all text-left
                      ${
                        propertyType === type.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                      ${errors.propertyType ? 'border-red-300' : ''}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon
                        className={`w-6 h-6 mt-0.5 ${
                          propertyType === type.value
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {type.description}
                        </div>
                      </div>
                    </div>
                    {propertyType === type.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.propertyType && (
              <p className="text-sm text-red-600">{errors.propertyType}</p>
            )}
          </div>

          {/* Roof Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Roof Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ROOF_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setRoofType(type.value);
                    // Save roof type immediately
                    updateData({ roofType: type.value });
                    if (errors.roofType) {
                      setErrors({ ...errors, roofType: '' });
                    }
                  }}
                  disabled={isValidating}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all text-left
                    ${
                      roofType === type.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                    ${errors.roofType ? 'border-red-300' : ''}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="font-semibold text-gray-900">
                    {type.label}
                  </div>
                  <div className="text-sm text-gray-500">
                    {type.description}
                  </div>
                  {roofType === type.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.roofType && (
              <p className="text-sm text-red-600">{errors.roofType}</p>
            )}
          </div>

          {/* Number of Stories */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Number of Stories</Label>
            <p className="text-sm text-gray-500">Multi-storey installations may incur additional costs</p>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((stories) => (
                <button
                  key={stories}
                  type="button"
                  onClick={() => {
                    updateData({ stories });
                  }}
                  disabled={isValidating}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all text-center
                    ${
                      data.stories === stories
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="text-2xl font-bold text-gray-900">
                    {stories}
                  </div>
                  <div className="text-sm text-gray-500">
                    {stories === 1 ? 'Single' : stories === 2 ? 'Double' : 'Triple'} Storey
                  </div>
                  {data.stories === stories && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          onClick={validateAndContinue}
          disabled={isValidating}
          size="lg"
          className="min-w-[200px]"
        >
          {isValidating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              Add Usage Patterns
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 pt-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Free Analysis</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>No Obligation</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Instant Results</span>
        </div>
      </div>
    </div>
  );
}
