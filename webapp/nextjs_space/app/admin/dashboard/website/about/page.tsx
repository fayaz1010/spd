'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Building2,
  Award,
  Upload,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  sortOrder: number;
}

interface Project {
  id: string;
  name: string;
  location: string;
  size: string;
  type: string;
  scope: string;
  sortOrder: number;
}

interface AboutSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  companyOverview: string;
  missionStatement: string;
  internationalExpansion: string;
}

export default function ManageAboutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'services' | 'projects'>('general');
  
  const [settings, setSettings] = useState<AboutSettings>({
    heroTitle: 'Powering a Sustainable Future',
    heroSubtitle: 'Western Australia\'s trusted partner in renewable energy',
    heroImage: '',
    companyOverview: '',
    missionStatement: '',
    internationalExpansion: '',
  });

  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/about');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings || settings);
        setServices(data.services || []);
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setSettings({ ...settings, heroImage: data.url });
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/about/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async (service: Service) => {
    try {
      const response = await fetch('/api/admin/about/services', {
        method: service.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Service ${service.id ? 'updated' : 'created'} successfully!`);
        loadData();
        setEditingService(null);
      } else {
        toast.error('Failed to save service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/admin/about/services/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Service deleted successfully!');
        loadData();
      } else {
        toast.error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const handleSaveProject = async (project: Project) => {
    try {
      const response = await fetch('/api/admin/about/projects', {
        method: project.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Project ${project.id ? 'updated' : 'created'} successfully!`);
        loadData();
        setEditingProject(null);
      } else {
        toast.error('Failed to save project');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`/api/admin/about/projects/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Project deleted successfully!');
        loadData();
      } else {
        toast.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/dashboard/website')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website Management
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage About Us Page</h1>
              <p className="text-gray-600 mt-1">Update company information, services, and projects</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('/about', '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Page
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'general'
                ? 'border-b-2 border-coral text-coral'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'services'
                ? 'border-b-2 border-coral text-coral'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'projects'
                ? 'border-b-2 border-coral text-coral'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Projects ({projects.length})
          </button>
        </div>

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hero Title
                  </label>
                  <Input
                    value={settings.heroTitle}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                    placeholder="Powering a Sustainable Future"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hero Subtitle
                  </label>
                  <Input
                    value={settings.heroSubtitle}
                    onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                    placeholder="Western Australia's trusted partner..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hero Image URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.heroImage}
                      onChange={(e) => setSettings({ ...settings, heroImage: e.target.value })}
                      placeholder="/images/hero-about.jpg"
                    />
                    <input
                      type="file"
                      id="hero-image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline"
                      onClick={() => document.getElementById('hero-image-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                  {settings.heroImage && (
                    <div className="mt-2">
                      <img 
                        src={settings.heroImage} 
                        alt="Hero preview" 
                        className="h-20 w-auto rounded border"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.companyOverview}
                  onChange={(e) => setSettings({ ...settings, companyOverview: e.target.value })}
                  rows={6}
                  placeholder="Sun Direct Power is a leading residential and commercial solar installation company..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mission Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.missionStatement}
                  onChange={(e) => setSettings({ ...settings, missionStatement: e.target.value })}
                  rows={6}
                  placeholder="At Sun Direct Power, our mission is to drive the global transition..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>International Expansion</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.internationalExpansion}
                  onChange={(e) => setSettings({ ...settings, internationalExpansion: e.target.value })}
                  rows={4}
                  placeholder="Sun Direct Power is currently expanding its operations internationally..."
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-coral hover:bg-coral/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => setEditingService({
                  id: '',
                  icon: 'Home',
                  title: '',
                  description: '',
                  sortOrder: services.length + 1,
                })}
                className="bg-coral hover:bg-coral/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>

            {editingService && (
              <Card className="border-coral">
                <CardHeader>
                  <CardTitle>{editingService.id ? 'Edit Service' : 'New Service'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icon Name
                      </label>
                      <Input
                        value={editingService.icon}
                        onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                        placeholder="Home, Building2, Zap, etc."
                      />
                      <p className="text-xs text-gray-500 mt-1">Lucide icon name</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort Order
                      </label>
                      <Input
                        type="number"
                        value={editingService.sortOrder}
                        onChange={(e) => setEditingService({ ...editingService, sortOrder: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <Input
                      value={editingService.title}
                      onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                      placeholder="Residential Solar Installation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={editingService.description}
                      onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                      rows={3}
                      placeholder="Tailored solar solutions for homeowners..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveService(editingService)}
                      className="bg-coral hover:bg-coral/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Service
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingService(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge>{service.icon}</Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingService(service)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{service.description}</p>
                    <p className="text-xs text-gray-400 mt-2">Order: {service.sortOrder}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => setEditingProject({
                  id: '',
                  name: '',
                  location: '',
                  size: '',
                  type: '',
                  scope: '',
                  sortOrder: projects.length + 1,
                })}
                className="bg-coral hover:bg-coral/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>

            {editingProject && (
              <Card className="border-coral">
                <CardHeader>
                  <CardTitle>{editingProject.id ? 'Edit Project' : 'New Project'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Name
                      </label>
                      <Input
                        value={editingProject.name}
                        onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                        placeholder="Armadale Emergency Care Facility"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <Input
                        value={editingProject.location}
                        onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                        placeholder="Armadale, Western Australia"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        System Size
                      </label>
                      <Input
                        value={editingProject.size}
                        onChange={(e) => setEditingProject({ ...editingProject, size: e.target.value })}
                        placeholder="500kW"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Type
                      </label>
                      <Input
                        value={editingProject.type}
                        onChange={(e) => setEditingProject({ ...editingProject, type: e.target.value })}
                        placeholder="Commercial PV System"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scope
                    </label>
                    <Textarea
                      value={editingProject.scope}
                      onChange={(e) => setEditingProject({ ...editingProject, scope: e.target.value })}
                      rows={2}
                      placeholder="Engineering, design, regulatory approval, installation, and commissioning"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort Order
                    </label>
                    <Input
                      type="number"
                      value={editingProject.sortOrder}
                      onChange={(e) => setEditingProject({ ...editingProject, sortOrder: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveProject(editingProject)}
                      className="bg-coral hover:bg-coral/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Project
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingProject(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-coral text-white">{project.size}</Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingProject(project)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{project.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{project.location}</p>
                    <p className="text-sm text-gray-700 mb-2">{project.type}</p>
                    <p className="text-xs text-gray-500">{project.scope}</p>
                    <p className="text-xs text-gray-400 mt-2">Order: {project.sortOrder}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
