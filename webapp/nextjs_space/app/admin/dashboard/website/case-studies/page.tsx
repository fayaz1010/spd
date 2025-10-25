'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X, FileText, Star, Eye, EyeOff, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { AIGenerateButton } from '@/components/admin/AIGenerateButton';
import { toast } from 'sonner';
import Image from 'next/image';

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  customerName: string;
  location: string;
  systemSize: number;
  panelCount: number;
  batterySize?: number;
  description: string;
  challenge?: string;
  solution?: string;
  results?: string;
  featuredImage?: string;
  category: string;
  featured: boolean;
  isPublished: boolean;
  installDate?: string;
}

const CATEGORIES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'agricultural', label: 'Agricultural' },
];

export default function CaseStudiesManagementPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<CaseStudy | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    location: '',
    systemSize: 0,
    panelCount: 0,
    batterySize: 0,
    description: '',
    challenge: '',
    solution: '',
    results: '',
    featuredImage: '',
    category: 'residential',
    featured: false,
    isPublished: true,
    installDate: '',
    metaTitle: '',
    metaDescription: '',
  });

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      const response = await fetch('/api/admin/case-studies');
      const data = await response.json();

      if (data.success) {
        setCaseStudies(data.caseStudies);
      }
    } catch (error) {
      console.error('Error fetching case studies:', error);
      toast.error('Failed to load case studies');
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingStudy(null);
    setFormData({
      title: '',
      customerName: '',
      location: '',
      systemSize: 0,
      panelCount: 0,
      batterySize: 0,
      description: '',
      challenge: '',
      solution: '',
      results: '',
      featuredImage: '',
      category: 'residential',
      featured: false,
      isPublished: true,
      installDate: '',
      metaTitle: '',
      metaDescription: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (study: CaseStudy) => {
    setEditingStudy(study);
    setFormData({
      title: study.title,
      customerName: study.customerName,
      location: study.location,
      systemSize: study.systemSize,
      panelCount: study.panelCount,
      batterySize: study.batterySize || 0,
      description: study.description,
      challenge: study.challenge || '',
      solution: study.solution || '',
      results: study.results || '',
      featuredImage: study.featuredImage || '',
      category: study.category,
      featured: study.featured,
      isPublished: study.isPublished,
      installDate: study.installDate || '',
      metaTitle: '',
      metaDescription: '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.customerName.trim()) {
      toast.error('Title and customer name are required');
      return;
    }

    try {
      const payload = {
        ...formData,
        systemSize: parseFloat(formData.systemSize.toString()),
        panelCount: parseInt(formData.panelCount.toString()),
        batterySize: formData.batterySize ? parseFloat(formData.batterySize.toString()) : null,
      };

      const url = editingStudy
        ? `/api/admin/case-studies/${editingStudy.id}`
        : '/api/admin/case-studies';
      const method = editingStudy ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingStudy ? 'Case study updated' : 'Case study created');
        setIsDialogOpen(false);
        fetchCaseStudies();
      } else {
        toast.error(data.error || 'Failed to save case study');
      }
    } catch (error) {
      console.error('Error saving case study:', error);
      toast.error('Error saving case study');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this case study?')) return;

    try {
      const response = await fetch(`/api/admin/case-studies/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Case study deleted');
        fetchCaseStudies();
      }
    } catch (error) {
      console.error('Error deleting case study:', error);
      toast.error('Error deleting case study');
    }
  };

  const handleToggle = async (id: string, field: 'featured' | 'isPublished', value: boolean) => {
    try {
      const response = await fetch(`/api/admin/case-studies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !value }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Updated successfully');
        fetchCaseStudies();
      }
    } catch (error) {
      console.error('Error updating case study:', error);
      toast.error('Error updating case study');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <Link href="/admin/dashboard/website">
        <Button variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Website Management
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Case Studies</h1>
          <p className="text-gray-600">Showcase your successful installations</p>
        </div>
        <Button onClick={openAddDialog} className="bg-coral hover:bg-coral/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Case Study
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Studies</p>
                <p className="text-2xl font-bold">{caseStudies.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold">
                  {caseStudies.filter(s => s.isPublished).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold">
                  {caseStudies.filter(s => s.featured).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Capacity</p>
                <p className="text-2xl font-bold">
                  {caseStudies.reduce((sum, s) => sum + s.systemSize, 0).toFixed(1)}kW
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Studies Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Loading case studies...</p>
          </CardContent>
        </Card>
      ) : caseStudies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No case studies yet</p>
            <Button onClick={openAddDialog} className="mt-4">
              Create your first case study
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map((study) => (
            <Card key={study.id} className="overflow-hidden">
              {study.featuredImage && (
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={study.featuredImage}
                    alt={study.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg line-clamp-2">{study.title}</CardTitle>
                  <div className="flex gap-1">
                    {study.featured && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        <Star className="w-3 h-3" />
                      </Badge>
                    )}
                    {!study.isPublished && (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {study.customerName} • {study.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">System Size:</span>
                    <span className="font-medium">{study.systemSize}kW</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Panels:</span>
                    <span className="font-medium">{study.panelCount}</span>
                  </div>
                  {study.batterySize && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Battery:</span>
                      <span className="font-medium">{study.batterySize}kWh</span>
                    </div>
                  )}
                  <Badge variant="outline">{CATEGORIES.find(c => c.value === study.category)?.label}</Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(study.id, 'featured', study.featured)}
                    className="flex-1"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {study.featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(study.id, 'isPublished', study.isPublished)}
                    className="flex-1"
                  >
                    {study.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(study)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(study.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudy ? 'Edit Case Study' : 'Add New Case Study'}</DialogTitle>
            <DialogDescription>
              {editingStudy ? 'Update the case study details' : 'Create a new success story'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., 10kW Solar System in Perth"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Perth, WA"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="systemSize">System Size (kW) *</Label>
                <Input
                  id="systemSize"
                  type="number"
                  step="0.1"
                  value={formData.systemSize}
                  onChange={(e) => setFormData({ ...formData, systemSize: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="panelCount">Panel Count *</Label>
                <Input
                  id="panelCount"
                  type="number"
                  value={formData.panelCount}
                  onChange={(e) => setFormData({ ...formData, panelCount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="batterySize">Battery (kWh)</Label>
                <Input
                  id="batterySize"
                  type="number"
                  step="0.1"
                  value={formData.batterySize}
                  onChange={(e) => setFormData({ ...formData, batterySize: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief overview of the project..."
                rows={3}
              />
            </div>

            {/* AI Generate Button */}
            <div className="border-t pt-4">
              <AIGenerateButton
                type="case-study"
                onGenerated={(data) => {
                  setFormData({
                    ...formData,
                    title: data.title,
                    description: data.description,
                    challenge: data.challenge,
                    solution: data.solution,
                    results: data.results,
                  });
                  toast.success('Case study generated! Review and edit as needed.');
                }}
                buttonText="Generate Case Study with AI"
                buttonVariant="secondary"
              />
              <p className="text-sm text-gray-500 mt-2">
                Paste your project notes in the AI dialog to generate a professional case study
              </p>
            </div>

            <div>
              <Label htmlFor="challenge">Challenge</Label>
              <Textarea
                id="challenge"
                value={formData.challenge}
                onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                placeholder="What challenges did the customer face?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="solution">Solution</Label>
              <Textarea
                id="solution"
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                placeholder="How did you solve their problem?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="results">Results</Label>
              <Textarea
                id="results"
                value={formData.results}
                onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                placeholder="What were the outcomes and benefits?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="installDate">Install Date</Label>
                <Input
                  id="installDate"
                  type="date"
                  value={formData.installDate}
                  onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="featuredImage">Featured Image URL</Label>
              <Input
                id="featuredImage"
                value={formData.featuredImage}
                onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                />
                <Label htmlFor="isPublished">Publish</Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-coral hover:bg-coral/90">
                <Save className="w-4 h-4 mr-2" />
                {editingStudy ? 'Update' : 'Create'} Case Study
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
