const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetOtherLogins() {
  try {
    // Get your email (the one currently logged in)
    const currentUserEmail = 'fayaz@sundirectpower.com.au'; // Change this if needed
    
    // Reset lastLoginAt to NULL for all OTHER admins
    const result = await prisma.admin.updateMany({
      where: {
        email: {
          not: currentUserEmail
        }
      },
      data: {
        lastLoginAt: null,
      },
    });
    
    console.log(`✅ Reset lastLoginAt for ${result.count} admin users (excluding ${currentUserEmail})`);
    console.log('These users will show "Never" until they actually log in.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetOtherLogins();
