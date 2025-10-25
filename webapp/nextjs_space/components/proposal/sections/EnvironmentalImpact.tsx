'use client';

import { Leaf, TreePine, Fuel, Factory } from 'lucide-react';

interface EnvironmentalImpactProps {
  annualProduction: number;
}

export default function EnvironmentalImpact({ annualProduction }: EnvironmentalImpactProps) {
  // Calculate environmental impact
  const co2SavedTonnes = ((annualProduction * 0.42) / 1000).toFixed(1);
  const treesEquivalent = Math.round((parseFloat(co2SavedTonnes) * 43));
  const petrolSavedLitres = Math.round(annualProduction * 0.3);
  const coalAvoidedKg = Math.round(annualProduction * 0.34);

  // 20-year totals
  const co2Saved20Years = (parseFloat(co2SavedTonnes) * 20).toFixed(1);
  const trees20Years = treesEquivalent * 20;
  const petrol20Years = petrolSavedLitres * 20;
  const coal20Years = coalAvoidedKg * 20;

  // Perspective calculations (more accurate)
  // Average car in Australia emits 4.3 tonnes CO2/year
  const carsOffRoad = Math.max(0.1, parseFloat(co2SavedTonnes) / 4.3);
  const carsOffRoadText = carsOffRoad >= 1 
    ? `${Math.round(carsOffRoad)} car${Math.round(carsOffRoad) !== 1 ? 's' : ''}`
    : `${carsOffRoad.toFixed(1)} cars`;
  
  // Perth to Sydney return flight = ~0.3 tonnes CO2 per passenger
  const flights = Math.max(1, Math.round(parseFloat(co2SavedTonnes) / 0.3));

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Environmental Contribution
          </h2>
          <p className="text-xl text-gray-600">
            Making a positive impact on our planet
          </p>
        </div>

        {/* Annual Impact */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Every Year, Your System Will:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Trees */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TreePine className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{treesEquivalent}</p>
              <p className="text-sm font-semibold text-gray-700 mb-1">Trees Planted</p>
              <p className="text-xs text-gray-600">Equivalent CO₂ absorption</p>
            </div>

            {/* Petrol */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Fuel className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{petrolSavedLitres.toLocaleString()}</p>
              <p className="text-sm font-semibold text-gray-700 mb-1">Litres of Petrol</p>
              <p className="text-xs text-gray-600">Energy equivalent saved</p>
            </div>

            {/* Coal */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-200 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Factory className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{coalAvoidedKg.toLocaleString()}</p>
              <p className="text-sm font-semibold text-gray-700 mb-1">kg of Coal</p>
              <p className="text-xs text-gray-600">Avoided burning</p>
            </div>

            {/* CO2 */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{co2SavedTonnes}</p>
              <p className="text-sm font-semibold text-gray-700 mb-1">Tonnes of CO₂</p>
              <p className="text-xs text-gray-600">Emissions reduced</p>
            </div>
          </div>
        </div>

        {/* 20-Year Impact */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-2xl p-8 text-white mb-12">
          <h3 className="text-3xl font-bold mb-6 text-center">
            20-Year Lifetime Impact
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">{trees20Years.toLocaleString()}</p>
              <p className="text-green-100 text-sm">Trees Planted</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">{petrol20Years.toLocaleString()}</p>
              <p className="text-green-100 text-sm">Litres Petrol Saved</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">{coal20Years.toLocaleString()}</p>
              <p className="text-green-100 text-sm">kg Coal Avoided</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">{co2Saved20Years}</p>
              <p className="text-green-100 text-sm">Tonnes CO₂ Reduced</p>
            </div>
          </div>
        </div>

        {/* Visual Comparison */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Put It in Perspective
          </h3>

          <div className="space-y-6">
            {/* Cars */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <div className="text-5xl">🚗</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Taking Cars Off the Road</p>
                <p className="text-sm text-gray-600">
                  Your annual CO₂ reduction equals removing {carsOffRoadText} from the road for a year
                </p>
              </div>
            </div>

            {/* Forest */}
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
              <div className="text-5xl">🌳</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Growing a Forest</p>
                <p className="text-sm text-gray-600">
                  Over 20 years, you'll offset as much CO₂ as {trees20Years.toLocaleString()} trees absorb
                </p>
              </div>
            </div>

            {/* Flights */}
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
              <div className="text-5xl">✈️</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Flight Emissions</p>
                <p className="text-sm text-gray-600">
                  Annual savings equivalent to {flights} return flight{flights !== 1 ? 's' : ''} from Perth to Sydney
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Be Part of the Solution
          </h3>
          <p className="text-gray-700 max-w-2xl mx-auto">
            By choosing solar, you're not just saving money—you're actively contributing to a cleaner, 
            more sustainable future for Western Australia and the planet. Every kilowatt-hour you generate 
            is one less that needs to come from fossil fuels.
          </p>
        </div>
      </div>
    </div>
  );
}
