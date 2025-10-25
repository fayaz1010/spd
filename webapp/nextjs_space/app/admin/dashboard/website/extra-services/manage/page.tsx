'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  Search,
  Eye,
  EyeOff,
  Star,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Service {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  imageUrl?: string;
  specifications: {
    addonCategory: string;
    serviceType: string;
    showOnWebsite: boolean;
    benefits: string[];
    iconName: string;
    duration: string;
    serviceArea: string;
  };
  isRecommended: boolean;
  isAvailable: boolean;
  sortOrder: number;
  retailPrice: number;
  installationCost: number;
  totalCost: number;
}

const SERVICE_TYPES = [
  { value: 'roof_gutter', label: 'Roof & Gutter' },
  { value: 'security', label: 'Security' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'general', label: 'General' },
];

const ICON_OPTIONS = [
  'Wrench', 'Shield', 'Zap', 'Wind', 'Droplet', 'Camera', 'Lock', 'Home'
];

export default function ManageExtraServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    description: '',
    imageUrl: '',
    serviceType: 'general',
    duration: '',
    serviceArea: 'Perth Metro',
    benefits: [''],
    iconName: 'Wrench',
    retailPrice: 0,
    installationCost: 0,
    isRecommended: false,
    isAvailable: true,
    showOnWebsite: true,
    sortOrder: 0,
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/extra-services');
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services);
      } else {
        toast.error('Failed to load services');
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Error loading services');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'services'); // Specify folder for service images

      // Use the public upload endpoint instead of admin (no auth required)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        setImagePreview(data.url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const openAddDialog = () => {
    setEditingService(null);
    setFormData({
      name: '',
      manufacturer: '',
      description: '',
      imageUrl: '',
      serviceType: 'general',
      duration: '',
      serviceArea: 'Perth Metro',
      benefits: [''],
      iconName: 'Wrench',
      retailPrice: 0,
      installationCost: 0,
      isRecommended: false,
      isAvailable: true,
      showOnWebsite: true,
      sortOrder: services.length,
    });
    setImagePreview('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      manufacturer: service.manufacturer,
      description: service.description || '',
      imageUrl: service.imageUrl || '',
      serviceType: service.specifications.serviceType,
      duration: service.specifications.duration,
      serviceArea: service.specifications.serviceArea,
      benefits: service.specifications.benefits.length > 0 ? service.specifications.benefits : [''],
      iconName: service.specifications.iconName,
      retailPrice: service.retailPrice,
      installationCost: service.installationCost,
      isRecommended: service.isRecommended,
      isAvailable: service.isAvailable,
      showOnWebsite: service.specifications.showOnWebsite,
      sortOrder: service.sortOrder,
    });
    setImagePreview(service.imageUrl || '');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (formData.retailPrice <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    try {
      const totalCost = formData.retailPrice + formData.installationCost;
      const filteredBenefits = formData.benefits.filter(b => b.trim() !== '');

      console.log('Form data imageUrl before save:', formData.imageUrl);
      console.log('Image preview:', imagePreview);

      const payload = {
        name: formData.name,
        manufacturer: formData.manufacturer || 'Sun Direct Power',
        description: formData.description,
        imageUrl: formData.imageUrl || null,
        productType: 'ADDON',
        specifications: {
          addonCategory: 'service',
          serviceType: formData.serviceType,
          showOnWebsite: formData.showOnWebsite,
          benefits: filteredBenefits,
          iconName: formData.iconName,
          duration: formData.duration,
          serviceArea: formData.serviceArea,
        },
        isRecommended: formData.isRecommended,
        isAvailable: formData.isAvailable,
        sortOrder: formData.sortOrder,
        retailPrice: formData.retailPrice,
        installationCost: formData.installationCost,
        totalCost: totalCost,
      };

      const url = editingService 
        ? `/api/admin/extra-services/${editingService.id}`
        : '/api/admin/extra-services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingService ? 'Service updated successfully' : 'Service created successfully');
        setIsDialogOpen(false);
        loadServices();
      } else {
        toast.error(data.error || 'Failed to save service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Error saving service');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/admin/extra-services/${serviceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Service deleted successfully');
        loadServices();
      } else {
        toast.error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error deleting service');
    }
  };

  const addBenefitField = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, ''],
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => i === index ? value : b),
    }));
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || service.specifications.serviceType === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: services.length,
    visible: services.filter(s => s.specifications.showOnWebsite).length,
    recommended: services.filter(s => s.isRecommended).length,
    available: services.filter(s => s.isAvailable).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Extra Services</h1>
          <p className="text-gray-600 mt-1">Add, edit, and manage your service offerings</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/dashboard/website/extra-services')}
          >
            <X className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Services</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.visible}</div>
            <div className="text-sm text-gray-600">Visible on Website</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.recommended}</div>
            <div className="text-sm text-gray-600">Recommended</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.available}</div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {SERVICE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <div className="space-y-4">
        {filteredServices.map(service => (
          <Card key={service.id}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {/* Image */}
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          {SERVICE_TYPES.find(t => t.value === service.specifications.serviceType)?.label}
                        </Badge>
                        {service.isRecommended && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                        {service.specifications.showOnWebsite && (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Visible
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/services/${service.id}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(service)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">${service.totalCost.toFixed(2)}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{service.specifications.duration}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{service.specifications.serviceArea}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredServices.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-gray-500">No services found</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Gutter Cleaning Service"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the service..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="iconName">Icon</Label>
                  <Select
                    value={formData.iconName}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, iconName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(icon => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Service Image</Label>
                <div className="mt-2 space-y-4">
                  {imagePreview && (
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="imageUrl" className="text-sm">Image URL (or upload below)</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, imageUrl: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      key={editingService?.id || 'new'}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="flex-1"
                    />
                    {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload an image (max 5MB) or paste an image URL above. Recommended size: 800x600px
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g., 2-4 hours"
                  />
                </div>

                <div>
                  <Label htmlFor="serviceArea">Service Area</Label>
                  <Input
                    id="serviceArea"
                    value={formData.serviceArea}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
                    placeholder="e.g., Perth Metro"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retailPrice">Service Price ($) *</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, retailPrice: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="installationCost">Installation Cost ($)</Label>
                  <Input
                    id="installationCost"
                    type="number"
                    value={formData.installationCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, installationCost: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Cost:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${(formData.retailPrice + formData.installationCost).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <Label>Benefits</Label>
                <div className="space-y-2 mt-2">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                        placeholder="Enter a benefit..."
                      />
                      {formData.benefits.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBenefit(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addBenefitField}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Benefit
                  </Button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show on Website</Label>
                    <p className="text-sm text-gray-500">Display this service on the public website</p>
                  </div>
                  <Switch
                    checked={formData.showOnWebsite}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnWebsite: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Recommended</Label>
                    <p className="text-sm text-gray-500">Mark as a recommended service</p>
                  </div>
                  <Switch
                    checked={formData.isRecommended}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecommended: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Available</Label>
                    <p className="text-sm text-gray-500">Service is currently available for booking</p>
                  </div>
                  <Switch
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                {editingService ? 'Update Service' : 'Create Service'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
