'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Satellite, Sun, CheckCircle2, Loader2, AlertCircle, Zap, TrendingUp, Battery, Moon } from 'lucide-react';
import { CalculatorData } from './calculator-flow-v2';
import { calculateEnergyAnalysis, getBatterySizeRecommendation } from '@/lib/energy-calculations';

interface Step3Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function Step3RoofAnalysis({ data, updateData, nextStep, prevStep }: Step3Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roofData, setRoofData] = useState<any>(null);
  const [generatingQuotes, setGeneratingQuotes] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto-analyze roof on mount
  useEffect(() => {
    analyzeRoof();
  }, []);

  const analyzeRoof = async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(10);

      // Step 1: Call Google Solar API
      const solarResponse = await fetch('/api/solar-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: data.address,
          sessionId: data.sessionId,
          quoteId: data.quoteId,  // Link roof analysis to quote
        }),
      });

      if (!solarResponse.ok) {
        throw new Error('Failed to analyze roof. Please try again.');
      }

      const solarResult = await solarResponse.json();
      
      if (!solarResult.success) {
        throw new Error(solarResult.error || 'Failed to analyze roof');
      }

      const roofAnalysis = solarResult.analysis;
      setRoofData(roofAnalysis);
      setProgress(40);
      
      console.log('Roof Analysis Data Received:', roofAnalysis);
      console.log('RGB Image URL:', roofAnalysis.rgbUrl);

      // Step 2: Generate 3 quote options
      await generateQuoteOptions(solarResult.analysis);

    } catch (err: any) {
      console.error('Roof analysis error:', err);
      setError(err.message || 'Failed to analyze roof. Please try again.');
      setLoading(false);
    }
  };

  const generateQuoteOptions = async (roofAnalysis: any) => {
    try {
      setGeneratingQuotes(true);
      setProgress(50);

      const googleSolarData = {
        maxArrayPanelsCount: roofAnalysis.maxArrayPanelsCount,
        maxArrayAreaMeters2: roofAnalysis.maxArrayAreaMeters2,
        maxSunshineHoursPerYear: roofAnalysis.maxSunshineHoursPerYear,
        panelCapacityWatts: roofAnalysis.panelCapacityWatts,
        latitude: roofAnalysis.latitude,
        longitude: roofAnalysis.longitude,
      };

      const userProfile = {
        quarterlyBill: data.quarterlyBill || 500,
        householdSize: data.householdSize || 4,
        hasEv: data.hasEv || false,
        planningEv: data.planningEv || false,
        evCount: data.evCount || 0,
        evChargingTime: data.evChargingTime,
        hasPool: data.hasPool || false,
        poolHeated: data.poolHeated || false,
        homeOfficeCount: data.homeOfficeCount || 0,
      };

      // Generate 3 quotes in parallel
      const [smallQuote, mediumQuote, largeQuote] = await Promise.all([
        generateQuote(googleSolarData, userProfile, 'small'),
        generateQuote(googleSolarData, userProfile, 'medium'),
        generateQuote(googleSolarData, userProfile, 'large'),
      ]);

      setProgress(90);

      // Save to state
      updateData({
        roofAnalysisData: roofAnalysis,
        quoteOptions: {
          small: smallQuote,
          medium: mediumQuote,
          large: largeQuote,
        },
      });

      setProgress(100);
      setLoading(false);
      setGeneratingQuotes(false);

    } catch (err: any) {
      console.error('Quote generation error:', err);
      setError(err.message || 'Failed to generate quotes. Please try again.');
      setLoading(false);
      setGeneratingQuotes(false);
    }
  };

  const generateQuote = async (googleSolarData: any, userProfile: any, systemSize: string) => {
    const response = await fetch('/api/solar-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleSolarData,
        userProfile,
        systemSize,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate ${systemSize} quote`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || `Failed to generate ${systemSize} quote`);
    }

    return result.quote;
  };

  const handleContinue = async () => {
    if (data.quoteOptions) {
      nextStep();
    }
  };

  // Remove the extra "Start Analysis" screen
  if (false) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-3">
            <Satellite className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Ready to Analyze Your Roof
          </h2>
          <p className="text-lg text-gray-600">
            We'll use satellite imagery to calculate your solar potential
          </p>
        </div>

        {/* What We'll Analyze */}
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
            <CardTitle className="flex items-center space-x-2">
              <Satellite className="w-6 h-6 text-blue-600" />
              <span>Roof Analysis Process</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 mx-auto mb-3 flex items-center justify-center">
                  <Satellite className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Satellite Imagery</h3>
                <p className="text-sm text-gray-600">
                  High-resolution satellite photos of your roof
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Solar Potential</h3>
                <p className="text-sm text-gray-600">
                  Calculate maximum panel capacity and sun exposure
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 mx-auto mb-3 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Custom Quotes</h3>
                <p className="text-sm text-gray-600">
                  Generate 3 tailored solar system options
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Confirmation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Analysis Location</p>
                <p className="text-gray-600">{data.address}</p>
                {data.suburb && (
                  <p className="text-gray-500 text-xs mt-1">{data.suburb}, WA</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button onClick={prevStep} variant="outline" size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button onClick={handleContinue} size="lg" className="min-w-[200px]">
            Start Roof Analysis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Unable to Analyze Roof
          </h2>
          <p className="text-lg text-gray-600">
            {error}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-gray-700">
                This could be because:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>The address doesn't have recent satellite imagery</li>
                <li>The property is in a rural area</li>
                <li>There's a temporary issue with the solar analysis service</li>
              </ul>
              <p className="text-gray-700 pt-4">
                <strong>What you can do:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Try a different address format</li>
                <li>Contact us directly for a manual quote</li>
                <li>Try again in a few minutes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button onClick={prevStep} variant="outline" size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button onClick={analyzeRoof} size="lg">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Satellite className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Analyzing Your Roof
          </h2>
          <p className="text-lg text-gray-600">
            We're using satellite imagery to calculate your solar potential
          </p>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {progress < 40 && 'Analyzing satellite imagery...'}
                  {progress >= 40 && progress < 50 && 'Calculating roof capacity...'}
                  {progress >= 50 && progress < 90 && 'Generating system options...'}
                  {progress >= 90 && 'Finalizing recommendations...'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {progress}% complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Satellite, label: 'Satellite Analysis', done: progress > 40 },
            { icon: Sun, label: 'Solar Potential', done: progress > 50 },
            { icon: CheckCircle2, label: 'System Options', done: progress > 90 },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className={step.done ? 'border-green-500 bg-green-50' : ''}>
                <CardContent className="pt-6 text-center">
                  <Icon
                    className={`w-8 h-8 mx-auto mb-2 ${
                      step.done ? 'text-green-600' : 'text-gray-400'
                    }`}
                  />
                  <p className={`text-sm font-medium ${
                    step.done ? 'text-green-900' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </p>
                  {step.done && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mt-2" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Success state - show roof analysis results with Google Solar API data
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-3">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          Great News! Your Roof is Perfect for Solar
        </h2>
        <p className="text-lg text-gray-600">
          We've analyzed your roof using Google Solar API satellite imagery
        </p>
      </div>

      {/* Roof Image from Google Solar API */}
      {roofData && roofData.rgbUrl ? (
        <Card className="border-2 border-blue-500 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 py-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Satellite className="w-5 h-5 text-blue-600" />
              <span>Satellite Image of Your Roof</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <img 
              src={roofData.rgbUrl} 
              alt="Satellite view of your roof" 
              className="w-full h-auto"
              onLoad={() => {
                console.log('✅ Roof image loaded successfully!');
              }}
              onError={(e) => {
                console.error('❌ Failed to load roof image from URL:', roofData.rgbUrl);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'p-8 text-center';
                errorDiv.innerHTML = `
                  <p class="text-gray-500 mb-2">Unable to load roof image</p>
                  <p class="text-xs text-gray-400">URL: ${roofData.rgbUrl?.substring(0, 100)}...</p>
                `;
                e.currentTarget.parentElement!.replaceChild(errorDiv, e.currentTarget);
              }}
            />
          </CardContent>
        </Card>
      ) : roofData && (
        <Card className="border-2 border-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Roof Image Not Available</p>
                <p className="text-gray-600">We have the roof data but the satellite image could not be retrieved. This won't affect your solar analysis.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roof Analysis Data from Google Solar API */}
      {roofData && (
        <Card className="border-2 border-green-500">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="flex items-center space-x-2">
              <Satellite className="w-6 h-6 text-green-600" />
              <span>Satellite Roof Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Primary Roof Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {roofData.maxArrayPanelsCount || 'N/A'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Max Panels</div>
                <div className="text-xs text-gray-500 mt-1">
                  {roofData.panelCapacityWatts}W each
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {(roofData.maxArrayAreaMeters2 || 0).toFixed(1)} m²
                </div>
                <div className="text-sm text-gray-600 font-medium">Usable Roof Area</div>
                <div className="text-xs text-gray-500 mt-1">
                  For solar panels
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {((roofData.maxSunshineHoursPerYear || 0) / 365).toFixed(1)} hrs
                </div>
                <div className="text-sm text-gray-600 font-medium">Daily Sunshine</div>
                <div className="text-xs text-gray-500 mt-1">
                  {(roofData.maxSunshineHoursPerYear || 0).toLocaleString()} hrs/year
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {((roofData.maxArrayPanelsCount * roofData.panelCapacityWatts) / 1000).toFixed(1)} kW
                </div>
                <div className="text-sm text-gray-600 font-medium">Max System Size</div>
                <div className="text-xs text-gray-500 mt-1">
                  Maximum capacity
                </div>
              </div>
            </div>

            {/* Additional Solar Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Sun className="w-4 h-4 mr-2 text-orange-600" />
                  Solar Potential
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Panel Capacity:</span>
                    <span className="font-semibold">{roofData.panelCapacityWatts}W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Panel Height:</span>
                    <span className="font-semibold">{roofData.panelHeightMeters}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Panel Width:</span>
                    <span className="font-semibold">{roofData.panelWidthMeters}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Panels per m²:</span>
                    <span className="font-semibold">{(1 / (roofData.panelHeightMeters * roofData.panelWidthMeters)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Satellite className="w-4 h-4 mr-2 text-blue-600" />
                  Imagery Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality:</span>
                    <span className="font-semibold">{roofData.imageryQuality || 'HIGH'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Imagery Date:</span>
                    <span className="font-semibold">
                      {roofData.imageryDate ? new Date(roofData.imageryDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {roofData.imageryAgeInDays && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Image Age:</span>
                      <span className="font-semibold">{Math.round(roofData.imageryAgeInDays / 365)} years</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-semibold">{roofData.suburb || data.suburb || 'Perth'}, WA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinates */}
            {(roofData.latitude && roofData.longitude) && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="text-gray-700">
                  <strong>Coordinates:</strong> {roofData.latitude.toFixed(6)}, {roofData.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Address Confirmation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Analysis Location</p>
              <p className="text-gray-600">{data.address}</p>
              {data.suburb && (
                <p className="text-gray-500 text-xs mt-1">{data.suburb}, WA</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Next: Choose Your Perfect Solar System
              </h3>
              <p className="text-sm text-gray-600">
                Based on your roof capacity and energy usage, we've created 3 custom solar options for you.
                Each option includes accurate pricing, savings projections, and payback periods.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
        <Button onClick={prevStep} variant="outline" size="lg" className="w-full sm:w-auto">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue} size="lg" className="w-full sm:w-auto sm:min-w-[200px]">
          View My Options
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
