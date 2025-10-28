'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  GitBranch, 
  Download, 
  RefreshCw, 
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw
} from 'lucide-react';

interface Backup {
  type: 'database' | 'git';
  name: string;
  path?: string;
  hash?: string;
  fullHash?: string;
  message?: string;
  author?: string;
  size?: number;
  sizeMB?: string;
  created: string;
  modified: string;
  compressed?: boolean;
}

export function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState('0');
  const [lastBackup, setLastBackup] = useState<Backup | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/backup/list');
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups);
        setTotalSize(data.totalSizeMB);
        setLastBackup(data.backups[0] || null);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (type: 'full' | 'git' | 'database') => {
    try {
      setCreating(true);
      const response = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, compress: true }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Backup created successfully!\n\nGit: ${data.git?.success ? '✓' : '✗'}\nDatabase: ${data.database?.success ? '✓' : '✗'}`);
        loadBackups();
      } else {
        alert('Backup failed: ' + data.error);
      }
    } catch (error: any) {
      alert('Backup failed: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backup: Backup) => {
    const confirmMessage = backup.type === 'git'
      ? `Restore Git commit "${backup.message}"?\n\nThis will reset your code to commit ${backup.hash}.\n\nWARNING: Any uncommitted changes will be lost!`
      : `Restore database backup "${backup.name}"?\n\nWARNING: Current database will be replaced!`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      setRestoring(backup.type === 'git' ? backup.fullHash! : backup.path!);
      
      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: backup.type,
          path: backup.path,
          hash: backup.fullHash,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Restore successful!\n\n${data.message}${data.warning ? '\n\n' + data.warning : ''}`);
        if (backup.type === 'git') {
          alert('Page will reload to reflect restored code...');
          window.location.reload();
        }
      } else {
        alert('Restore failed: ' + data.error);
      }
    } catch (error: any) {
      alert('Restore failed: ' + error.message);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup & Restore
        </CardTitle>
        <CardDescription>
          Manage system backups and restore data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              Last Backup
            </div>
            <div className="text-2xl font-bold">
              {lastBackup ? new Date(lastBackup.modified).toLocaleDateString() : 'Never'}
            </div>
            <div className="text-xs text-muted-foreground">
              {lastBackup ? new Date(lastBackup.modified).toLocaleTimeString() : ''}
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <HardDrive className="h-4 w-4" />
              Total Backups
            </div>
            <div className="text-2xl font-bold">{backups.length}</div>
            <div className="text-xs text-muted-foreground">{totalSize} MB</div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4" />
              Status
            </div>
            <div className="text-2xl font-bold">
              {backups.length > 0 ? (
                <Badge variant="default" className="text-sm">Protected</Badge>
              ) : (
                <Badge variant="destructive" className="text-sm">No Backups</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <h4 className="font-semibold">Create Backup</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => createBackup('full')}
              disabled={creating}
              className="w-full"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Full Backup
            </Button>
            
            <Button
              onClick={() => createBackup('git')}
              disabled={creating}
              variant="outline"
              className="w-full"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Git Only
            </Button>
            
            <Button
              onClick={() => createBackup('database')}
              disabled={creating}
              variant="outline"
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              Database Only
            </Button>
          </div>
        </div>

        {/* Recent Backups */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Recent Backups</h4>
            <Button
              onClick={loadBackups}
              disabled={loading}
              variant="ghost"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No backups found</p>
                <p className="text-sm">Create your first backup above</p>
              </div>
            ) : (
              backups.slice(0, 10).map((backup) => (
                <div
                  key={backup.type === 'git' ? backup.fullHash : backup.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {backup.type === 'git' ? (
                        <GitBranch className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Database className="h-4 w-4 text-green-500" />
                      )}
                      <div className="font-medium text-sm">{backup.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(backup.modified).toLocaleString()}
                      {backup.author && ` • ${backup.author}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {backup.type === 'database' && backup.sizeMB && (
                      <Badge variant="secondary" className="text-xs">
                        {backup.sizeMB} MB
                      </Badge>
                    )}
                    {backup.type === 'git' && backup.hash && (
                      <Badge variant="outline" className="text-xs">
                        {backup.hash}
                      </Badge>
                    )}
                    {backup.compressed && (
                      <Badge variant="outline" className="text-xs">
                        Compressed
                      </Badge>
                    )}
                    <Button
                      onClick={() => restoreBackup(backup)}
                      disabled={restoring !== null}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      {restoring === (backup.type === 'git' ? backup.fullHash : backup.path) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
          <h4 className="font-semibold">Backup Information</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Full backup includes Git repository and database</li>
            <li>• Backups are stored locally in D:\SPD\backups\database\</li>
            <li>• Git backups are pushed to GitHub automatically</li>
            <li>• Database backups are compressed to save space</li>
            <li>• Old backups (30+ days) are automatically cleaned up</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
