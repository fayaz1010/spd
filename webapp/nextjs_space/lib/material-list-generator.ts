
interface JobWithComponents {
  id: string;
  systemSize: number;
  panelCount: number;
  batteryCapacity: number | null;
  inverterModel: string;
  selectedComponents: any;
}

export interface MaterialItem {
  category: string;
  type: string;
  brand: string;
  model: string;
  quantity: number;
  unit: string;
  notes?: string;
  // NEW: Brand IDs for FK lookup
  panelBrandId?: string;
  batteryBrandId?: string;
  inverterBrandId?: string;
}

export function generateMaterialList(job: JobWithComponents): MaterialItem[] {
  const materials: MaterialItem[] = [];
  const components = job.selectedComponents || {};

  // 1. Solar Panels
  if (components.panel) {
    materials.push({
      category: "Panel",
      type: "PV Module",
      brand: components.panel.manufacturer || components.panel.brand,
      model: components.panel.model || components.panel.name,
      quantity: job.panelCount,
      unit: "pcs",
      panelBrandId: components.panel.id, // NEW: Include brand ID for FK lookup
    });
  }

  // 2. Battery (if applicable)
  if (job.batteryCapacity && job.batteryCapacity > 0 && components.battery) {
    materials.push({
      category: "Battery",
      type: "Battery Storage",
      brand: components.battery.manufacturer || components.battery.brand,
      model: components.battery.model || components.battery.name,
      quantity: 1,
      unit: "unit",
      batteryBrandId: components.battery.id, // NEW: Include brand ID for FK lookup
    });
  }

  // 3. Inverter
  if (components.inverter) {
    materials.push({
      category: "Inverter",
      type: "Solar Inverter",
      brand: components.inverter.manufacturer || components.inverter.brand,
      model: components.inverter.model || components.inverter.name,
      quantity: 1,
      unit: "unit",
      inverterBrandId: components.inverter.id, // NEW: Include brand ID for FK lookup
    });
  }

  // 4. Mounting Hardware (calculated)
  const railLength = Math.ceil(job.panelCount / 3) * 3.3; // meters
  materials.push(
    {
      category: "Mounting",
      type: "Roof Rails",
      brand: "Standard",
      model: "Aluminum Rail",
      quantity: Math.ceil(railLength / 3.3),
      unit: "3.3m lengths",
    },
    {
      category: "Mounting",
      type: "Roof Brackets",
      brand: "Standard",
      model: "Tile Hook",
      quantity: Math.ceil(job.panelCount / 2),
      unit: "pcs",
      notes: "Adjust based on roof type survey",
    },
    {
      category: "Mounting",
      type: "Panel Clamps",
      brand: "Standard",
      model: "Mid/End Clamp Set",
      quantity: job.panelCount * 4,
      unit: "pcs",
    }
  );

  // 5. Electrical Components
  const cableLength = Math.ceil(job.systemSize * 8); // rough estimate
  materials.push(
    {
      category: "Electrical",
      type: "DC Cable",
      brand: "Standard",
      model: "6mm² PV Cable",
      quantity: cableLength,
      unit: "meters",
    },
    {
      category: "Electrical",
      type: "AC Cable",
      brand: "Standard",
      model: "4mm² TPS Cable",
      quantity: 20,
      unit: "meters",
    },
    {
      category: "Electrical",
      type: "DC Isolator",
      brand: "Standard",
      model: "1000V DC Switch",
      quantity: 1,
      unit: "unit",
    },
    {
      category: "Electrical",
      type: "AC Isolator",
      brand: "Standard",
      model: "2P 32A Switch",
      quantity: 1,
      unit: "unit",
    },
    {
      category: "Electrical",
      type: "MC4 Connectors",
      brand: "Standard",
      model: "MC4 Pair",
      quantity: job.panelCount * 2,
      unit: "pairs",
    }
  );

  // 6. Conduit & Protection
  materials.push(
    {
      category: "Protection",
      type: "PVC Conduit",
      brand: "Standard",
      model: "25mm Conduit",
      quantity: 30,
      unit: "meters",
    },
    {
      category: "Protection",
      type: "Cable Glands",
      brand: "Standard",
      model: "PG16 Glands",
      quantity: 10,
      unit: "pcs",
    }
  );

  return materials;
}

export type SupplierSelectionStrategy = "lowest_cost" | "highest_commission" | "balanced" | "fastest";

