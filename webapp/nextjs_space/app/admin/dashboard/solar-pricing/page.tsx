'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function SolarPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState<any>(null);
  const [formData, setFormData] = useState({
    costPerKw: 1000,
    panelWattage: 400,
    panelBrand: 'Tier 1 Premium',
    inverterBrand: 'Fronius/SolarEdge',
    installationFee: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/solar-pricing', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.pricing && data.pricing.length > 0) {
        const activePricing = data.pricing.find((p: any) => p.active) || data.pricing[0];
        setPricing(activePricing);
        setFormData({
          costPerKw: activePricing.costPerKw,
          panelWattage: activePricing.panelWattage,
          panelBrand: activePricing.panelBrand,
          inverterBrand: activePricing.inverterBrand,
          installationFee: activePricing.installationFee,
        });
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch('/api/admin/solar-pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: pricing.id,
          ...formData,
        }),
      });

      if (response.ok) {
        alert('Solar pricing updated successfully!');
        fetchPricing();
      } else {
        throw new Error('Failed to update pricing');
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      alert('Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-primary">Solar Pricing Management</h1>
              <p className="text-xs text-gray-500">Update solar system pricing</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="bg-gradient-gold rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Solar System Pricing</h2>
            <p className="text-gray-600">
              Configure the pricing for solar panel installations. These values are used in real-time quotes.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="costPerKw" className="text-sm font-semibold">
                Cost Per kW ($)
              </Label>
              <Input
                id="costPerKw"
                type="number"
                step="10"
                value={formData.costPerKw}
                onChange={(e) => setFormData({ ...formData, costPerKw: parseFloat(e.target.value) })}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Base cost per kilowatt of solar system capacity
              </p>
            </div>

            <div>
              <Label htmlFor="panelWattage" className="text-sm font-semibold">
                Panel Wattage (W)
              </Label>
              <Input
                id="panelWattage"
                type="number"
                step="10"
                value={formData.panelWattage}
                onChange={(e) => setFormData({ ...formData, panelWattage: parseInt(e.target.value) })}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wattage per solar panel (e.g., 400W)
              </p>
            </div>

            <div>
              <Label htmlFor="panelBrand" className="text-sm font-semibold">
                Panel Brand/Quality
              </Label>
              <Input
                id="panelBrand"
                type="text"
                value={formData.panelBrand}
                onChange={(e) => setFormData({ ...formData, panelBrand: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Brand or quality tier of solar panels
              </p>
            </div>

            <div>
              <Label htmlFor="inverterBrand" className="text-sm font-semibold">
                Inverter Brand
              </Label>
              <Input
                id="inverterBrand"
                type="text"
                value={formData.inverterBrand}
                onChange={(e) => setFormData({ ...formData, inverterBrand: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Brand of inverter included
              </p>
            </div>

            <div>
              <Label htmlFor="installationFee" className="text-sm font-semibold">
                Installation Fee ($)
              </Label>
              <Input
                id="installationFee"
                type="number"
                step="10"
                value={formData.installationFee}
                onChange={(e) => setFormData({ ...formData, installationFee: parseFloat(e.target.value) })}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Flat installation fee (set to 0 if included in per-kW cost)
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Pricing Preview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">6kW System (15 panels)</span>
                  <span className="font-semibold">${(formData.costPerKw * 6 + formData.installationFee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">10kW System (25 panels)</span>
                  <span className="font-semibold">${(formData.costPerKw * 10 + formData.installationFee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">13kW System (33 panels)</span>
                  <span className="font-semibold">${(formData.costPerKw * 13 + formData.installationFee).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-coral hover:bg-coral-600 text-white py-6 text-lg"
            >
              <Save className="mr-2 h-5 w-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
