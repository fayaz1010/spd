'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  ArrowLeft,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ServiceArea {
  id: string;
  suburb: string;
  postcode: string;
  region: string;
  isActive: boolean;
  travelFee: number;
  notes: string | null;
  createdAt: string;
}

export default function ServiceAreasPage() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  
  const [formData, setFormData] = useState({
    suburb: '',
    postcode: '',
    region: 'Perth Metro',
    isActive: true,
    travelFee: 0,
    notes: '',
  });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const res = await fetch('/api/admin/service-areas');
      const data = await res.json();
      // Handle both array and object responses
      setAreas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching service areas:', error);
      toast.error('Failed to load service areas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingArea
        ? `/api/admin/service-areas/${editingArea.id}`
        : '/api/admin/service-areas';
      
      const method = editingArea ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingArea ? 'Area updated' : 'Area added');
        setShowAddDialog(false);
        setEditingArea(null);
        setFormData({
          suburb: '',
          postcode: '',
          region: 'Perth Metro',
          isActive: true,
          travelFee: 0,
          notes: '',
        });
        fetchAreas();
      } else {
        toast.error('Failed to save area');
      }
    } catch (error) {
      toast.error('Error saving area');
    }
  };

  const handleEdit = (area: ServiceArea) => {
    setEditingArea(area);
    setFormData({
      suburb: area.suburb,
      postcode: area.postcode,
      region: area.region,
      isActive: area.isActive,
      travelFee: area.travelFee,
      notes: area.notes || '',
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service area?')) return;

    try {
      const res = await fetch(`/api/admin/service-areas/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Area deleted');
        fetchAreas();
      } else {
        toast.error('Failed to delete area');
      }
    } catch (error) {
      toast.error('Error deleting area');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/service-areas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        toast.success('Status updated');
        fetchAreas();
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const stats = {
    total: areas.length,
    active: areas.filter(a => a.isActive).length,
    inactive: areas.filter(a => !a.isActive).length,
    withFee: areas.filter(a => a.travelFee > 0).length,
  };

  const regions = ['Perth Metro', 'Perth North', 'Perth South', 'Perth East', 'Fremantle', 'Joondalup', 'Mandurah'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/website">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Website
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Service Areas</h1>
            <p className="text-gray-600">Configure service coverage areas and travel fees</p>
          </div>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingArea(null);
            setFormData({
              suburb: '',
              postcode: '',
              region: 'Perth Metro',
              isActive: true,
              travelFee: 0,
              notes: '',
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Service Area
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingArea ? 'Edit Service Area' : 'Add Service Area'}</DialogTitle>
              <DialogDescription>
                Configure suburbs and postcodes where services are available
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Suburb *</Label>
                  <Input
                    value={formData.suburb}
                    onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                    placeholder="e.g., Perth"
                    required
                  />
                </div>
                <div>
                  <Label>Postcode *</Label>
                  <Input
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    placeholder="e.g., 6000"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Region</Label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Travel Fee ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.travelFee}
                  onChange={(e) => setFormData({ ...formData, travelFee: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Additional fee for this area (0 for no fee)</p>
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {editingArea ? 'Update' : 'Add'} Area
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingArea(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Areas</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-3xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Travel Fee</p>
                <p className="text-3xl font-bold text-orange-600">{stats.withFee}</p>
              </div>
              <MapPin className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Areas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Coverage Areas</CardTitle>
          <CardDescription>
            Manage suburbs and postcodes where extra services are available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : areas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No service areas configured yet. Add your first service area to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suburb</TableHead>
                  <TableHead>Postcode</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Travel Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.suburb}</TableCell>
                    <TableCell>{area.postcode}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{area.region}</Badge>
                    </TableCell>
                    <TableCell>
                      {area.travelFee > 0 ? (
                        <span className="text-orange-600 font-medium">
                          ${area.travelFee.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-500">No fee</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={area.isActive}
                          onCheckedChange={() => toggleActive(area.id, area.isActive)}
                        />
                        {area.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(area)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(area.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Service Area Configuration</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Add suburbs and postcodes where your extra services are available</li>
                <li>• Set travel fees for areas outside your primary service zone</li>
                <li>• Group areas by region for better organization</li>
                <li>• Toggle areas active/inactive without deleting them</li>
                <li>• Customers will only see services available in their area</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
