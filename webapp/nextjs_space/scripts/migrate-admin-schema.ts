import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAdminSchema() {
  try {
    console.log('🔄 Starting Admin schema migration...\n');

    // Get all existing admins
    const admins = await prisma.$queryRaw<any[]>`
      SELECT id, email, name, role, "createdAt" 
      FROM "Admin"
    `;

    console.log(`Found ${admins.length} existing admin(s)\n`);

    // Update each admin with new fields
    for (const admin of admins) {
      console.log(`Updating admin: ${admin.email}`);
      
      // Map old role to new enum
      let newRole = 'ADMIN';
      if (admin.role === 'super_admin') {
        newRole = 'SUPER_ADMIN';
      } else if (admin.role === 'admin') {
        newRole = 'ADMIN';
      }

      await prisma.$executeRaw`
        UPDATE "Admin"
        SET 
          role = ${newRole}::text::"UserRole",
          permissions = ARRAY[]::text[],
          "isActive" = true,
          "updatedAt" = NOW()
        WHERE id = ${admin.id}
      `;
      
      console.log(`✅ Updated ${admin.email} to role: ${newRole}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npx prisma db push');
    console.log('2. Test login with existing credentials');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateAdminSchema();
