/**
 * Reset John Smith's Password
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Resetting John Smith\'s password...\n');

  const password = 'Installer2025!';
  console.log(`Setting password to: ${password}`);
  
  // Hash the password with bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(`Generated hash (first 30 chars): ${hashedPassword.substring(0, 30)}...\n`);

  // Update the electrician record
  const electrician = await prisma.electrician.update({
    where: {
      email: 'john.smith@sundirectpower.com.au',
    },
    data: {
      portalPassword: hashedPassword,
      portalAccess: true,
      status: 'ACTIVE',
      updatedAt: new Date(),
    },
  });

  console.log('✅ Password updated successfully!');
  console.log(`   Email: ${electrician.email}`);
  console.log(`   Portal Access: ${electrician.portalAccess}`);
  console.log(`   Status: ${electrician.status}\n`);

  // Test the password immediately
  console.log('🧪 Testing password...');
  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ PASSWORD RESET COMPLETE!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n🔐 LOGIN CREDENTIALS:');
  console.log('   URL: http://localhost:5123/installer');
  console.log('   Email: john.smith@sundirectpower.com.au');
  console.log('   Password: Installer2025!');
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
