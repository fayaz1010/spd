/**
 * Chatbot Tools - Database query functions that AI can call
 * These tools allow the AI to access specific database information dynamically
 */

import { prisma } from '@/lib/db';

// ============================================================================
// TOOL DEFINITIONS - These describe what the AI can do
// ============================================================================

export const chatbotTools = [
  {
    name: 'get_customer_quote',
    description: 'Get detailed quote information for a specific customer including system specs, costs, rebates, and savings',
    parameters: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'The lead/customer ID to fetch quote for',
        },
      },
      required: ['leadId'],
    },
  },
  {
    name: 'get_installation_status',
    description: 'Get current installation job status, scheduled date, and team assignment for a customer',
    parameters: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'The lead/customer ID to fetch installation status for',
        },
      },
      required: ['leadId'],
    },
  },
  {
    name: 'calculate_instant_quote',
    description: 'Calculate a real-time quote for a solar system based on customer requirements',
    parameters: {
      type: 'object',
      properties: {
        systemSizeKw: {
          type: 'number',
          description: 'Solar system size in kW (e.g., 6.6, 10, 13.2)',
        },
        batterySizeKwh: {
          type: 'number',
          description: 'Battery size in kWh (0 for no battery, 10, 13.5, 20, 30, etc.)',
        },
        postcode: {
          type: 'string',
          description: 'Customer postcode for rebate calculations (WA postcode)',
        },
        quarterlyBill: {
          type: 'number',
          description: 'Customer quarterly electricity bill in dollars',
        },
      },
      required: ['systemSizeKw', 'batterySizeKwh', 'postcode', 'quarterlyBill'],
    },
  },
  {
    name: 'get_available_rebates',
    description: 'Get all currently available rebates and their eligibility criteria',
    parameters: {
      type: 'object',
      properties: {
        systemSizeKw: {
          type: 'number',
          description: 'Solar system size in kW (optional, for specific calculations)',
        },
        batterySizeKwh: {
          type: 'number',
          description: 'Battery size in kWh (optional, for specific calculations)',
        },
        postcode: {
          type: 'string',
          description: 'Customer postcode (optional, for location-specific rebates)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_product_details',
    description: 'Get detailed specifications and pricing for solar panels, inverters, or batteries',
    parameters: {
      type: 'object',
      properties: {
        productType: {
          type: 'string',
          enum: ['panel', 'inverter', 'battery'],
          description: 'Type of product to search for',
        },
        brand: {
          type: 'string',
          description: 'Brand name (optional filter)',
        },
        minPower: {
          type: 'number',
          description: 'Minimum power/capacity (optional filter)',
        },
      },
      required: ['productType'],
    },
  },
  {
    name: 'get_installation_costs',
    description: 'Get detailed breakdown of installation costs and add-ons',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['MANDATORY', 'SITE_INSPECTION', 'CUSTOMER_ADDON', 'MANUAL'],
          description: 'Filter by cost category (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'calculate_roi_payback',
    description: 'Calculate return on investment and payback period for a solar system',
    parameters: {
      type: 'object',
      properties: {
        systemCost: {
          type: 'number',
          description: 'Total system cost after rebates in dollars',
        },
        annualSavings: {
          type: 'number',
          description: 'Estimated annual electricity savings in dollars',
        },
        systemSizeKw: {
          type: 'number',
          description: 'Solar system size in kW',
        },
      },
      required: ['systemCost', 'annualSavings', 'systemSizeKw'],
    },
  },
  {
    name: 'get_packages',
    description: 'Get available solar package templates with pricing and features',
    parameters: {
      type: 'object',
      properties: {
        minSystemSize: {
          type: 'number',
          description: 'Minimum system size in kW (optional filter)',
        },
        includeBattery: {
          type: 'boolean',
          description: 'Filter packages that include batteries (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_extra_services',
    description: 'Get available extra services beyond solar installation (roof repairs, gutter cleaning, electrical work, HVAC, security systems, etc.)',
    parameters: {
      type: 'object',
      properties: {
        serviceType: {
          type: 'string',
          enum: ['roof_gutter', 'security', 'electrical', 'hvac', 'all'],
          description: 'Filter by service type (optional)',
        },
        searchTerm: {
          type: 'string',
          description: 'Search term to filter services by name or description (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_roof_analysis',
    description: 'Get roof analysis with satellite photo and solar potential for a given address. Use when customer provides their address or asks about roof suitability. Returns roof photo, usable area, panel capacity, and solar potential.',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Full street address including number, street, suburb, and postcode',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'request_contact_details',
    description: 'Request customer contact details for quote, inspection booking, or callback. Use this when customer shows interest in getting a quote, booking an inspection, or wants to be contacted.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: ['quote', 'inspection', 'callback', 'general'],
          description: 'Reason for collecting contact details',
        },
        systemDetails: {
          type: 'string',
          description: 'Brief summary of system discussed (e.g., "13.2kW solar + 20kWh battery")',
        },
      },
      required: ['reason'],
    },
  },
];

// ============================================================================
// TOOL IMPLEMENTATIONS - Actual database queries
// ============================================================================

export async function executeToolCall(toolName: string, parameters: any, context?: { leadId?: string; customerId?: string }) {
  console.log(`🔧 Executing tool: ${toolName}`, parameters);

  try {
    switch (toolName) {
      case 'get_customer_quote':
        return await getCustomerQuote(parameters.leadId || context?.leadId);

      case 'get_installation_status':
        return await getInstallationStatus(parameters.leadId || context?.leadId);

      case 'calculate_instant_quote':
        return await calculateInstantQuote(parameters);

      case 'get_available_rebates':
        return await getAvailableRebates(parameters);

      case 'get_product_details':
        return await getProductDetails(parameters);

      case 'get_installation_costs':
        return await getInstallationCosts(parameters);

      case 'calculate_roi_payback':
        return await calculateROIPayback(parameters);

      case 'get_packages':
        return await getPackages(parameters);

      case 'get_extra_services':
        return await getExtraServices(parameters);

      case 'get_roof_analysis':
        return await getRoofAnalysis(parameters);

      case 'request_contact_details':
        return await requestContactDetails(parameters);

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error: any) {
    console.error(`❌ Tool execution error (${toolName}):`, error);
    return { error: error.message || 'Tool execution failed' };
  }
}

async function requestContactDetails(params: {
  reason: string;
  systemDetails?: string;
}) {
  // This tool signals to the frontend to show the lead capture form
  return {
    action: 'SHOW_LEAD_FORM',
    reason: params.reason,
    systemDetails: params.systemDetails,
    message: 'Lead form should be displayed to collect contact details',
  };
}

// ============================================================================
// INDIVIDUAL TOOL FUNCTIONS
// ============================================================================

async function getCustomerQuote(leadId?: string) {
  if (!leadId) {
    return { error: 'Lead ID required' };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      CustomerQuote: {
        include: {
          quoteItems: true,
        },
      },
    },
  });

  if (!lead || !lead.CustomerQuote) {
    return { error: 'Quote not found for this customer' };
  }

  const quote = lead.CustomerQuote;

  return {
    quoteReference: quote.quoteReference,
    status: quote.status,
    systemSpecs: {
      solarSizeKw: lead.systemSizeKw,
      batterySizeKwh: lead.batterySizeKwh,
      panelCount: lead.panelCount,
      inverterSize: lead.inverterSizeKw,
    },
    pricing: {
      subtotal: quote.subtotal,
      totalRebates: quote.totalRebates,
      totalCostAfterRebates: quote.totalCostAfterRebates,
      depositAmount: quote.depositAmount,
      depositPaid: lead.depositPaid,
    },
    savings: {
      estimatedAnnualSavings: quote.estimatedAnnualSavings,
      paybackPeriodYears: quote.paybackPeriodYears,
      twentyFiveYearSavings: quote.twentyFiveYearSavings,
    },
    quoteItems: quote.quoteItems.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    createdAt: quote.createdAt,
    validUntil: quote.validUntil,
  };
}

async function getInstallationStatus(leadId?: string) {
  if (!leadId) {
    return { error: 'Lead ID required' };
  }

  const job = await prisma.installationJob.findFirst({
    where: { leadId },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
      lead: {
        select: {
          name: true,
          address: true,
          systemSizeKw: true,
          batterySizeKwh: true,
        },
      },
    },
  });

  if (!job) {
    return { error: 'No installation job found for this customer' };
  }

  return {
    jobNumber: job.jobNumber,
    status: job.status,
    scheduledDate: job.scheduledDate,
    completedDate: job.completedDate,
    team: job.team ? {
      name: job.team.name,
      members: job.team.members.map((m: any) => ({
        name: m.user.name,
        phone: m.user.phone,
      })),
    } : null,
    systemDetails: {
      solarSizeKw: job.lead.systemSizeKw,
      batterySizeKwh: job.lead.batterySizeKwh,
      address: job.lead.address,
    },
    notes: job.notes,
  };
}

async function calculateInstantQuote(params: {
  systemSizeKw: number;
  batterySizeKwh: number;
  postcode: string;
  quarterlyBill: number;
}) {
  try {
    // Call the unified calculator directly (no HTTP request needed)
    const { calculateUnifiedQuote } = await import('@/lib/unified-quote-calculator');
    
    const quote = await calculateUnifiedQuote({
      systemSizeKw: params.systemSizeKw,
      batterySizeKwh: params.batterySizeKwh || 0,
      postcode: params.postcode || '6000',
      region: 'WA',
      includeInstallation: true,
      installationMethod: 'allin',
      useConservativePricing: true,
      dailyConsumptionKwh: (params.quarterlyBill * 4) / 365 / 0.28, // Estimate from bill
    });
    
    if (!quote) {
      return { error: 'Failed to calculate quote' };
    }
  
  return {
    systemSpecs: {
      solarSizeKw: quote.systemSizeKw,
      batterySizeKwh: quote.batterySizeKwh,
      panelCount: quote.panelCount,
      panelBrand: quote.selectedPanel?.manufacturer || 'Premium',
      panelModel: quote.selectedPanel?.name || 'Solar Panel',
      inverterBrand: quote.selectedInverter?.manufacturer || 'Premium',
      inverterModel: quote.selectedInverter?.name || 'Inverter',
      batteryBrand: quote.selectedBattery?.manufacturer || null,
      batteryModel: quote.selectedBattery?.name || null,
    },
    costs: {
      panelCost: quote.costs.panelCost,
      inverterCost: quote.costs.inverterCost,
      batteryCost: quote.costs.batteryCost,
      installationCost: quote.costs.installationCost,
      subtotal: quote.costs.subtotal,
      totalRebates: quote.rebates.total,
      totalAfterRebates: quote.totalAfterRebates,
      gst: quote.gst,
      finalPrice: quote.finalPrice,
    },
    rebates: {
      federalSolar: quote.rebates.federalSolar,
      federalBattery: quote.rebates.federalBattery,
      stateBattery: quote.rebates.stateBattery,
      total: quote.rebates.total,
    },
    profit: {
      commission: quote.profit.grossProfit,
      margin: quote.profit.profitMargin,
    },
    savings: quote.savings || {
      annualSavings: 0,
      monthlySavings: 0,
      paybackYears: 0,
    },
  };
  } catch (error: any) {
    console.error('❌ calculateInstantQuote error:', error);
    return { 
      error: 'Failed to calculate quote: ' + (error.message || 'Unknown error'),
      details: error.stack 
    };
  }
}

async function getAvailableRebates(params: {
  systemSizeKw?: number;
  batterySizeKwh?: number;
  postcode?: string;
}) {
  const rebates = await prisma.rebateConfig.findMany({
    where: { active: true },
    orderBy: { type: 'asc' },
  });

  // Get zone rating if postcode provided
  let zoneRating = null;
  if (params.postcode) {
    const postcodeInt = parseInt(params.postcode);
    const zone = await prisma.postcodeZoneRating.findFirst({
      where: {
        postcodeStart: { lte: postcodeInt },
        postcodeEnd: { gte: postcodeInt },
      },
    });
    zoneRating = zone?.zoneRating || 1.382; // Default Perth zone
  }

  const rebateDetails = rebates.map((rebate: any) => {
    let estimatedAmount = null;

    // Calculate estimated rebate if system specs provided
    if (params.systemSizeKw && rebate.type === 'STC') {
      const stcPrice = 38; // Current STC price
      const deemingPeriod = 9; // Years
      estimatedAmount = params.systemSizeKw * (zoneRating || 1.382) * deemingPeriod * stcPrice;
    }

    if (params.batterySizeKwh && rebate.type === 'BATTERY_FEDERAL') {
      estimatedAmount = params.batterySizeKwh * 0.9 * 330; // $330/kWh usable
    }

    if (params.batterySizeKwh && rebate.type === 'BATTERY_STATE') {
      estimatedAmount = rebate.value; // Fixed amount
    }

    return {
      name: rebate.name,
      type: rebate.type,
      description: rebate.description,
      calculationType: rebate.calculationType,
      value: rebate.value,
      maxAmount: rebate.maxAmount,
      eligibilityCriteria: rebate.eligibilityCriteria,
      estimatedAmount: estimatedAmount ? Math.round(estimatedAmount) : null,
    };
  });

  return {
    rebates: rebateDetails,
    totalEstimated: rebateDetails.reduce((sum, r) => sum + (r.estimatedAmount || 0), 0),
    zoneRating: zoneRating,
  };
}

async function getProductDetails(params: {
  productType: 'panel' | 'inverter' | 'battery';
  brand?: string;
  minPower?: number;
}) {
  // Map chatbot product type to database enum
  const productTypeMap: Record<string, string> = {
    'panel': 'PANEL',
    'inverter': 'INVERTER',
    'battery': 'BATTERY',
  };

  const dbProductType = productTypeMap[params.productType];

  // Fetch from unified Product table with supplier info
  const products = await prisma.product.findMany({
    where: {
      productType: dbProductType,
      isAvailable: true,
      ...(params.brand && { 
        manufacturer: { 
          contains: params.brand, 
          mode: 'insensitive' 
        } 
      }),
    },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        orderBy: { unitCost: 'asc' },
        take: 1,
        include: { supplier: true },
      },
    },
    orderBy: [
      { tier: 'desc' }, // Tier 1 first
      { isRecommended: 'desc' },
    ],
    take: 10,
  });

  // Format response based on product type
  if (params.productType === 'panel') {
    return {
      productType: 'Solar Panels',
      count: products.length,
      products: products.map((p) => ({
        manufacturer: p.manufacturer,
        model: p.name,
        sku: p.sku,
        wattage: p.specifications?.wattage || 'N/A',
        efficiency: p.specifications?.efficiency || 'N/A',
        warranty: `${p.warrantyYears} years`,
        tier: p.tier,
        price: p.SupplierProduct[0]?.unitCost || 0,
        supplier: p.SupplierProduct[0]?.supplier.name || 'N/A',
        inStock: p.SupplierProduct[0]?.stockStatus === 'IN_STOCK',
      })),
    };
  }

  if (params.productType === 'inverter') {
    return {
      productType: 'Inverters',
      count: products.length,
      products: products.map((p) => ({
        manufacturer: p.manufacturer,
        model: p.name,
        sku: p.sku,
        capacity: p.specifications?.capacity || 'N/A',
        type: p.specifications?.type || 'N/A',
        phases: p.specifications?.phases || 'N/A',
        warranty: `${p.warrantyYears} years`,
        tier: p.tier,
        price: p.SupplierProduct[0]?.unitCost || 0,
        supplier: p.SupplierProduct[0]?.supplier.name || 'N/A',
        inStock: p.SupplierProduct[0]?.stockStatus === 'IN_STOCK',
      })),
    };
  }

  if (params.productType === 'battery') {
    return {
      productType: 'Batteries',
      count: products.length,
      products: products.map((p) => ({
        manufacturer: p.manufacturer,
        model: p.name,
        sku: p.sku,
        capacity: p.specifications?.capacity || 'N/A',
        usableCapacity: p.specifications?.usableCapacity || 'N/A',
        voltage: p.specifications?.voltage || 'N/A',
        warranty: `${p.warrantyYears} years`,
        tier: p.tier,
        price: p.SupplierProduct[0]?.unitCost || 0,
        supplier: p.SupplierProduct[0]?.supplier.name || 'N/A',
        inStock: p.SupplierProduct[0]?.stockStatus === 'IN_STOCK',
      })),
    };
  }

  return { error: 'Invalid product type' };
}

async function getInstallationCosts(params: { category?: string }) {
  const costs = await prisma.installationCostItem.findMany({
    where: {
      isActive: true,
      ...(params.category && { itemGroup: params.category }),
    },
    orderBy: [
      { itemGroup: 'asc' },
      { name: 'asc' },
    ],
  });

  const grouped = costs.reduce((acc: any, cost: any) => {
    const group = cost.itemGroup || 'OTHER';
    if (!acc[group]) acc[group] = [];
    acc[group].push({
      name: cost.name,
      code: cost.code,
      baseRate: cost.baseRate,
      category: cost.category,
      description: cost.description,
      unit: cost.unit,
    });
    return acc;
  }, {});

  return {
    costsByCategory: grouped,
    totalItems: costs.length,
  };
}

async function calculateROIPayback(params: {
  systemCost: number;
  annualSavings: number;
  systemSizeKw: number;
}) {
  const paybackYears = params.systemCost / params.annualSavings;
  const twentyFiveYearSavings = (params.annualSavings * 25) - params.systemCost;
  const roi = (twentyFiveYearSavings / params.systemCost) * 100;

  // Calculate with electricity price escalation (3.5% per year)
  let cumulativeSavings = 0;
  let adjustedPaybackYears = 0;
  let currentAnnualSavings = params.annualSavings;

  for (let year = 1; year <= 25; year++) {
    cumulativeSavings += currentAnnualSavings;
    currentAnnualSavings *= 1.035; // 3.5% increase

    if (adjustedPaybackYears === 0 && cumulativeSavings >= params.systemCost) {
      adjustedPaybackYears = year;
    }
  }

  return {
    simplePayback: {
      years: Math.round(paybackYears * 10) / 10,
      months: Math.round(paybackYears * 12),
    },
    adjustedPayback: {
      years: adjustedPaybackYears,
      note: 'Accounts for 3.5% annual electricity price increase',
    },
    returns: {
      twentyFiveYearSavings: Math.round(twentyFiveYearSavings),
      twentyFiveYearSavingsAdjusted: Math.round(cumulativeSavings - params.systemCost),
      roi: Math.round(roi),
      roiAdjusted: Math.round(((cumulativeSavings - params.systemCost) / params.systemCost) * 100),
    },
    annualProduction: {
      estimatedKwh: params.systemSizeKw * 4.5 * 365, // 4.5 sun hours/day in Perth
      firstYearValue: Math.round(params.annualSavings),
      year25Value: Math.round(currentAnnualSavings),
    },
  };
}

async function getPackages(params: {
  minSystemSize?: number;
  includeBattery?: boolean;
}) {
  const packages = await prisma.calculatorPackageTemplate.findMany({
    where: {
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
  });

  return {
    packages: packages.map((pkg: any) => ({
      name: pkg.displayName,
      description: pkg.description,
      solarCoverage: pkg.solarCoverage,
      batteryStrategy: pkg.batteryStrategy,
      profitMargin: pkg.profitMargin,
      badge: pkg.badge,
      features: pkg.features,
      recommended: pkg.isRecommended,
    })),
    totalPackages: packages.length,
  };
}

async function getRoofAnalysis(params: {
  address: string;
}) {
  try {
    // Call the solar analysis API (use correct port)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5123');
    
    const response = await fetch(`${baseUrl}/api/solar-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: params.address }),
    });

    if (!response.ok) {
      return {
        error: 'Unable to analyze roof at this address',
        message: 'We couldn\'t get roof data for this address. This might be due to limited satellite imagery or address not found.',
      };
    }

    const data = await response.json();

    if (!data || !data.analysis) {
      return {
        error: 'No roof data available',
        message: 'Roof analysis data is not available for this address.',
      };
    }

    const analysis = data.analysis;

    return {
      success: true,
      address: params.address,
      roofPhoto: {
        url: analysis.rgbUrl || null,
        provider: analysis.imageryProvider || 'google',
        quality: analysis.imageryQuality || 'unknown',
        date: analysis.imageryDate || null,
        ageInDays: analysis.imageryAgeInDays || null,
      },
      roofData: {
        maxArrayArea: analysis.maxArrayAreaMeters2 || 0,
        maxPanelCount: analysis.maxArrayPanelsCount || 0,
        maxSunshineHours: analysis.maxSunshineHoursPerYear || 0,
        panelCapacity: analysis.panelCapacityWatts || 400,
        confidenceLevel: analysis.confidenceLevel || 'unknown',
      },
      solarPotential: {
        estimatedSystemSize: Math.round((analysis.maxArrayPanelsCount || 0) * (analysis.panelCapacityWatts || 400) / 1000 * 10) / 10, // kW
        annualProduction: Math.round((analysis.maxSunshineHoursPerYear || 0) * (analysis.maxArrayPanelsCount || 0) * (analysis.panelCapacityWatts || 400) / 1000),
        usableRoofArea: Math.round(analysis.maxArrayAreaMeters2 || 0),
      },
      segments: analysis.roofSegments || [],
      message: 'Roof analysis complete! I can see your roof has good solar potential.',
    };
  } catch (error: any) {
    console.error('Roof analysis error:', error);
    return {
      error: 'Failed to analyze roof',
      message: 'There was an error analyzing the roof. Please try again or provide more details.',
    };
  }
}

async function getExtraServices(params: {
  serviceType?: string;
  searchTerm?: string;
}) {
  // Extra services are available - return information about service types
  const availableServices = [
    {
      type: 'roof_repairs',
      name: 'Roof Repairs',
      description: 'Professional roof repairs and restoration to ensure your roof is solar-ready',
      included: ['Tile replacement', 'Leak repairs', 'Roof restoration', 'Pre-solar inspection'],
    },
    {
      type: 'gutter_cleaning',
      name: 'Gutter Cleaning',
      description: 'Complete gutter cleaning and maintenance services',
      included: ['Gutter cleaning', 'Downpipe clearing', 'Gutter guard installation', 'Roof debris removal'],
    },
    {
      type: 'electrical',
      name: 'Electrical Services',
      description: 'Licensed electrical work for solar preparation',
      included: ['Switchboard upgrades', 'Meter box relocation', 'Electrical safety checks', 'Wiring upgrades'],
    },
    {
      type: 'security',
      name: 'Security Systems',
      description: 'Solar-powered security and monitoring systems',
      included: ['CCTV cameras', 'Motion sensors', 'Alarm systems', 'Smart home integration'],
    },
  ];

  // Filter by service type if specified
  let filtered = availableServices;
  if (params.serviceType && params.serviceType !== 'all') {
    filtered = availableServices.filter(s => s.type === params.serviceType);
  }

  // Filter by search term if specified
  if (params.searchTerm) {
    const term = params.searchTerm.toLowerCase();
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.description.toLowerCase().includes(term)
    );
  }

  return {
    services: filtered,
    totalServices: filtered.length,
    availableTypes: availableServices.map(s => s.type),
    message: 'We offer comprehensive extra services to complement your solar installation. Contact us for quotes and scheduling.',
  };
}