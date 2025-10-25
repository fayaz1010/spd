import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Running database migration...\n');

    // Read SQL file
    const sqlPath = join(__dirname, 'prepare-admin-migration.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await prisma.$executeRawUnsafe(statement);
      console.log('✅ Done\n');
    }

    console.log('✅ Migration completed successfully!\n');
    
    // Verify the changes
    const admins = await prisma.$queryRaw<any[]>`
      SELECT id, email, name, role, "isActive", "updatedAt"
      FROM "Admin"
    `;
    
    console.log('Current admins:');
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.role})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
