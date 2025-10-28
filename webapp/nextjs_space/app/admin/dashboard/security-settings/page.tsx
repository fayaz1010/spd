'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Shield,
  Users,
  Database,
  Key,
  Clock,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowLeft,
  GitBranch,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Admin {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLogin?: string;
  role: string;
}

interface AllUser {
  id: string;
  name: string;
  email: string;
  type: 'Admin' | 'Customer' | 'TeamMember' | 'Subcontractor' | 'Electrician';
  status: string;
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  company?: string;
}

interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  type: 'manual' | 'automatic';
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', name: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adminsRes, backupsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/backup/list'),
      ]);

      console.log('Admins response:', adminsRes.status, adminsRes.ok);
      
      if (adminsRes.ok) {
        const adminsData = await adminsRes.json();
        console.log('Admins data:', adminsData);
        setAdmins(adminsData.admins || []);
      } else {
        const error = await adminsRes.text();
        console.error('Failed to fetch admins:', adminsRes.status, error);
        toast.error('Failed to load admin users');
      }

      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData.backups || []);
      } else {
        console.warn('Failed to fetch backups:', backupsRes.status);
        // Don't show error for backups - might not exist yet
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password) {
      toast.error('Email and password are required');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });

      if (res.ok) {
        toast.success('Admin user created successfully');
        setNewAdmin({ email: '', password: '', name: '' });
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create admin');
      }
    } catch (error) {
      toast.error('Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  const deleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin user?')) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Admin deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete admin');
      }
    } catch (error) {
      toast.error('Failed to delete admin');
    }
  };

  const resetPassword = async (id: string) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        toast.success('Password reset successfully');
      } else {
        toast.error('Failed to reset password');
      }
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const createBackup = async (type: 'full' | 'database' | 'git' = 'full') => {
    setCreatingBackup(true);
    try {
      const loadingToast = toast.loading(`Creating ${type} backup...`);
      const res = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      toast.dismiss(loadingToast);
      if (res.ok) {
        const data = await res.json();
        let message = 'Backup created successfully!';
        if (data.git?.success) message += ' Git: ✓';
        if (data.database?.success) message += ` Database: ✓ (${data.database.sizeMB}MB)`;
        toast.success(message);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create backup');
      }
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const downloadBackup = (filename: string) => {
    window.open(`/api/admin/backup/download?filename=${filename}`, '_blank');
  };

  const restoreBackup = async (filename: string) => {
    if (!confirm('⚠️ WARNING: This will restore the database to this backup. All current data will be replaced. Are you sure?')) {
      return;
    }

    try {
      toast.loading('Restoring backup...');
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      toast.dismiss();
      if (res.ok) {
        toast.success('Backup restored successfully');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error('Failed to restore backup');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to restore backup');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-red-600" />
              Security Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage users, backups, and security policies
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin Users
          </TabsTrigger>
          <TabsTrigger value="all-users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="backups" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Backups
          </TabsTrigger>
          <TabsTrigger value="passwords" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create New Admin */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Admin User
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <Input
                    placeholder="Name"
                    type="text"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  />
                  <Button onClick={createAdmin} disabled={creating}>
                    {creating ? 'Creating...' : 'Create Admin'}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  ⚠️ Note: Customer users are created automatically when they generate quotes.
                </p>
              </div>

              {/* Admin List */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : admins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No admin users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Badge>{admin.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {admin.lastLogin
                            ? new Date(admin.lastLogin).toLocaleString()
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resetPassword(admin.id)}
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteAdmin(admin.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Backup & Restore</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => createBackup('git')} 
                    disabled={creatingBackup}
                    variant="outline"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Git Backup
                  </Button>
                  <Button 
                    onClick={() => createBackup('database')} 
                    disabled={creatingBackup}
                    variant="outline"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Database Only
                  </Button>
                  <Button 
                    onClick={() => createBackup('full')} 
                    disabled={creatingBackup}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Full Backup (Git + DB)
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                <strong>Git Backup:</strong> Commits and pushes code to repository | 
                <strong> Database:</strong> Creates SQL backup file | 
                <strong> Full:</strong> Both Git and Database
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : backups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No backups found
                      </TableCell>
                    </TableRow>
                  ) : (
                    backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-mono text-sm">
                          {backup.filename}
                        </TableCell>
                        <TableCell>{formatBytes(backup.size)}</TableCell>
                        <TableCell>
                          <Badge variant={backup.type === 'automatic' ? 'default' : 'secondary'}>
                            {backup.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(backup.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadBackup(backup.filename)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => restoreBackup(backup.filename)}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Policies Tab */}
        <TabsContent value="passwords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Minimum Password Length</p>
                    <p className="text-sm text-gray-500">Require at least 8 characters</p>
                  </div>
                  <Badge>8 characters</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Password Expiry</p>
                    <p className="text-sm text-gray-500">Force password change after 90 days</p>
                  </div>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Session management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
