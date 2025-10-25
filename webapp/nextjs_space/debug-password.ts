/**
 * Debug Password Hash Comparison
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Debugging password hash...\n');

  const electrician = await prisma.electrician.findFirst({
    where: {
      email: 'john.smith@sundirectpower.com.au',
    },
  });

  if (!electrician) {
    console.log('❌ Electrician not found');
    return;
  }

  console.log('Electrician:', electrician.email);
  console.log('Stored hash:', electrician.portalPassword);
  console.log('Hash length:', electrician.portalPassword?.length);
  console.log('');

  // Test various password variations
  const passwords = [
    'Installer2025!',
    'installer2025!',
    'INSTALLER2025!',
  ];

  for (const pwd of passwords) {
    console.log(`Testing: "${pwd}"`);
    if (electrician.portalPassword) {
      const result = await bcrypt.compare(pwd, electrician.portalPassword);
      console.log(`  Result: ${result ? '✅ MATCH' : '❌ NO MATCH'}`);
    }
  }

  console.log('\n🔧 Creating fresh hash for comparison...');
  const freshHash = await bcrypt.hash('Installer2025!', 10);
  console.log('Fresh hash:', freshHash);
  console.log('Fresh hash length:', freshHash.length);
  
  const freshTest = await bcrypt.compare('Installer2025!', freshHash);
  console.log('Fresh hash test:', freshTest ? '✅ WORKS' : '❌ BROKEN');

  console.log('\n🔄 Updating with fresh hash...');
  await prisma.electrician.update({
    where: { email: 'john.smith@sundirectpower.com.au' },
    data: { portalPassword: freshHash },
  });

  console.log('✅ Updated! Try logging in now.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
