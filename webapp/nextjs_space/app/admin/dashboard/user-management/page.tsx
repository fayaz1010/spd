'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  ArrowLeft,
  Search,
  Key,
  Trash2,
  Lock,
  Unlock,
  UserPlus,
  RefreshCw,
  Download,
  Edit,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: 'Admin' | 'Customer' | 'TeamMember' | 'Subcontractor' | 'Electrician';
  status: string;
  createdAt: string;
  lastLogin?: string;
  company?: string;
  position?: string;
  role?: string;
}

interface UserCounts {
  total: number;
  admins: number;
  customers: number;
  teamMembers: number;
  subcontractors: number;
  electricians: number;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [counts, setCounts] = useState<UserCounts>({
    total: 0,
    admins: 0,
    customers: 0,
    teamMembers: 0,
    subcontractors: 0,
    electricians: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserType, setNewUserType] = useState<'Admin' | 'Customer' | 'TeamMember' | 'Subcontractor'>('Customer');
  const [creating, setCreating] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    company: '',
    role: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [typeFilter]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const res = await fetch(`/api/admin/all-users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setCounts(data.counts || {});
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) =>
        user.status.toLowerCase().includes(statusFilter.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const fetchAvailableUsers = async (type: string) => {
    setLoadingAvailable(true);
    try {
      const res = await fetch(`/api/admin/all-users/available?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    fetchAvailableUsers(newUserType);
  };

  const handleUserTypeChange = (type: any) => {
    setNewUserType(type);
    setSelectedUserId('');
    fetchAvailableUsers(type);
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUserId(userId);
    const selected = availableUsers.find(u => u.id === userId);
    if (selected) {
      setFormData({
        ...formData,
        name: selected.name,
        email: selected.email,
        phone: selected.phone || '',
        company: selected.companyName || '',
        role: selected.role || selected.position || '',
      });
    }
  };

  const createUser = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/all-users/create-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          userType: newUserType,
          password: formData.password,
        }),
      });

      if (res.ok) {
        toast.success('Login credentials created successfully');
        setShowCreateModal(false);
        setSelectedUserId('');
        setFormData({ name: '', email: '', phone: '', password: '', company: '', role: '' });
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create login');
      }
    } catch (error) {
      toast.error('Failed to create login');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      company: user.company || '',
      role: user.position || '',
    });
    setShowEditModal(true);
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/admin/all-users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userType: editingUser.type,
        }),
      });

      if (res.ok) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error('Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const resetPassword = async (userId: string, userType: string) => {
    const newPassword = prompt('Enter new password (min 8 characters):');
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword, userType }),
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

  const toggleUserStatus = async (userId: string, userType: string, currentStatus: string) => {
    const newStatus = currentStatus.toLowerCase().includes('active') ? 'Inactive' : 'Active';
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, userType }),
      });

      if (res.ok) {
        toast.success(`User ${newStatus.toLowerCase()}`);
        fetchUsers();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteUser = async (userId: string, userType: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}?type=${userType}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const exportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Type', 'Status', 'Created', 'Company', 'Position'].join(','),
      ...filteredUsers.map(u => [
        u.name,
        u.email,
        u.phone || '',
        u.type,
        u.status,
        new Date(u.createdAt).toLocaleDateString(),
        u.company || '',
        u.position || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Users exported successfully');
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('confirmed')) return 'default';
    if (s.includes('inactive') || s.includes('archived')) return 'secondary';
    if (s.includes('pending')) return 'outline';
    return 'secondary';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Admin': return 'destructive';
      case 'TeamMember': return 'default';
      case 'Customer': return 'outline';
      case 'Subcontractor': return 'secondary';
      case 'Electrician': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!mounted || !dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
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
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all users across the system
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openCreateModal}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create Login
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{counts.total}</div>
            <p className="text-xs text-gray-500">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{counts.admins}</div>
            <p className="text-xs text-gray-500">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{counts.customers}</div>
            <p className="text-xs text-gray-500">Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{counts.teamMembers}</div>
            <p className="text-xs text-gray-500">Team Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{counts.subcontractors}</div>
            <p className="text-xs text-gray-500">Subcontractors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{counts.electricians}</div>
            <p className="text-xs text-gray-500">Electricians</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Admin">Admins</SelectItem>
                <SelectItem value="Customer">Customers</SelectItem>
                <SelectItem value="TeamMember">Team Members</SelectItem>
                <SelectItem value="Subcontractor">Subcontractors</SelectItem>
                <SelectItem value="Electrician">Electricians</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={`${user.type}-${user.id}`}>
                    <TableCell className="font-medium">
                      {user.name}
                      {user.company && (
                        <div className="text-xs text-gray-500">{user.company}</div>
                      )}
                      {user.position && (
                        <div className="text-xs text-gray-500">{user.position}</div>
                      )}
                    </TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(user.type)}>{user.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(user.status)}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      {formatDate(user.lastLogin)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(user)}
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.type === 'Admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetPassword(user.id, user.type)}
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(user.id, user.type, user.status)}
                          title={user.status.toLowerCase().includes('active') ? 'Deactivate' : 'Activate'}
                        >
                          {user.status.toLowerCase().includes('active') ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteUser(user.id, user.type, user.name)}
                          title="Delete User"
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create Login Credentials</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Select an existing user and create login credentials for them
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">User Type *</label>
                <Select value={newUserType} onValueChange={handleUserTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="TeamMember">Team Member</SelectItem>
                    <SelectItem value="Subcontractor">Subcontractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Select User *</label>
                <Select value={selectedUserId} onValueChange={handleUserSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAvailable ? "Loading..." : "Choose a user"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.length === 0 ? (
                      <SelectItem value="none" disabled>No users available</SelectItem>
                    ) : (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Only showing {newUserType === 'Customer' ? 'customers' : newUserType === 'TeamMember' ? 'team members' : 'subcontractors'} without login credentials
                </p>
              </div>

              {selectedUserId && (
                <>
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-sm font-medium">Selected User:</p>
                    <p className="text-sm">{formData.name}</p>
                    <p className="text-sm text-gray-600">{formData.email}</p>
                    {formData.phone && <p className="text-sm text-gray-600">{formData.phone}</p>}
                    {formData.company && <p className="text-sm text-gray-600">{formData.company}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Password *</label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min 8 characters"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={createUser} disabled={creating} className="flex-1">
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit User</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="font-medium">{editingUser.type}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {editingUser.type === 'Subcontractor' && (
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              )}

              {editingUser.type === 'TeamMember' && (
                <div>
                  <label className="text-sm font-medium">Role/Position</label>
                  <Input
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={updateUser} className="flex-1">
                  Update User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
