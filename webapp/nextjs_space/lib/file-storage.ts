/**
 * Local VPS File Storage Utility
 * Stores PDFs and photos on your Hostinger VPS
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Base upload directory on your VPS
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

export interface SaveFileOptions {
  jobId: string;
  fileName: string;
  buffer: Buffer;
  category: 'documents' | 'photos';
  subcategory?: string; // e.g., 'before', 'during', 'after' for photos
}

export interface FileMetadata {
  id: string;
  jobId: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: string;
  subcategory?: string;
  uploadedAt: Date;
}

/**
 * Save file to VPS storage
 */
export async function saveFile(options: SaveFileOptions): Promise<FileMetadata> {
  const { jobId, fileName, buffer, category, subcategory } = options;

  // Create directory structure: /uploads/jobs/JOB-001/documents/ or /photos/before/
  const jobDir = path.join(UPLOAD_BASE_DIR, 'jobs', jobId);
  const categoryDir = path.join(jobDir, category);
  const finalDir = subcategory ? path.join(categoryDir, subcategory) : categoryDir;

  // Ensure directory exists
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true });
  }

  // Sanitize filename
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = path.join(finalDir, sanitizedFileName);

  // Save file
  fs.writeFileSync(filePath, buffer);

  // Get file stats
  const stats = fs.statSync(filePath);

  // Determine MIME type
  const ext = path.extname(fileName).toLowerCase();
  const mimeType = getMimeType(ext);

  // Create relative path for URL
  const relativePath = path.relative(UPLOAD_BASE_DIR, filePath);
  const fileUrl = `/api/files/${relativePath.replace(/\\/g, '/')}`;

  // Save metadata to database
  const metadata: FileMetadata = {
    id: `file-${Date.now()}`,
    jobId,
    fileName: sanitizedFileName,
    filePath: relativePath,
    fileUrl,
    fileSize: stats.size,
    mimeType,
    category,
    subcategory,
    uploadedAt: new Date(),
  };

  return metadata;
}

/**
 * Get file from storage
 */
export function getFile(relativePath: string): Buffer | null {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    return fs.readFileSync(fullPath);
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

/**
 * Delete file from storage
 */
export function deleteFile(relativePath: string): boolean {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * List files for a job
 */
export function listJobFiles(jobId: string, category?: string): FileMetadata[] {
  try {
    const jobDir = path.join(UPLOAD_BASE_DIR, 'jobs', jobId);
    
    if (!fs.existsSync(jobDir)) {
      return [];
    }

    const files: FileMetadata[] = [];
    
    function scanDirectory(dir: string, cat: string, subcat?: string) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          scanDirectory(fullPath, cat, item);
        } else {
          const relativePath = path.relative(UPLOAD_BASE_DIR, fullPath);
          const ext = path.extname(item).toLowerCase();
          
          files.push({
            id: `file-${stats.mtimeMs}`,
            jobId,
            fileName: item,
            filePath: relativePath,
            fileUrl: `/api/files/${relativePath.replace(/\\/g, '/')}`,
            fileSize: stats.size,
            mimeType: getMimeType(ext),
            category: cat,
            subcategory: subcat,
            uploadedAt: stats.mtime,
          });
        }
      }
    }

    if (category) {
      const categoryDir = path.join(jobDir, category);
      if (fs.existsSync(categoryDir)) {
        scanDirectory(categoryDir, category);
      }
    } else {
      scanDirectory(jobDir, 'all');
    }

    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Get total storage used
 */
export function getStorageStats(): { totalSize: number; fileCount: number; jobCount: number } {
  try {
    let totalSize = 0;
    let fileCount = 0;
    const jobs = new Set<string>();

    function scanDirectory(dir: string) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          // Track job directories
          if (dir.includes('jobs')) {
            jobs.add(item);
          }
          scanDirectory(fullPath);
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
    }

    scanDirectory(UPLOAD_BASE_DIR);

    return {
      totalSize,
      fileCount,
      jobCount: jobs.size,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { totalSize: 0, fileCount: 0, jobCount: 0 };
  }
}

/**
 * Clean up old files (optional maintenance)
 */
export function cleanupOldFiles(daysOld: number = 365): number {
  try {
    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    function scanAndDelete(dir: string) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          scanAndDelete(fullPath);
          
          // Remove empty directories
          if (fs.readdirSync(fullPath).length === 0) {
            fs.rmdirSync(fullPath);
          }
        } else if (stats.mtime < cutoffDate) {
          fs.unlinkSync(fullPath);
          deletedCount++;
        }
      }
    }

    scanAndDelete(UPLOAD_BASE_DIR);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up files:', error);
    return 0;
  }
}

/**
 * Get MIME type from extension
 */
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.zip': 'application/zip',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
