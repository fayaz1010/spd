import { prisma } from './db';
import { generateMaterialList } from './material-list-generator';

/**
 * Auto-create material order when installation is ready
 * Uses hybrid approach: only creates when all approvals received
 */
export async function autoCreateMaterialOrder(jobId: string): Promise<any> {
  try {
    // Get job with all related data
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: {
          include: {
            CustomerQuote: true
          }
        },
        materialOrders: true
      }
    });

    if (!job) {
      throw new Error('Installation job not found');
    }

    // Check if material order already exists
    if (job.materialOrders && job.materialOrders.length > 0) {
      console.log('Material order already exists for job:', jobId);
      return job.materialOrders[0];
    }

    // Check if job is ready for installation
    if (job.status !== 'READY_TO_SCHEDULE') {
      console.log('Job not ready for installation yet:', job.status);
      return null;
    }

    // Get selected components from quote
    const selectedComponents = {
      panel: job.lead.CustomerQuote ? {
        id: job.lead.CustomerQuote.panelBrandId,
        brand: job.lead.CustomerQuote.panelBrand || job.lead.CustomerQuote.panelBrandName,
        model: job.lead.CustomerQuote.panelModel,
        manufacturer: job.lead.CustomerQuote.panelBrandName
      } : null,
      battery: job.lead.CustomerQuote && job.batterySizeKwh ? {
        id: job.lead.CustomerQuote.batteryBrandId,
        brand: job.lead.CustomerQuote.batteryBrand || job.lead.CustomerQuote.batteryBrandName,
        model: job.lead.CustomerQuote.batteryModel,
        manufacturer: job.lead.CustomerQuote.batteryBrandName
      } : null,
      inverter: job.lead.CustomerQuote ? {
        id: job.lead.CustomerQuote.inverterBrandId,
        brand: job.lead.CustomerQuote.inverterBrand || job.lead.CustomerQuote.inverterBrandName,
        model: job.lead.CustomerQuote.inverterModel,
        manufacturer: job.lead.CustomerQuote.inverterBrandName
      } : null
    };

    // Generate material list
    const materials = generateMaterialList({
      id: job.id,
      systemSize: job.systemSize,
      panelCount: job.panelCount,
      batteryCapacity: job.batterySizeKwh,
      inverterModel: job.inverterModel,
      selectedComponents
    });

    // Find default supplier (or first available supplier)
    const supplier = await prisma.supplier.findFirst({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    if (!supplier) {
      throw new Error('No active supplier found');
    }

    // Calculate totals
    const subtotal = calculateMaterialCost(materials);
    const tax = subtotal * 0.1; // 10% GST
    const total = subtotal + tax;

    // Generate PO number
    const poNumber = await generatePONumber();

    // Create material order
    const materialOrder = await prisma.materialOrder.create({
      data: {
        id: `mo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: job.id,
        poNumber,
        supplierId: supplier.id,
        items: materials as any,
        subtotal,
        tax,
        total,
        status: 'DRAFT',
        notes: 'Auto-generated when installation became ready to schedule',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create activity log
    await prisma.leadActivity.create({
      data: {
        leadId: job.leadId,
        type: 'material_order',
        description: `Material order ${poNumber} auto-created (DRAFT)`,
        createdBy: 'system',
        createdAt: new Date()
      }
    });

    console.log('Material order created:', materialOrder.id);
    return materialOrder;
  } catch (error) {
    console.error('Error auto-creating material order:', error);
    throw error;
  }
}

/**
 * Calculate total material cost
 */
function calculateMaterialCost(materials: any[]): number {
  // This is a simplified calculation
  // In production, you'd look up actual prices from supplier catalog
  let total = 0;
  
  for (const item of materials) {
    // Rough estimates - should be replaced with actual pricing
    let unitPrice = 0;
    
    switch (item.category) {
      case 'Panel':
        unitPrice = 150; // $150 per panel
        break;
      case 'Battery':
        unitPrice = 5000; // $5000 per battery
        break;
      case 'Inverter':
        unitPrice = 1500; // $1500 per inverter
        break;
      case 'Mounting':
        unitPrice = 50; // $50 per mounting item
        break;
      case 'Electrical':
        unitPrice = 20; // $20 per electrical item
        break;
      case 'Safety':
        unitPrice = 30; // $30 per safety item
        break;
      default:
        unitPrice = 10;
    }
    
    total += unitPrice * item.quantity;
  }
  
  return total;
}

/**
 * Generate unique PO number
 */
async function generatePONumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get count of orders this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const count = await prisma.materialOrder.count({
    where: {
      createdAt: {
        gte: startOfMonth
      }
    }
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `PO-${year}${month}-${sequence}`;
}

/**
 * Check if material order should be created for a job
 */
export async function shouldCreateMaterialOrder(jobId: string): Promise<boolean> {
  const job = await prisma.installationJob.findUnique({
    where: { id: jobId },
    include: {
      materialOrders: true
    }
  });

  if (!job) return false;
  
  // Don't create if already exists
  if (job.materialOrders && job.materialOrders.length > 0) return false;
  
  // Only create if ready to schedule
  if (job.status !== 'READY_TO_SCHEDULE') return false;
  
  return true;
}
