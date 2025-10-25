'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Battery, Edit2, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function BatteryPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [batteries, setBatteries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchBatteries();
  }, []);

  const fetchBatteries = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/battery-pricing', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setBatteries(data.pricing || []);
    } catch (error) {
      console.error('Error fetching batteries:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (battery: any) => {
    setEditingId(battery.id);
    setEditData({ ...battery });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch('/api/admin/battery-pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        await fetchBatteries();
        setEditingId(null);
        setEditData({});
      }
    } catch (error) {
      console.error('Error saving battery:', error);
      alert('Failed to update battery pricing');
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
              <h1 className="text-xl font-bold text-primary">Battery Pricing Management</h1>
              <p className="text-xs text-gray-500">Update battery storage pricing</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="bg-gradient-coral rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <Battery className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Battery Storage Pricing</h2>
            <p className="text-gray-600">
              Manage pricing for different battery capacities and brands.
            </p>
          </div>

          <div className="space-y-4">
            {batteries.map((battery) => {
              const isEditing = editingId === battery.id;

              return (
                <div
                  key={battery.id}
                  className="border-2 border-gray-200 rounded-xl p-6 hover:border-coral transition-colors"
                >
                  {isEditing ? (
                    <div className="grid md:grid-cols-5 gap-4">
                      <div>
                        <Label className="text-xs">Capacity (kWh)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={editData.capacityKwh}
                          onChange={(e) => setEditData({ ...editData, capacityKwh: parseFloat(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Brand</Label>
                        <Input
                          type="text"
                          value={editData.brand}
                          onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Model</Label>
                        <Input
                          type="text"
                          value={editData.model}
                          onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cost ($)</Label>
                        <Input
                          type="number"
                          step="100"
                          value={editData.cost}
                          onChange={(e) => setEditData({ ...editData, cost: parseFloat(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button onClick={saveEdit} className="bg-emerald hover:bg-emerald-600 flex-1">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" className="flex-1">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="grid md:grid-cols-4 gap-6 flex-1">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Capacity</p>
                          <p className="font-bold text-lg text-primary">{battery.capacityKwh} kWh</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Brand</p>
                          <p className="font-semibold text-gray-900">{battery.brand}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Model</p>
                          <p className="font-semibold text-gray-900">{battery.model}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Cost</p>
                          <p className="font-bold text-2xl text-coral">${battery.cost.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button onClick={() => startEdit(battery)} variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
