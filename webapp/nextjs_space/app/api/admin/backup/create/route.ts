import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Create backup (Git + Database)
 * POST /api/admin/backup/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'full', compress = true } = body;
    
    console.log(`Creating ${type} backup...`);
    
    const backupDir = 'D:\\SPD\\backups\\database';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const results: any = {
      timestamp,
      git: null,
      database: null,
    };
    
    // Git backup
    if (type === 'full' || type === 'git') {
      try {
        // Remove git lock file if it exists
        const gitLockPath = 'D:\\SPD\\.git\\index.lock';
        if (fs.existsSync(gitLockPath)) {
          fs.unlinkSync(gitLockPath);
          console.log('Removed stale git lock file');
        }
        
        const gitResult = await execAsync('git add . && git commit -m "Auto-backup" && git push origin main', {
          cwd: 'D:\\SPD',
        });
        results.git = {
          success: true,
          output: gitResult.stdout,
        };
      } catch (error: any) {
        // Git might fail if no changes
        results.git = {
          success: error.message.includes('nothing to commit'),
          output: error.stdout || error.message,
        };
      }
    }
    
    // Database backup - call pg_dump directly
    if (type === 'full' || type === 'database') {
      try {
        const backupFile = path.join(backupDir, `backup_sundirect_solar_${timestamp}.sql`);
        
        // Call pg_dump directly
        const pgDumpPath = 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe';
        const command = `"${pgDumpPath}" -h localhost -p 5433 -U postgres -d sundirect_solar -F p -f "${backupFile}"`;
        
        // Set password environment variable
        const env = { ...process.env, PGPASSWORD: 'postgres' };
        
        await execAsync(command, { env, cwd: 'D:\\SPD' });
        
        const stats = fs.statSync(backupFile);
        
        results.database = {
          success: true,
          file: backupFile,
          size: stats.size,
          sizeMB: (stats.size / 1024 / 1024).toFixed(2),
          compressed: false,
        };
        
        console.log(`Database backup created: ${backupFile} (${results.database.sizeMB} MB)`);
      } catch (error: any) {
        results.database = {
          success: false,
          error: error.message,
        };
      }
    }
    
    console.log('Backup complete:', results);
    
    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: error.message || 'Backup failed' },
      { status: 500 }
    );
  }
}
