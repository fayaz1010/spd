import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

/**
 * List available backups (Database + Git commits)
 * GET /api/admin/backup/list
 */
export async function GET(request: NextRequest) {
  try {
    const backupDir = 'D:\\SPD\\backups\\database';
    
    // Get database backups
    const databaseBackups = [];
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      databaseBackups.push(...files
        .filter(f => f.startsWith('backup_') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            type: 'database',
            name: file,
            path: filePath,
            size: stats.size,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2),
            created: stats.birthtime,
            modified: stats.mtime,
            compressed: file.endsWith('.gz'),
          };
        }));
    }
    
    // Get recent Git commits (last 10)
    const gitBackups = [];
    try {
      const { stdout } = await execAsync('git log -10 --pretty=format:"%H|%s|%ai|%an" --grep="Auto-backup"', {
        cwd: 'D:\\SPD',
      });
      
      if (stdout) {
        const commits = stdout.split('\n').filter(line => line.trim());
        commits.forEach(commit => {
          const [hash, message, date, author] = commit.split('|');
          gitBackups.push({
            type: 'git',
            name: `Git: ${message}`,
            hash: hash.substring(0, 7),
            fullHash: hash,
            message,
            author,
            created: new Date(date),
            modified: new Date(date),
          });
        });
      }
    } catch (gitError) {
      console.warn('Could not fetch Git commits:', gitError);
    }
    
    // Combine and sort by date
    const allBackups = [...databaseBackups, ...gitBackups]
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    
    const totalSize = databaseBackups.reduce((sum, b) => sum + b.size, 0);
    
    return NextResponse.json({
      success: true,
      backups: allBackups,
      databaseCount: databaseBackups.length,
      gitCount: gitBackups.length,
      totalCount: allBackups.length,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    });
  } catch (error: any) {
    console.error('List backups error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list backups' },
      { status: 500 }
    );
  }
}
