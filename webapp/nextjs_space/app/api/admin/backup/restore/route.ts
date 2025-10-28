import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Restore backup (Database or Git)
 * POST /api/admin/backup/restore
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, path: backupPath, hash } = body;
    
    console.log(`Restoring ${type} backup...`);
    
    if (type === 'database') {
      // Restore database from SQL file
      if (!backupPath || !fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }
      
      // Drop and recreate database, then restore
      const psqlPath = 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe';
      
      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: 'postgres' };
      
      console.log('Dropping existing database...');
      await execAsync(
        `"${psqlPath}" -h localhost -p 5433 -U postgres -d postgres -c "DROP DATABASE IF EXISTS sundirect_solar;"`,
        { env }
      );
      
      console.log('Creating new database...');
      await execAsync(
        `"${psqlPath}" -h localhost -p 5433 -U postgres -d postgres -c "CREATE DATABASE sundirect_solar;"`,
        { env }
      );
      
      console.log('Restoring database from backup...');
      await execAsync(
        `"${psqlPath}" -h localhost -p 5433 -U postgres -d sundirect_solar -f "${backupPath}"`,
        { env }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Database restored successfully',
        restored: backupPath,
      });
      
    } else if (type === 'git') {
      // Restore Git commit
      if (!hash) {
        throw new Error('Git commit hash required');
      }
      
      console.log(`Resetting to commit ${hash}...`);
      
      // Remove git lock file if it exists
      const gitLockPath = 'D:\\SPD\\.git\\index.lock';
      if (fs.existsSync(gitLockPath)) {
        fs.unlinkSync(gitLockPath);
      }
      
      // Hard reset to the specified commit
      await execAsync(`git reset --hard ${hash}`, {
        cwd: 'D:\\SPD',
      });
      
      // Force push to remote (optional - commented out for safety)
      // await execAsync(`git push origin main --force`, {
      //   cwd: 'D:\\SPD',
      // });
      
      return NextResponse.json({
        success: true,
        message: 'Git repository restored successfully',
        restored: hash,
        warning: 'Remote repository not updated. Run "git push origin main --force" manually if needed.',
      });
      
    } else {
      throw new Error('Invalid backup type');
    }
    
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to restore backup' 
      },
      { status: 500 }
    );
  }
}
