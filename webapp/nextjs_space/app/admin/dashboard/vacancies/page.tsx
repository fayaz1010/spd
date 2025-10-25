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
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Vacancy {
  id: string;
  vacancyCode: string;
  status: string;
  openings: number;
  publishedAt: string | null;
  closingDate: string | null;
  startDate: string | null;
  customTitle: string | null;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  position: {
    id: string;
    positionCode: string;
    title: string;
    department: string;
    level: string;
    _count: {
      teamMembers: number;
    };
  };
  _count: {
    applications: number;
  };
}

export default function VacanciesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [filteredVacancies, setFilteredVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vacancyToDelete, setVacancyToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchVacancies();
  }, []);

  useEffect(() => {
    filterVacancies();
  }, [vacancies, searchTerm, statusFilter]);

  const fetchVacancies = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/vacancies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setVacancies(data.vacancies || []);
      }
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vacancies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVacancies = () => {
    let filtered = [...vacancies];

    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.vacancyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.customTitle && v.customTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    setFilteredVacancies(filtered);
  };

  const handleDelete = async () => {
    if (!vacancyToDelete) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/vacancies/${vacancyToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Vacancy deleted successfully',
        });
        fetchVacancies();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete vacancy',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete vacancy',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setVacancyToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-yellow-100 text-yellow-800',
      FILLED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Briefcase className="h-8 w-8" />
              Vacancies
            </h1>
            <p className="text-gray-600">Manage job vacancies and openings</p>
          </div>
        </div>
        <Link href="/admin/dashboard/vacancies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Vacancy
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">Total Vacancies</div>
          <div className="text-2xl font-bold">{vacancies.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">Published</div>
          <div className="text-2xl font-bold text-green-600">
            {vacancies.filter(v => v.status === 'PUBLISHED').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">Total Applications</div>
          <div className="text-2xl font-bold text-blue-600">
            {vacancies.reduce((sum, v) => sum + v._count.applications, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">Positions w/ No Staff</div>
          <div className="text-2xl font-bold text-orange-600">
            {vacancies.filter(v => v.position._count.teamMembers === 0).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">Filled</div>
          <div className="text-2xl font-bold text-purple-600">
            {vacancies.filter(v => v.status === 'FILLED').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by vacancy code or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="FILLED">Filled</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vacancies Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vacancy Code</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Openings</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Closing Date</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVacancies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No vacancies found
                </TableCell>
              </TableRow>
            ) : (
              filteredVacancies.map((vacancy) => (
                <TableRow key={vacancy.id}>
                  <TableCell className="font-medium">{vacancy.vacancyCode}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {vacancy.customTitle || vacancy.position.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {vacancy.position.positionCode} • {vacancy.position.department}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${vacancy.position._count.teamMembers === 0 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                        >
                          {vacancy.position._count.teamMembers} staff
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(vacancy.status)}</TableCell>
                  <TableCell>{vacancy.openings}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{vacancy._count.applications}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {vacancy.closingDate
                      ? format(new Date(vacancy.closingDate), 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {vacancy.publishedAt
                      ? format(new Date(vacancy.publishedAt), 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
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
                          onClick={() => router.push(`/admin/dashboard/vacancies/${vacancy.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/dashboard/applications?vacancyId=${vacancy.id}`)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Applications ({vacancy._count.applications})
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setVacancyToDelete(vacancy.id);
                            setDeleteDialogOpen(true);
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vacancy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vacancy? This action cannot be undone.
              Vacancies with applications cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
