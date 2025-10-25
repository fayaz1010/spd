import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAddonPrices() {
  try {
    console.log('Checking addon prices...\n');
    
    const addons = await prisma.addonPricing.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    console.log(`Found ${addons.length} addons:\n`);

    addons.forEach((addon, index) => {
      console.log(`${index + 1}. ${addon.name}`);
      console.log(`   ID: ${addon.addonId}`);
      console.log(`   Cost: $${addon.cost}`);
      console.log(`   Active: ${addon.active}`);
      console.log(`   Category: ${addon.category}`);
      console.log('');
    });

    if (addons.length === 0) {
      console.log('⚠️  No addons found in database!');
      console.log('You need to add addon products through the admin panel or seed data.');
    } else {
      const withoutPrices = addons.filter(a => !a.cost || a.cost === 0);
      if (withoutPrices.length > 0) {
        console.log(`⚠️  ${withoutPrices.length} addons have no price set:`);
        withoutPrices.forEach(a => console.log(`   - ${a.name}`));
      }
    }

  } catch (error) {
    console.error('Error checking addon prices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAddonPrices();
