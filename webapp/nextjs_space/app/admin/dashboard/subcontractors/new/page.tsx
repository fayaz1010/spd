
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SuburbAutocomplete } from '@/components/admin/suburb-autocomplete';
import {
  Building2,
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function NewSubcontractorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    dayRate: '',
    hourlyRate: '',
    costPerJob: '',
    isActive: true,
  });

  const [serviceSuburbs, setServiceSuburbs] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch('/api/admin/subcontractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          dayRate: formData.dayRate ? parseFloat(formData.dayRate) : null,
          hourlyRate: formData.hourlyRate
            ? parseFloat(formData.hourlyRate)
            : null,
          costPerJob: formData.costPerJob
            ? parseFloat(formData.costPerJob)
            : null,
          serviceSuburbs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subcontractor');
      }

      router.push('/admin/dashboard/subcontractors');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link href="/admin/dashboard/subcontractors">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-bold text-primary">
                  Add New Subcontractor
                </h1>
                <p className="text-xs text-gray-500">
                  Create a new external contractor
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Company Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="companyName">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  placeholder="ABC Solar Installations"
                />
              </div>

              <div>
                <Label htmlFor="contactName">
                  Contact Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  required
                  placeholder="John Smith"
                />
              </div>

              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="contact@abcsolar.com.au"
                />
              </div>

              <div>
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="0412 345 678"
                />
              </div>
            </div>
          </div>

          {/* Rates */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Rates (Optional)
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="dayRate">Day Rate (AUD)</Label>
                <Input
                  id="dayRate"
                  name="dayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.dayRate}
                  onChange={handleInputChange}
                  placeholder="800.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cost per day for this subcontractor
                </p>
              </div>

              <div>
                <Label htmlFor="hourlyRate">Hourly Rate (AUD)</Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  placeholder="100.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cost per hour for this subcontractor
                </p>
              </div>

              <div>
                <Label htmlFor="costPerJob">Cost Per Job (AUD)</Label>
                <Input
                  id="costPerJob"
                  name="costPerJob"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPerJob}
                  onChange={handleInputChange}
                  placeholder="3500.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fixed cost per installation job
                </p>
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Service Areas
            </h2>

            <SuburbAutocomplete
              selectedSuburbs={serviceSuburbs}
              onSuburbsChange={setServiceSuburbs}
              label="Service Suburbs"
              placeholder="Search for suburbs..."
            />
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (Available for job assignments)
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-coral hover:bg-coral-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Subcontractor
                </>
              )}
            </Button>

            <Link href="/admin/dashboard/subcontractors">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
