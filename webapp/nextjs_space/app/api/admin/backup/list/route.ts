import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * List available backups
 * GET /api/admin/backup/list
 */
export async function GET(request: NextRequest) {
  try {
    const backupDir = 'D:\\SPD\\backups\\database';
    
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({
        success: true,
        backups: [],
      });
    }
    
    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(f => f.startsWith('backup_') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          path: filePath,
          size: stats.size,
          sizeMB: (stats.size / 1024 / 1024).toFixed(2),
          created: stats.birthtime,
          modified: stats.mtime,
          compressed: file.endsWith('.gz'),
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    
    return NextResponse.json({
      success: true,
      backups,
      count: backups.length,
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
