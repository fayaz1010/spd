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
  Briefcase,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  DollarSign,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdCopyGenerator } from '@/components/admin/AdCopyGenerator';

interface Position {
  id: string;
  positionCode: string;
  title: string;
  department: string;
  level: string;
  description: string;
  salaryType: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  superannuationRate: number;
  employmentType: string;
  workLocations: string[];
  benefits: any[];
  responsibilities: string[];
  essentialRequirements: string[];
  isActive: boolean;
  isPublic: boolean;
  _count: {
    teamMembers: number;
  };
}

export default function PositionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchPositions();
  }, [departmentFilter, levelFilter, statusFilter]);

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      
      if (departmentFilter !== 'all') params.append('department', departmentFilter);
      if (levelFilter !== 'all') params.append('level', levelFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);

      const response = await fetch(`/api/admin/positions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPositions(data.positions || []);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load positions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/positions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Position deleted successfully',
        });
        fetchPositions();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete position',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting position:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete position',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredPositions = positions.filter(position =>
    position.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    position.positionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    position.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSalaryRange = (position: Position) => {
    if (position.salaryType === 'hourly') {
      if (position.hourlyRateMin && position.hourlyRateMax) {
        return `$${position.hourlyRateMin}-${position.hourlyRateMax}/hr`;
      }
      return 'Not set';
    } else {
      if (position.annualSalaryMin && position.annualSalaryMax) {
        return `$${(position.annualSalaryMin / 1000).toFixed(0)}k-${(position.annualSalaryMax / 1000).toFixed(0)}k/yr`;
      }
      return 'Not set';
    }
  };

  const departments = Array.from(new Set(positions.map(p => p.department)));
  const levels = Array.from(new Set(positions.map(p => p.level)));

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
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Briefcase className="h-6 w-6" />
                  Position Templates
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage standardized roles and pay scales
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard/positions/new">
              <Button className="bg-coral hover:bg-coral-600">
                <Plus className="h-4 w-4 mr-2" />
                New Position
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Salary Range</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPositions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No positions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPositions.map((position) => (
                  <TableRow 
                    key={position.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/admin/dashboard/positions/${position.id}`)}
                  >
                    <TableCell className="font-mono text-sm">{position.positionCode}</TableCell>
                    <TableCell className="font-medium">{position.title}</TableCell>
                    <TableCell>{position.department}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{position.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="font-medium text-green-700">
                          {formatSalaryRange(position)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        + {position.superannuationRate}% super
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{position._count.teamMembers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {position.isActive ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {position.isPublic && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800">Public</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/dashboard/positions/${position.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}
                            onSelect={(e) => e.preventDefault()}
                          >
                            <AdCopyGenerator position={position} />
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(position.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Total Positions</div>
            <div className="text-2xl font-bold text-primary">{positions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Active Positions</div>
            <div className="text-2xl font-bold text-green-600">
              {positions.filter(p => p.isActive).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Total Staff Assigned</div>
            <div className="text-2xl font-bold text-blue-600">
              {positions.reduce((sum, p) => sum + p._count.teamMembers, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Public Positions</div>
            <div className="text-2xl font-bold text-purple-600">
              {positions.filter(p => p.isPublic).length}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this position? This action cannot be undone.
              Staff members assigned to this position will need to be reassigned.
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
    </div>
  );
}
