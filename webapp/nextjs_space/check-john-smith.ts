/**
 * Check John Smith's Electrician Record
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking John Smith\'s credentials...\n');

  const electrician = await prisma.electrician.findFirst({
    where: {
      email: 'john.smith@sundirectpower.com.au',
    },
  });

  if (!electrician) {
    console.log('❌ No electrician found with email: john.smith@sundirectpower.com.au');
    return;
  }

  console.log('✅ Electrician found:');
  console.log(`   ID: ${electrician.id}`);
  console.log(`   Name: ${electrician.firstName} ${electrician.lastName}`);
  console.log(`   Email: ${electrician.email}`);
  console.log(`   Status: ${electrician.status}`);
  console.log(`   Portal Access: ${electrician.portalAccess}`);
  console.log(`   Has Portal Password: ${electrician.portalPassword ? 'YES' : 'NO'}`);
  
  if (electrician.portalPassword) {
    console.log(`   Password Hash (first 30 chars): ${electrician.portalPassword.substring(0, 30)}...`);
    
    // Test password
    const testPassword = 'Installer2025!';
    const isValid = await bcrypt.compare(testPassword, electrician.portalPassword);
    console.log(`\n🔐 Password Test:`);
    console.log(`   Testing password: ${testPassword}`);
    console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  }

  // Check team membership
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      email: 'john.smith@sundirectpower.com.au',
    },
    include: {
      team: true,
    },
  });

  if (teamMember) {
    console.log(`\n👥 Team Membership:`);
    console.log(`   Team: ${teamMember.team?.name || 'None'}`);
    console.log(`   Role: ${teamMember.role}`);
    console.log(`   Active: ${teamMember.isActive}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
