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
    
    // Database backup - use PowerShell script
    if (type === 'full' || type === 'database') {
      try {
        // Use the simple PowerShell backup script (no emojis for Node.js compatibility)
        const scriptPath = 'D:\\SPD\\scripts\\database-backup-simple.ps1';
        const command = compress 
          ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Compress`
          : `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`;
        
        const dbResult = await execAsync(command, {
          cwd: 'D:\\SPD',
        });
        
        // Find the most recent backup file
        const files = fs.readdirSync(backupDir)
          .filter(f => f.startsWith('backup_sundirect_solar_'))
          .map(f => ({
            name: f,
            path: path.join(backupDir, f),
            time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
          }))
          .sort((a, b) => b.time - a.time);
        
        if (files.length > 0) {
          const latestBackup = files[0];
          const stats = fs.statSync(latestBackup.path);
          
          results.database = {
            success: true,
            file: latestBackup.path,
            size: stats.size,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2),
            compressed: latestBackup.name.endsWith('.gz'),
          };
        } else {
          throw new Error('No backup file created');
        }
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