export async function findSupplierProducts(
  prisma: any,
  materials: MaterialItem[],
  strategy: SupplierSelectionStrategy = "balanced"
) {
  const groupedBySupplier: Record<string, any[]> = {};

  for (const material of materials) {
    let selectedSupplierProduct: any = null;

    // NEW: Try FK lookup first for Panel/Battery/Inverter
    if (material.panelBrandId || material.batteryBrandId || material.inverterBrandId) {
      const brandMappings = await prisma.brandSupplier.findMany({
        where: {
          AND: [
            {
              OR: [
                material.panelBrandId ? { panelBrandId: material.panelBrandId } : {},
                material.batteryBrandId ? { batteryBrandId: material.batteryBrandId } : {},
                material.inverterBrandId ? { inverterBrandId: material.inverterBrandId } : {},
              ],
            },
            { isActive: true },
          ],
        },
        include: {
          supplierProduct: {
            include: {
              supplier: true,
            },
          },
        },
        orderBy: [
          { isPrimary: "desc" }, // Primary suppliers first
          { supplierCost: "asc" }, // Then by cost
        ],
      });

      if (brandMappings.length > 0) {
        // Apply supplier selection strategy
        const selectedMapping = selectBestSupplier(brandMappings, strategy);
        if (selectedMapping && selectedMapping.supplierProduct) {
          selectedSupplierProduct = {
            ...selectedMapping.supplierProduct,
            mappingInfo: {
              supplierCost: selectedMapping.supplierCost,
              ourCommission: selectedMapping.ourCommission,
              commissionType: selectedMapping.commissionType,
              isPrimary: selectedMapping.isPrimary,
              leadTimeDays: selectedMapping.leadTimeDays,
            },
          };
        }
      }
    }

    // FALLBACK: Text-based search for non-branded items or when FK lookup fails
    if (!selectedSupplierProduct) {
      const products = await prisma.supplierProduct.findMany({
        where: {
          category: material.category,
          brand: material.brand,
          model: material.model,
          isActive: true,
        },
        include: {
          supplier: true,
        },
        orderBy: {
          unitCost: "asc", // Get cheapest first
        },
      });

      if (products.length > 0) {
        selectedSupplierProduct = products[0];
      }
    }

    // Add to grouped results
    if (selectedSupplierProduct) {
      const supplierId = selectedSupplierProduct.supplierId;

      if (!groupedBySupplier[supplierId]) {
        groupedBySupplier[supplierId] = [];
      }

      const mappingInfo = selectedSupplierProduct.mappingInfo;
      const unitCost = mappingInfo?.supplierCost || selectedSupplierProduct.unitCost;
      const commission = mappingInfo?.ourCommission || 0;

      groupedBySupplier[supplierId].push({
        productId: selectedSupplierProduct.id,
        sku: selectedSupplierProduct.sku,
        description: `${material.type} - ${material.brand} ${material.model}`,
        category: material.category,
        brand: material.brand,
        model: material.model,
        quantity: material.quantity,
        unit: material.unit,
        unitCost,
        total: unitCost * material.quantity,
        commission: commission * material.quantity,
        commissionType: mappingInfo?.commissionType,
        isPrimary: mappingInfo?.isPrimary || false,
        leadTimeDays: mappingInfo?.leadTimeDays || selectedSupplierProduct.leadTime,
        notes: material.notes,
      });
    } else {
      // Product not found, add to "Unknown" group
      if (!groupedBySupplier["unknown"]) {
        groupedBySupplier["unknown"] = [];
      }

      groupedBySupplier["unknown"].push({
        productId: null,
        sku: null,
        description: `${material.type} - ${material.brand} ${material.model}`,
        category: material.category,
        brand: material.brand,
        model: material.model,
        quantity: material.quantity,
        unit: material.unit,
        unitCost: 0,
        total: 0,
        commission: 0,
        notes: `${material.notes || ""} [NO SUPPLIER FOUND - MANUAL PRICING REQUIRED]`,
      });
    }
  }

  return groupedBySupplier;
}

// NEW: Intelligent supplier selection based on strategy
function selectBestSupplier(
  mappings: any[],
  strategy: SupplierSelectionStrategy
): any {
  if (mappings.length === 0) return null;
  if (mappings.length === 1) return mappings[0];

  // If there's a primary supplier, prefer it unless strategy dictates otherwise
  const primaryMapping = mappings.find((m) => m.isPrimary);

  switch (strategy) {
    case "lowest_cost":
      // Sort by supplier cost ascending
      return mappings.sort((a, b) => a.supplierCost - b.supplierCost)[0];

    case "highest_commission":
      // Sort by commission descending
      return mappings.sort((a, b) => {
        const commA =
          a.commissionType === "percentage"
            ? (a.supplierCost * a.ourCommission) / 100
            : a.ourCommission;
        const commB =
          b.commissionType === "percentage"
            ? (b.supplierCost * b.ourCommission) / 100
            : b.ourCommission;
        return commB - commA;
      })[0];

    case "fastest":
      // Sort by lead time ascending
      return mappings
        .filter((m) => m.leadTimeDays !== null)
        .sort((a, b) => (a.leadTimeDays || 999) - (b.leadTimeDays || 999))[0] || mappings[0];

    case "balanced":
    default:
      // Balanced: Prefer primary, then balance cost and commission
      if (primaryMapping) return primaryMapping;

      // Calculate a balanced score (lower is better)
      const scored = mappings.map((m) => {
        const commission =
          m.commissionType === "percentage"
            ? (m.supplierCost * m.ourCommission) / 100
            : m.ourCommission;
        const profitMargin = (commission / m.supplierCost) * 100;
        // Score favors lower cost but also higher profit margin
        const score = m.supplierCost * 0.7 - profitMargin * 10;
        return { mapping: m, score };
      });

      return scored.sort((a, b) => a.score - b.score)[0].mapping;
  }
}
