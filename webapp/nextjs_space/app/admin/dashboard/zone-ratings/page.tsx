'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, MapPin, Edit2, Check, X, Plus, Trash2, Download, Upload } from 'lucide-react';
import Link from 'next/link';

interface ZoneRating {
  id: string;
  postcodeStart: number;
  postcodeEnd: number;
  zone: number;
  zoneRating: number;
  state?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ZoneRatingsPage() {
  const [loading, setLoading] = useState(true);
  const [zoneRatings, setZoneRatings] = useState<ZoneRating[]>([]);
  const [filteredRatings, setFilteredRatings] = useState<ZoneRating[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterZone, setFilterZone] = useState('all');

  const [newZoneRating, setNewZoneRating] = useState<Partial<ZoneRating>>({
    postcodeStart: 0,
    postcodeEnd: 0,
    zone: 2,
    zoneRating: 1.536,
    state: 'WA',
    description: '',
  });

  useEffect(() => {
    fetchZoneRatings();
  }, []);

  useEffect(() => {
    filterRatings();
  }, [zoneRatings, searchTerm, filterState, filterZone]);

  const fetchZoneRatings = async () => {
    try {
      const response = await fetch('/api/admin/zone-ratings');
      const data = await response.json();
      if (data.success) {
        setZoneRatings(data.zoneRatings);
      }
    } catch (error) {
      console.error('Error fetching zone ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRatings = () => {
    let filtered = [...zoneRatings];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (rating) =>
          rating.description?.toLowerCase().includes(search) ||
          rating.state?.toLowerCase().includes(search) ||
          rating.postcodeStart.toString().includes(search) ||
          rating.postcodeEnd.toString().includes(search)
      );
    }

    // State filter
    if (filterState !== 'all') {
      filtered = filtered.filter((rating) => rating.state === filterState);
    }

    // Zone filter
    if (filterZone !== 'all') {
      filtered = filtered.filter((rating) => rating.zone === parseInt(filterZone));
    }

    setFilteredRatings(filtered);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/zone-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newZoneRating),
      });

      if (response.ok) {
        setCreateDialogOpen(false);
        setNewZoneRating({
          postcodeStart: 0,
          postcodeEnd: 0,
          zone: 2,
          zoneRating: 1.536,
          state: 'WA',
          description: '',
        });
        fetchZoneRatings();
      }
    } catch (error) {
      console.error('Error creating zone rating:', error);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/zone-ratings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setEditingId(null);
        setEditData({});
        fetchZoneRatings();
      }
    } catch (error) {
      console.error('Error updating zone rating:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone rating?')) return;

    try {
      const response = await fetch(`/api/admin/zone-ratings/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchZoneRatings();
      }
    } catch (error) {
      console.error('Error deleting zone rating:', error);
    }
  };

  const handleSeedData = async () => {
    if (!confirm('This will seed all Australian postcode zone ratings. Continue?')) return;

    try {
      const response = await fetch('/api/admin/zone-ratings/seed', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully seeded ${data.count} zone ratings!`);
        fetchZoneRatings();
      }
    } catch (error) {
      console.error('Error seeding zone ratings:', error);
      alert('Error seeding zone ratings');
    }
  };

  const startEdit = (rating: ZoneRating) => {
    setEditingId(rating.id);
    setEditData({
      postcodeStart: rating.postcodeStart,
      postcodeEnd: rating.postcodeEnd,
      zone: rating.zone,
      zoneRating: rating.zoneRating,
      state: rating.state,
      description: rating.description,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const states = ['WA', 'NSW', 'VIC', 'QLD', 'SA', 'TAS', 'NT', 'ACT'];
  const zones = [
    { value: 1, label: 'Zone 1 (1.622 - Highest Solar)', rating: 1.622 },
    { value: 2, label: 'Zone 2 (1.536)', rating: 1.536 },
    { value: 3, label: 'Zone 3 (1.382)', rating: 1.382 },
    { value: 4, label: 'Zone 4 (1.185 - Lowest Solar)', rating: 1.185 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading zone ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/dashboard/rebates"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rebates
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              Postcode Zone Ratings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage STC zone ratings for accurate rebate calculations based on customer location
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSeedData} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Seed All Australia
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Zone Rating
            </Button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">About STC Zone Ratings</h3>
        <p className="text-sm text-blue-800">
          Zone ratings are used to calculate Small-scale Technology Certificates (STCs) for solar rebates.
          Higher zones receive more sunlight and generate more STCs. The formula is:{' '}
          <code className="bg-blue-100 px-2 py-1 rounded">
            STCs = floor(System Size kW × Zone Rating × Deeming Period)
          </code>
        </p>
        <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
          <div>
            <strong>Zone 1:</strong> 1.622 (NT, North QLD)
          </div>
          <div>
            <strong>Zone 2:</strong> 1.536 (Perth, Brisbane)
          </div>
          <div>
            <strong>Zone 3:</strong> 1.382 (Sydney, Melbourne)
          </div>
          <div>
            <strong>Zone 4:</strong> 1.185 (Tasmania)
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Search</Label>
            <Input
              placeholder="Postcode, state, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Label>State</Label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
            >
              <option value="all">All States</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Zone</Label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
            >
              <option value="all">All Zones</option>
              {zones.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {filteredRatings.length} of {zoneRatings.length} ratings
            </div>
          </div>
        </div>
      </div>

      {/* Zone Ratings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Postcode Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRatings.map((rating) => (
                <tr key={rating.id} className="hover:bg-gray-50">
                  {editingId === rating.id ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={editData.postcodeStart}
                            onChange={(e) =>
                              setEditData({ ...editData, postcodeStart: parseInt(e.target.value) })
                            }
                            className="w-24"
                          />
                          <span className="self-center">-</span>
                          <Input
                            type="number"
                            value={editData.postcodeEnd}
                            onChange={(e) =>
                              setEditData({ ...editData, postcodeEnd: parseInt(e.target.value) })
                            }
                            className="w-24"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={editData.state}
                          onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                          className="border border-gray-300 rounded-md px-2 py-1"
                        >
                          {states.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={editData.zone}
                          onChange={(e) => {
                            const zone = parseInt(e.target.value);
                            const zoneData = zones.find((z) => z.value === zone);
                            setEditData({
                              ...editData,
                              zone,
                              zoneRating: zoneData?.rating || 1.382,
                            });
                          }}
                          className="border border-gray-300 rounded-md px-2 py-1"
                        >
                          {zones.map((zone) => (
                            <option key={zone.value} value={zone.value}>
                              {zone.value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          step="0.001"
                          value={editData.zoneRating}
                          onChange={(e) =>
                            setEditData({ ...editData, zoneRating: parseFloat(e.target.value) })
                          }
                          className="w-24"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={editData.description}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          placeholder="Description"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleUpdate(rating.id)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rating.postcodeStart} - {rating.postcodeEnd}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {rating.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">Zone {rating.zone}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">{rating.zoneRating}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{rating.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(rating)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(rating.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRatings.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No zone ratings found</p>
            <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add First Zone Rating
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Zone Rating</DialogTitle>
            <DialogDescription>
              Add a new postcode range with its STC zone rating
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Postcode Start</Label>
                <Input
                  type="number"
                  value={newZoneRating.postcodeStart}
                  onChange={(e) =>
                    setNewZoneRating({ ...newZoneRating, postcodeStart: parseInt(e.target.value) })
                  }
                  placeholder="6000"
                />
              </div>
              <div>
                <Label>Postcode End</Label>
                <Input
                  type="number"
                  value={newZoneRating.postcodeEnd}
                  onChange={(e) =>
                    setNewZoneRating({ ...newZoneRating, postcodeEnd: parseInt(e.target.value) })
                  }
                  placeholder="6199"
                />
              </div>
            </div>

            <div>
              <Label>State</Label>
              <select
                value={newZoneRating.state}
                onChange={(e) => setNewZoneRating({ ...newZoneRating, state: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Zone</Label>
              <select
                value={newZoneRating.zone}
                onChange={(e) => {
                  const zone = parseInt(e.target.value);
                  const zoneData = zones.find((z) => z.value === zone);
                  setNewZoneRating({
                    ...newZoneRating,
                    zone,
                    zoneRating: zoneData?.rating || 1.382,
                  });
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {zones.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Zone Rating</Label>
              <Input
                type="number"
                step="0.001"
                value={newZoneRating.zoneRating}
                onChange={(e) =>
                  setNewZoneRating({ ...newZoneRating, zoneRating: parseFloat(e.target.value) })
                }
              />
              <p className="text-xs text-gray-500 mt-1">Auto-filled based on zone selection</p>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={newZoneRating.description}
                onChange={(e) => setNewZoneRating({ ...newZoneRating, description: e.target.value })}
                placeholder="Perth Metro"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Zone Rating</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
