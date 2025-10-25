
/**
 * Auto Order Generation Service
 * 
 * Automatically generates material orders for installation jobs
 * by selecting optimal suppliers and grouping items by supplier.
 */

import { prisma } from './db';
import { selectSupplierForProduct } from './supplier-selection-v2';
import { generateMaterialList, type MaterialItem } from './material-list-generator';

export interface OrderGenerationResult {
  success: boolean;
  orders: any[];
  errors: string[];
  summary: {
    totalOrders: number;
    totalCost: number;
    supplierBreakdown: {
      supplierId: string;
      supplierName: string;
      itemCount: number;
      subtotal: number;
    }[];
  };
}

/**
 * Auto-generate material orders for an installation job
 */
export async function autoGenerateOrders(
  jobId: string
): Promise<OrderGenerationResult> {
  const errors: string[] = [];
  const orders: any[] = [];

  try {
    // Fetch job with full details
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: true,
      },
    });

    if (!job) {
      return {
        success: false,
        orders: [],
        errors: ['Job not found'],
        summary: {
          totalOrders: 0,
          totalCost: 0,
          supplierBreakdown: [],
        },
      };
    }

    // Generate material list
    const materials = generateMaterialList(job);

    if (materials.length === 0) {
      errors.push('No materials found for this job');
      return {
        success: false,
        orders: [],
        errors,
        summary: {
          totalOrders: 0,
          totalCost: 0,
          supplierBreakdown: [],
        },
      };
    }

    // Select best suppliers for each material
    const materialWithSuppliers: Array<{
      material: MaterialItem;
      supplierSelection: any;
      supplierCost: number;
    }> = [];

    for (const material of materials) {
      let supplierSelection = null;

      // Select supplier based on product ID (new unified Product table)
      const productId = material.panelBrandId || material.batteryBrandId || material.inverterBrandId;
      
      if (productId) {
        supplierSelection = await selectSupplierForProduct(productId);
      }

      if (supplierSelection) {
        materialWithSuppliers.push({
          material,
          supplierSelection,
          supplierCost: supplierSelection.selectedSupplier.supplierCost,
        });
      } else {
        // Only error for main components (panel/battery/inverter)
        if (productId) {
          errors.push(
            `No supplier found for ${material.category}: ${material.brand} ${material.model}`
          );
        }
        // For accessories/mounting, we'll skip them for now
      }
    }

    if (materialWithSuppliers.length === 0) {
      return {
        success: false,
        orders: [],
        errors: ['No suppliers available for any materials'],
        summary: {
          totalOrders: 0,
          totalCost: 0,
          supplierBreakdown: [],
        },
      };
    }

    // Group materials by supplier
    const supplierGroups = new Map<
      string,
      {
        supplierId: string;
        supplierName: string;
        items: Array<{
          material: MaterialItem;
          supplierCost: number;
          totalCost: number;
        }>;
      }
    >();

    for (const item of materialWithSuppliers) {
      const supplierId = item.supplierSelection.selectedSupplier.supplierId;
      const supplierName = item.supplierSelection.selectedSupplier.supplierName;

      if (!supplierGroups.has(supplierId)) {
        supplierGroups.set(supplierId, {
          supplierId,
          supplierName,
          items: [],
        });
      }

      const group = supplierGroups.get(supplierId)!;
      group.items.push({
        material: item.material,
        supplierCost: item.supplierCost,
        totalCost: item.supplierCost * item.material.quantity,
      });
    }

    // Create material orders (one per supplier)
    let totalCost = 0;
    const supplierBreakdown: any[] = [];

    for (const [supplierId, group] of supplierGroups) {
      const subtotal = group.items.reduce(
        (sum, item) => sum + item.totalCost,
        0
      );
      const tax = subtotal * 0.1; // 10% GST
      const total = subtotal + tax;

      totalCost += total;

      // Generate PO number
      const poNumber = await generatePONumber();

      // Prepare items JSON
      const itemsJson = group.items.map((item) => ({
        category: item.material.category,
        type: item.material.type,
        brand: item.material.brand,
        model: item.material.model,
        quantity: item.material.quantity,
        unit: item.material.unit,
        unitCost: item.supplierCost,
        totalCost: item.totalCost,
        notes: item.material.notes,
      }));

      // Create order
      const order = await prisma.materialOrder.create({
        data: {
          id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          jobId: jobId,
          supplierId: supplierId,
          poNumber: poNumber,
          items: itemsJson as any,
          subtotal: subtotal,
          tax: tax,
          total: total,
          status: 'DRAFT',
          notes: `Auto-generated order for Job ${job.jobNumber}`,
          updatedAt: new Date(),
        },
        include: {
          supplier: true,
        },
      });

      orders.push(order);

      supplierBreakdown.push({
        supplierId: supplierId,
        supplierName: group.supplierName,
        itemCount: group.items.length,
        subtotal: subtotal,
      });

      console.log(
        `✅ Created order ${poNumber} for supplier ${group.supplierName} - $${total.toFixed(2)}`
      );
    }

    // Update job status to indicate materials are being ordered
    await prisma.installationJob.update({
      where: { id: jobId },
      data: {
        status: 'MATERIALS_ORDERED',
      },
    });

    return {
      success: true,
      orders,
      errors,
      summary: {
        totalOrders: orders.length,
        totalCost,
        supplierBreakdown,
      },
    };
  } catch (error: any) {
    console.error('Error in autoGenerateOrders:', error);
    return {
      success: false,
      orders: [],
      errors: [error.message || 'Failed to generate orders'],
      summary: {
        totalOrders: 0,
        totalCost: 0,
        supplierBreakdown: [],
      },
    };
  }
}

/**
 * Generate unique PO number
 * Format: PO-YYYYMMDD-XXX
 */
async function generatePONumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Find highest PO number for today
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const todayOrders = await prisma.materialOrder.findMany({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: {
      poNumber: 'desc',
    },
    take: 1,
  });

  let sequence = 1;
  if (todayOrders.length > 0) {
    const lastPO = todayOrders[0].poNumber;
    const lastSequence = parseInt(lastPO.split('-')[2] || '0');
    sequence = lastSequence + 1;
  }

  return `PO-${dateStr}-${sequence.toString().padStart(3, '0')}`;
}
