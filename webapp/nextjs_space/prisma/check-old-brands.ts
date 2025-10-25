import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Old Brand Tables...\n');
  
  const panelCount = await prisma.panelBrand.count();
  const batteryCount = await prisma.batteryBrand.count();
  const inverterCount = await prisma.inverterBrand.count();
  
  console.log('Old Brand Tables:');
  console.log(`  Panel Brands: ${panelCount}`);
  console.log(`  Battery Brands: ${batteryCount}`);
  console.log(`  Inverter Brands: ${inverterCount}`);
  
  if (panelCount === 0) {
    console.log('\n❌ OLD BRAND TABLES ARE EMPTY!');
    console.log('   The calculator is using panelBrand/batteryBrand/inverterBrand tables');
    console.log('   but we seeded data into Product/SupplierProduct tables.');
    console.log('\n   SOLUTION: Either:');
    console.log('   1. Seed the old brand tables, OR');
    console.log('   2. Update the calculator to use Product/SupplierProduct tables');
  }
}

main()
  .finally(() => prisma.$disconnect());
