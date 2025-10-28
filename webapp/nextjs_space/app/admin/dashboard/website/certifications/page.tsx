'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Eye,
  Upload,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

interface Certificate {
  id: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
}

export default function ManageCertificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [editing, setEditing] = useState<Certificate | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/certifications');
      const data = await response.json();
      
      if (data.success) {
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (cert: Certificate) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/certifications', {
        method: cert.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cert),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Certificate ${cert.id ? 'updated' : 'created'} successfully!`);
        loadData();
        setEditing(null);
      } else {
        toast.error('Failed to save certificate');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save certificate');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;

    try {
      const response = await fetch(`/api/admin/certifications/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Certificate deleted successfully!');
        loadData();
      } else {
        toast.error('Failed to delete certificate');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete certificate');
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Certifications</h1>
              <p className="text-gray-600 mt-1">Display licenses and accreditations</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('/about#certificates', '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={() => setEditing({
                  id: '',
                  name: '',
                  description: '',
                  image: '',
                  sortOrder: certificates.length + 1,
                })}
                className="bg-coral hover:bg-coral/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Certificate
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <Card className="mb-6 border-coral">
            <CardHeader>
              <CardTitle>{editing.id ? 'Edit Certificate' : 'New Certificate'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Name
                  </label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Clean Energy Council Accreditation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    value={editing.sortOrder}
                    onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                  placeholder="Certified solar installers and designers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <Input
                    value={editing.image}
                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                    placeholder="/certificates/cec.png"
                  />
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave(editing)}
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
                      Save Certificate
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Award className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(cert)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(cert.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{cert.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{cert.description}</p>
                <p className="text-xs text-gray-400">Order: {cert.sortOrder}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {certificates.length === 0 && !editing && (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No certifications yet</p>
              <Button
                onClick={() => setEditing({
                  id: '',
                  name: '',
                  description: '',
                  image: '',
                  sortOrder: 1,
                })}
                className="bg-coral hover:bg-coral/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Certificate
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
