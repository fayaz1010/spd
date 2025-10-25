
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Home, Building2, ArrowRight } from 'lucide-react';
import { CalculatorData } from './calculator-flow';
import { AddressAutocomplete } from './address-autocomplete';

interface Step1Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
}

export function Step1Address({ data, updateData, nextStep }: Step1Props) {
  const [address, setAddress] = useState(data?.address ?? '');
  const [propertyType, setPropertyType] = useState(data?.propertyType ?? 'residential');
  const [roofType, setRoofType] = useState(data?.roofType ?? 'tile');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address?.trim?.()) {
      alert('Please enter your address');
      return;
    }
    
    // Create early lead (potential lead) as soon as address is entered
    // This helps track all potential customers even if they don't complete the form
    try {
      const earlyLeadResponse = await fetch('/api/leads/create-early', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data?.sessionId,
          address,
          propertyType,
          roofType,
          // These will be populated from Google Maps API if available
          latitude: null,
          longitude: null,
          suburb: null,
        }),
      });
      
      const leadResult = await earlyLeadResponse.json();
      
      if (leadResult.success) {
        updateData({ 
          address, 
          propertyType, 
          roofType,
          quoteId: leadResult.quoteId,
          leadId: leadResult.leadId,
        });
        nextStep();
      } else {
        console.error('Failed to create early lead:', leadResult.error);
        // Continue anyway - don't block user
        updateData({ address, propertyType, roofType });
        nextStep();
      }
    } catch (error) {
      console.error('Error creating early lead:', error);
      // Continue anyway - don't block user
      updateData({ address, propertyType, roofType });
      nextStep();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary mb-3">
          Let's Start With Your Property
        </h2>
        <p className="text-gray-600">
          We'll use satellite imagery to analyze your roof and calculate the perfect solar system for your home.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Address */}
        <div>
          <Label htmlFor="address" className="text-lg font-semibold text-primary mb-3 block">
            <MapPin className="inline h-5 w-5 mr-2" />
            Property Address
          </Label>
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            placeholder="Start typing your address..."
          />
          <p className="text-sm text-gray-500 mt-2">
            We need your address to analyze your roof using satellite technology
          </p>
        </div>

        {/* Property Type */}
        <div>
          <Label className="text-lg font-semibold text-primary mb-3 block">
            Property Type
          </Label>
          <RadioGroup value={propertyType} onValueChange={setPropertyType}>
            <div className="grid grid-cols-2 gap-4">
              <div className={`
                relative flex items-center space-x-3 border-2 rounded-xl p-6 cursor-pointer transition-all
                ${propertyType === 'residential' ? 'border-coral bg-coral-50' : 'border-gray-200 hover:border-gray-300'}
              `}>
                <RadioGroupItem value="residential" id="residential" className="sr-only" />
                <label htmlFor="residential" className="flex items-center cursor-pointer flex-1">
                  <Home className={`h-8 w-8 mr-4 ${propertyType === 'residential' ? 'text-coral' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-semibold text-primary">Residential</p>
                    <p className="text-sm text-gray-500">Home or apartment</p>
                  </div>
                </label>
              </div>

              <div className={`
                relative flex items-center space-x-3 border-2 rounded-xl p-6 cursor-pointer transition-all
                ${propertyType === 'commercial' ? 'border-coral bg-coral-50' : 'border-gray-200 hover:border-gray-300'}
              `}>
                <RadioGroupItem value="commercial" id="commercial" className="sr-only" />
                <label htmlFor="commercial" className="flex items-center cursor-pointer flex-1">
                  <Building2 className={`h-8 w-8 mr-4 ${propertyType === 'commercial' ? 'text-coral' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-semibold text-primary">Commercial</p>
                    <p className="text-sm text-gray-500">Business property</p>
                  </div>
                </label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Roof Type */}
        <div>
          <Label className="text-lg font-semibold text-primary mb-3 block">
            Roof Type
          </Label>
          <RadioGroup value={roofType} onValueChange={setRoofType}>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'tile', label: 'Tile Roof', desc: 'Terracotta or concrete' },
                { value: 'metal', label: 'Metal Roof', desc: 'Colorbond or tin' },
                { value: 'flat', label: 'Flat Roof', desc: 'Membrane or concrete' },
              ].map((option) => (
                <div
                  key={option.value}
                  className={`
                    relative border-2 rounded-xl p-4 cursor-pointer transition-all
                    ${roofType === option.value ? 'border-coral bg-coral-50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <label htmlFor={option.value} className="cursor-pointer block">
                    <p className="font-semibold text-primary mb-1">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            size="lg"
            className="bg-coral hover:bg-coral-600 text-white px-8"
          >
            Continue to Energy Usage
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
