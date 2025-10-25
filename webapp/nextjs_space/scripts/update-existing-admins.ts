import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingAdmins() {
  try {
    console.log('🔄 Updating existing admin accounts...\n');

    // Get all admins
    const admins = await prisma.admin.findMany();
    
    console.log(`Found ${admins.length} admin(s)\n`);

    for (const admin of admins) {
      console.log(`Updating: ${admin.email}`);
      
      // Update with new fields
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          role: 'ADMIN', // Set all existing admins to ADMIN role
          permissions: [], // Empty permissions array
          isActive: true,
          updatedAt: new Date(),
        },
      });
      
      console.log(`✅ Updated ${admin.email}`);
    }

    console.log('\n✅ All admins updated successfully!');
    console.log('\nCurrent admins:');
    
    const updated = await prisma.admin.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
    
    updated.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.name}) - Role: ${admin.role}, Active: ${admin.isActive}`);
    });

  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingAdmins();
