
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getGoogleMapsApiKey } from '@/lib/api-keys';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

interface BuildingInsights {
  name: string;
  center: { latitude: number; longitude: number };
  boundingBox: any;
  imageryDate: { year: number; month: number; day: number };
  postalCode: string;
  administrativeArea: string;
  statisticalArea: string;
  regionCode: string;
  solarPotential: {
    maxArrayPanelsCount: number;
    wholeRoofStats?: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundAreaMeters2: number;
    };
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    panelLifetimeYears: number;
    roofSegmentStats: any[];
    solarPanels: any[];
    solarPanelConfigs?: any[];
    financialAnalyses: any[];
  };
  imageryQuality: string;
  imageryProcessedDate: { year: number; month: number; day: number };
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; suburb?: string } | null> {
  try {
    const apiKey = await getGoogleMapsApiKey();
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data?.results?.[0]?.geometry?.location) {
      // Extract suburb from address components
      const addressComponents = data.results[0].address_components || [];
      const suburbComponent = addressComponents.find((c: any) => 
        c.types.includes('locality') || c.types.includes('sublocality')
      );
      
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
        suburb: suburbComponent?.long_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function getSolarData(lat: number, lng: number): Promise<BuildingInsights | null> {
  try {
    const apiKey = await getGoogleMapsApiKey();
    const response = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${apiKey}`
    );

    if (!response.ok) {
      console.error('Solar API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Solar API error:', error);
    return null;
  }
}

// Helper to convert Google's date format to JS Date
function convertGoogleDate(dateObj: { year: number; month: number; day: number }): Date {
  return new Date(dateObj.year, dateObj.month - 1, dateObj.day);
}

// Helper to determine confidence level based on imagery quality
function calculateConfidenceLevel(imageryQuality: string, imageryAge: number): string {
  if (imageryQuality === 'HIGH' && imageryAge < 365) {
    return 'HIGH';
  } else if (imageryQuality === 'MEDIUM' || (imageryQuality === 'HIGH' && imageryAge < 730)) {
    return 'MEDIUM';
  }
  return 'LOW';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, leadId, sessionId, quoteId } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Geocode the address
    const location = await geocodeAddress(address);
    if (!location) {
      return NextResponse.json(
        { error: 'Could not geocode address' },
        { status: 400 }
      );
    }

    // Get solar data
    const solarData = await getSolarData(location.lat, location.lng);
    
    if (!solarData?.solarPotential) {
      // Return estimated data if Solar API doesn't have coverage
      return NextResponse.json({
        success: true,
        analysis: {
          estimated: true,
          maxArrayAreaMeters2: 100,
          maxSunshineHoursPerYear: 2920,
          maxArrayPanelsCount: 30,
          panelCapacityWatts: 440,
          imageryQuality: 'ESTIMATED',
          latitude: location.lat,
          longitude: location.lng,
          suburb: location.suburb,
          confidenceLevel: 'LOW',
        }
      });
    }

    const sp = solarData.solarPotential;
    const imageryDate = convertGoogleDate(solarData.imageryDate);
    const imageryProcessedDate = convertGoogleDate(solarData.imageryProcessedDate);
    const imageryAgeInDays = Math.floor((Date.now() - imageryDate.getTime()) / (1000 * 60 * 60 * 24));
    const confidenceLevel = calculateConfidenceLevel(solarData.imageryQuality, imageryAgeInDays);
    
    // Generate satellite roof image using Google Static Maps API
    // This is more reliable than the GeoTIFF from Solar API Data Layers
    const apiKey = await getGoogleMapsApiKey();
    const rgbUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${location.lat},${location.lng}` +
      `&zoom=20` +
      `&size=800x600` +
      `&maptype=satellite` +
      `&key=${apiKey}`;
    
    console.log('Generated Static Maps satellite image URL for roof visualization');
    
    // Handle edge case: Google returns 0 panels for some addresses
    // This can happen with:
    // - Very small/unsuitable roofs
    // - Heavy shading
    // - Roof angles/materials not suitable for solar
    // - API data quality issues
    if (sp.maxArrayPanelsCount === 0 || sp.maxArrayAreaMeters2 < 10) {
      console.warn(`Low solar potential detected for ${address}: panels=${sp.maxArrayPanelsCount}, area=${sp.maxArrayAreaMeters2}m²`);
      // Don't fallback to estimates - let the user know their roof may not be suitable
      // The frontend can handle this gracefully
    }

    // Store comprehensive roof analysis data in database
    // CRITICAL FIX: Save using sessionId or quoteId (before lead is created)
    if (leadId || sessionId || quoteId) {
      try {
        // Check if analysis already exists using findFirst for better flexibility
        const existingAnalysis = await prisma.roofAnalysis.findFirst({
          where: {
            OR: [
              leadId ? { leadId } : undefined,
              sessionId ? { sessionId } : undefined,
              quoteId ? { quoteId } : undefined,
            ].filter(Boolean) as any[],
          },
        });

        const analysisData = {
          address,
          latitude: location.lat,
          longitude: location.lng,
          suburb: location.suburb,
          imageryDate,
          imageryQuality: solarData.imageryQuality,
          imageryProcessedDate,
          imageryAgeInDays,
          maxArrayAreaMeters2: sp.maxArrayAreaMeters2,
          maxArrayPanelsCount: sp.maxArrayPanelsCount,
          maxSunshineHoursPerYear: sp.maxSunshineHoursPerYear,
          panelCapacityWatts: sp.panelCapacityWatts,
          panelHeightMeters: sp.panelHeightMeters,
          panelWidthMeters: sp.panelWidthMeters,
          panelLifetimeYears: sp.panelLifetimeYears,
          carbonOffsetKgPerMwh: sp.carbonOffsetFactorKgPerMwh,
          wholeRoofStats: sp.wholeRoofStats || {},
          roofSegments: sp.roofSegmentStats || [],
          solarPanelConfigs: sp.solarPanelConfigs || [],
          solarPanels: sp.solarPanels || [],  // NEW: Exact panel positions
          financialAnalyses: sp.financialAnalyses || [],
          confidenceLevel,
          boundingBox: solarData.boundingBox || {},
          regionCode: solarData.regionCode,
          rgbUrl: rgbUrl || null,  // Add roof image URL
          imageryProvider: 'google',  // NEW: Default to Google
          imageryResolution: 15,  // NEW: Google Maps ~15cm/pixel at zoom 20
          // Link to whatever identifier we have (preserve existing if not provided)
          leadId: leadId || existingAnalysis?.leadId || null,
          sessionId: sessionId || existingAnalysis?.sessionId || null,
          quoteId: quoteId || existingAnalysis?.quoteId || null,
          updatedAt: new Date(),
        };

        if (existingAnalysis) {
          // Update existing record
          await prisma.roofAnalysis.update({
            where: { id: existingAnalysis.id },
            data: analysisData,
          });
          console.log(`✅ Updated roof analysis: ${existingAnalysis.id}`);
        } else {
          // Create new record
          await prisma.roofAnalysis.create({
            data: {
              id: `roof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...analysisData,
            },
          });
          console.log(`✅ Created new roof analysis`);
        }
      } catch (dbError) {
        console.error('❌ Failed to store roof analysis:', dbError);
        // Continue even if DB storage fails
      }
    }

    // Return comprehensive solar potential data
    return NextResponse.json({
      success: true,
      analysis: {
        estimated: false,
        
        // Basic metrics (backward compatible)
        maxArrayAreaMeters2: sp.maxArrayAreaMeters2,
        maxSunshineHoursPerYear: sp.maxSunshineHoursPerYear,
        maxArrayPanelsCount: sp.maxArrayPanelsCount,
        imageryQuality: solarData.imageryQuality,
        
        // Location data
        latitude: location.lat,
        longitude: location.lng,
        suburb: location.suburb,
        regionCode: solarData.regionCode,
        
        // Imagery metadata
        imageryDate: imageryDate.toISOString(),
        imageryProcessedDate: imageryProcessedDate.toISOString(),
        imageryAgeInDays,
        rgbUrl: rgbUrl,  // Add roof image URL to response
        
        // Panel specifications
        panelCapacityWatts: sp.panelCapacityWatts,
        panelHeightMeters: sp.panelHeightMeters,
        panelWidthMeters: sp.panelWidthMeters,
        panelLifetimeYears: sp.panelLifetimeYears,
        
        // Environmental impact
        carbonOffsetKgPerMwh: sp.carbonOffsetFactorKgPerMwh,
        
        // Confidence indicators
        confidenceLevel,
        
        // Detailed analysis (for future use)
        wholeRoofStats: sp.wholeRoofStats,
        roofSegmentStats: sp.roofSegmentStats || [],
        solarPanelConfigs: sp.solarPanelConfigs || [],
        solarPanels: sp.solarPanels || [],  // NEW: Exact panel positions with coordinates
        financialAnalyses: sp.financialAnalyses || [],
        boundingBox: solarData.boundingBox,
        
        // Imagery provider info
        imageryProvider: 'google',
        imageryResolution: 15,
        
        // Center point
        centerLatitude: solarData.center?.latitude,
        centerLongitude: solarData.center?.longitude,
      }
    });
  } catch (error: any) {
    console.error('Solar analysis error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to analyze roof' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
