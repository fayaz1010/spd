'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Wrench, 
  ArrowLeft, 
  Save, 
  Loader2,
  Eye,
  EyeOff,
  Star,
  DollarSign,
  Search,
  Plus,
  Calendar,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
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

const SERVICE_TYPE_LABELS: Record<string, string> = {
  roof_gutter: 'Roof & Gutter',
  security: 'Security',
  electrical: 'Electrical',
  hvac: 'HVAC',
  general: 'General',
};

export default function ManageExtraServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

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

  const toggleShowOnWebsite = (serviceId: string) => {
    setServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          specifications: {
            ...service.specifications,
            showOnWebsite: !service.specifications.showOnWebsite,
          }
        };
      }
      return service;
    }));
  };

  const toggleRecommended = (serviceId: string) => {
    setServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          isRecommended: !service.isRecommended,
        };
      }
      return service;
    }));
  };

  const toggleAvailable = (serviceId: string) => {
    setServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          isAvailable: !service.isAvailable,
        };
      }
      return service;
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/extra-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Services updated successfully!');
      } else {
        toast.error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || service.specifications.serviceType === filterType;
    return matchesSearch && matchesType;
  });

  const serviceTypes = Array.from(new Set(services.map(s => s.specifications.serviceType)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Extra Services Management</h1>
            <p className="text-gray-600 mt-1">Manage service visibility and settings</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/admin/dashboard/website/extra-services/manage')}
              className="bg-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manage Services
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/dashboard/website/extra-services/bookings')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Service Bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/extra-services')}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Public Page
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Types</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>
                    {SERVICE_TYPE_LABELS[type] || type}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Services</div>
              <div className="text-2xl font-bold">{services.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Visible on Website</div>
              <div className="text-2xl font-bold text-green-600">
                {services.filter(s => s.specifications.showOnWebsite).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Recommended</div>
              <div className="text-2xl font-bold text-yellow-600">
                {services.filter(s => s.isRecommended).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Available</div>
              <div className="text-2xl font-bold text-blue-600">
                {services.filter(s => s.isAvailable).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredServices.map(service => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <Badge variant="outline">
                        {SERVICE_TYPE_LABELS[service.specifications.serviceType] || service.specifications.serviceType}
                      </Badge>
                      {service.isRecommended && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      {!service.isAvailable && (
                        <Badge variant="destructive">Unavailable</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-coral font-semibold">
                        <DollarSign className="w-4 h-4" />
                        ${service.totalCost.toLocaleString()}
                      </span>
                      <span className="text-gray-500">
                        Duration: {service.specifications.duration}
                      </span>
                      <span className="text-gray-500">
                        Area: {service.specifications.serviceArea}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 ml-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.specifications.showOnWebsite}
                        onCheckedChange={() => toggleShowOnWebsite(service.id)}
                      />
                      <div className="flex items-center gap-1">
                        {service.specifications.showOnWebsite ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium">Show on Website</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isRecommended}
                        onCheckedChange={() => toggleRecommended(service.id)}
                      />
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">Recommended</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isAvailable}
                        onCheckedChange={() => toggleAvailable(service.id)}
                      />
                      <span className="text-sm font-medium">Available</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No services found matching your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}
