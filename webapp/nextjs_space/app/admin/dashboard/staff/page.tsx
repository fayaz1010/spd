'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  UserX,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  hourlyRate?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  Team: {
    id: string;
    name: string;
    color: string;
  } | null;
  position: {
    id: string;
    title: string;
    positionCode: string;
    department: string;
  } | null;
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
}

export default function StaffManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [accountAction, setAccountAction] = useState<{ staffId: string; action: 'create' | 'delete' } | null>(null);

  useEffect(() => {
    fetchTeams();
    fetchStaff();
  }, [teamFilter, statusFilter, searchQuery]);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      
      if (teamFilter !== 'all') params.append('teamId', teamFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/staff?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }

      const data = await response.json();
      setStaff(data.staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete staff member');
      }

      toast({
        title: 'Success',
        description: 'Staff member deleted successfully',
      });

      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete staff member',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCreateAccount = async (staffId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/staff/${staffId}/account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountRole: 'TEAM_MEMBER',
          permissions: ['view_assigned_jobs', 'update_job_status'],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      const data = await response.json();

      toast({
        title: 'Account Created',
        description: `Temporary password: ${data.account.tempPassword}`,
      });

      fetchStaff();
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: 'Error',
        description: 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setAccountAction(null);
    }
  };

  const handleDeleteAccount = async (staffId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/staff/${staffId}/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast({
        title: 'Success',
        description: 'Account deleted successfully',
      });

      fetchStaff();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setAccountAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-primary flex items-center">
                  <Users className="h-6 w-6 mr-2" />
                  Staff Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage team members and their accounts
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard/staff/new">
              <Button className="bg-coral hover:bg-coral-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Staff</p>
            <p className="text-2xl font-bold">{staff.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {staff.filter(s => s.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">With Accounts</p>
            <p className="text-2xl font-bold text-blue-600">
              {staff.filter(s => s.user).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Inactive</p>
            <p className="text-2xl font-bold text-gray-600">
              {staff.filter(s => !s.isActive).length}
            </p>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((member) => (
                  <TableRow 
                    key={member.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/admin/dashboard/staff/${member.id}`)}
                  >
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>
                      {member.Team ? (
                        <Badge
                          style={{ backgroundColor: member.Team.color + '20', color: member.Team.color }}
                        >
                          {member.Team.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">No Team</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.position ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{member.position.title}</span>
                          <span className="text-xs text-gray-500">{member.position.positionCode}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">{member.role || 'No Position'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.hourlyRate ? (
                        <span className="font-mono text-sm font-medium text-green-700">
                          ${member.hourlyRate.toFixed(2)}/hr
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.user ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          No Account
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/dashboard/staff/${member.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/dashboard/staff/${member.id}/certifications`)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            View Certifications
                          </DropdownMenuItem>
                          {!member.user ? (
                            <DropdownMenuItem
                              onClick={() => setAccountAction({ staffId: member.id, action: 'create' })}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Create Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setAccountAction({ staffId: member.id, action: 'delete' })}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Delete Account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(member.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this staff member and their account (if exists).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Account Action Dialog */}
      <AlertDialog open={!!accountAction} onOpenChange={() => setAccountAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accountAction?.action === 'create' ? 'Create Account?' : 'Delete Account?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accountAction?.action === 'create'
                ? 'This will create a user account for this staff member with a temporary password.'
                : 'This will delete the user account for this staff member. They will no longer be able to login.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (accountAction) {
                  if (accountAction.action === 'create') {
                    handleCreateAccount(accountAction.staffId);
                  } else {
                    handleDeleteAccount(accountAction.staffId);
                  }
                }
              }}
            >
              {accountAction?.action === 'create' ? 'Create Account' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
