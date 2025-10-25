import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const suppliers = await prisma.supplier.count();
  const products = await prisma.supplierProduct.count();
  const panelBrands = await prisma.panelBrand.count();
  const batteryBrands = await prisma.batteryBrand.count();
  const inverterBrands = await prisma.inverterBrand.count();
  
  console.log('📊 Current Database State:');
  console.log('  Suppliers:', suppliers);
  console.log('  Supplier Products:', products);
  console.log('  Panel Brands:', panelBrands);
  console.log('  Battery Brands:', batteryBrands);
  console.log('  Inverter Brands:', inverterBrands);
  
  await prisma.$disconnect();
}

check().catch(console.error);
