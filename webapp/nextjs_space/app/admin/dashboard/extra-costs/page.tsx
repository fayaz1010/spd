'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, ArrowLeft, Edit, Eye, EyeOff, Loader2, CheckCircle, XCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExtraCost {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  active: boolean;
  optional: boolean;
  defaultOn: boolean;
  sortOrder: number;
}

export default function ExtraCostsPage() {
  const router = useRouter();
  const [costs, setCosts] = useState<ExtraCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCost, setEditingCost] = useState<ExtraCost | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDefaultOn, setEditDefaultOn] = useState(false);

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/extra-costs/all');
      const data = await response.json();
      if (data.success) {
        setCosts(data.extraCosts);
      }
    } catch (error) {
      console.error('Error fetching costs:', error);
      toast.error('Failed to load costs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingCost(null);
    setEditName('');
    setEditDescription('');
    setEditCost('');
    setEditCategory('installation');
    setEditDefaultOn(false);
    setShowAddModal(true);
  };

  const handleEdit = (cost: ExtraCost) => {
    setEditingCost(cost);
    setEditName(cost.name);
    setEditDescription(cost.description);
    setEditCost(cost.cost.toString());
    setEditCategory(cost.category);
    setEditDefaultOn(cost.defaultOn);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCost) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/extra-costs/${editingCost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          cost: parseFloat(editCost),
          category: editCategory,
          defaultOn: editDefaultOn,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Cost updated successfully');
      setShowEditModal(false);
      fetchCosts();
    } catch (error) {
      console.error('Error updating cost:', error);
      toast.error('Failed to update cost');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNew = async () => {
    if (!editName || !editCost) {
      toast.error('Please fill in name and cost');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/extra-costs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          cost: parseFloat(editCost),
          category: editCategory,
          defaultOn: editDefaultOn,
        }),
      });

      if (!response.ok) throw new Error('Failed to create');

      toast.success('Cost created successfully');
      setShowAddModal(false);
      fetchCosts();
    } catch (error) {
      console.error('Error creating cost:', error);
      toast.error('Failed to create cost');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cost: ExtraCost) => {
    try {
      const response = await fetch(`/api/admin/extra-costs/${cost.id}/toggle`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to toggle');

      toast.success(`Cost ${cost.active ? 'deactivated' : 'activated'}`);
      fetchCosts();
    } catch (error) {
      console.error('Error toggling cost:', error);
      toast.error('Failed to toggle cost');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/admin/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-teal-600" />
                Extra Costs Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage additional costs for quote tester (installation kit, removal, upgrades)
              </p>
            </div>
            <Button
              onClick={handleAddNew}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Cost
            </Button>
          </div>
        </div>

        {/* Costs List */}
        <div className="grid gap-4">
          {costs.map((cost) => (
            <Card key={cost.id} className={!cost.active ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{cost.name}</h3>
                      <span className="text-xl font-bold text-teal-600">
                        ${cost.cost.toFixed(2)}
                      </span>
                      {!cost.active && (
                        <span className="bg-gray-400 text-white px-2 py-1 rounded text-xs">
                          Inactive
                        </span>
                      )}
                      {cost.defaultOn && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Default ON
                        </span>
                      )}
                      {!cost.defaultOn && (
                        <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs flex items-center">
                          <XCircle className="w-3 h-3 mr-1" />
                          Default OFF
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-2">{cost.description}</p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Category: <strong>{cost.category}</strong></span>
                      <span>•</span>
                      <span>Sort Order: <strong>{cost.sortOrder}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(cost)}
                    >
                      {cost.active ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(cost)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Extra Cost</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="editName">Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editCost">Cost ($)</Label>
                  <Input
                    id="editCost"
                    type="number"
                    step="0.01"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="editCategory">Category</Label>
                  <select
                    id="editCategory"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="installation">Installation</option>
                    <option value="upgrade">Upgrade</option>
                    <option value="regulatory">Regulatory</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editDefaultOn"
                  checked={editDefaultOn}
                  onChange={(e) => setEditDefaultOn(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="editDefaultOn" className="cursor-pointer">
                  Default ON (checkbox selected by default in quote tester)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add New Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Extra Cost</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="newName">Name *</Label>
                <Input
                  id="newName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g., Meter Upgrade"
                />
              </div>

              <div>
                <Label htmlFor="newDescription">Description</Label>
                <Textarea
                  id="newDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of the cost"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newCost">Cost ($) *</Label>
                  <Input
                    id="newCost"
                    type="number"
                    step="0.01"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="newCategory">Category</Label>
                  <select
                    id="newCategory"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="installation">Installation</option>
                    <option value="upgrade">Upgrade</option>
                    <option value="regulatory">Regulatory</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="newDefaultOn"
                  checked={editDefaultOn}
                  onChange={(e) => setEditDefaultOn(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="newDefaultOn" className="cursor-pointer">
                  Default ON (checkbox selected by default in quote tester)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNew} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Cost
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
