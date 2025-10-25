const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    // Try to query the columns directly
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Team' 
      AND column_name IN ('solarInstallSpeed', 'batteryInstallSpeed')
      ORDER BY column_name;
    `;
    
    console.log('\n🔍 Checking Team table columns:\n');
    console.log(result);
    
    if (result.length === 0) {
      console.log('\n❌ Columns NOT FOUND in database!');
      console.log('\nRunning ALTER TABLE to add columns...\n');
      
      await prisma.$executeRaw`
        ALTER TABLE "Team" 
        ADD COLUMN IF NOT EXISTS "solarInstallSpeed" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "batteryInstallSpeed" DOUBLE PRECISION;
      `;
      
      console.log('✅ Columns added successfully!');
    } else {
      console.log('\n✅ Columns exist in database!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
