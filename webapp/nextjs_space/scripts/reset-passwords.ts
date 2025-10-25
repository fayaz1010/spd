import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPasswords() {
  console.log('🔐 Resetting passwords for all active electricians...\n');
  
  const hash = await bcrypt.hash('password123', 10);
  
  const result = await prisma.electrician.updateMany({
    where: {
      email: {
        in: [
          'john.smith@sundirectpower.com.au',
          'sarah.jones@sundirectpower.com.au',
          'mike.brown@contractor.com.au',
          'lisa.wilson@contractor.com.au',
        ]
      }
    },
    data: {
      portalPassword: hash,
      portalAccess: true,
      status: 'ACTIVE',
    }
  });
  
  console.log(`✅ Updated ${result.count} electricians`);
  console.log('   Password: password123');
  console.log('   Portal Access: ENABLED');
  console.log('   Status: ACTIVE\n');
  
  console.log('🔐 Test Credentials:');
  console.log('   john.smith@sundirectpower.com.au / password123');
  console.log('   sarah.jones@sundirectpower.com.au / password123');
  console.log('   mike.brown@contractor.com.au / password123');
  console.log('   lisa.wilson@contractor.com.au / password123\n');
  
  await prisma.$disconnect();
}

resetPasswords().catch(console.error);
