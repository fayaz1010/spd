
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Gift, Edit2, Check, X, Plus, TestTube, Info, Trash2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { EXAMPLE_FORMULAS, getAvailableVariables } from '@/lib/formula-engine';

interface Rebate {
  id: string;
  name: string;
  type: string;
  calculationType: string;
  value: number;
  maxAmount?: number;
  description: string;
  eligibilityCriteria: string;
  formula?: string;
  variables?: any;
  active: boolean;
}

export default function RebatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rebates, setRebates] = useState<Rebate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formulaHelpOpen, setFormulaHelpOpen] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [newRebate, setNewRebate] = useState<Partial<Rebate>>({
    name: '',
    type: 'federal_sres',
    calculationType: 'per_kw',
    value: 0,
    maxAmount: undefined,
    description: '',
    eligibilityCriteria: '',
    formula: '',
    active: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchRebates();
  }, []);

  const fetchRebates = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/rebates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setRebates(data.rebates || []);
    } catch (error) {
      console.error('Error fetching rebates:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (rebate: Rebate) => {
    setEditingId(rebate.id);
    setEditData({ ...rebate });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/admin/rebates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        await fetchRebates();
        setEditingId(null);
        setEditData({});
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update rebate');
      }
    } catch (error) {
      console.error('Error saving rebate:', error);
      alert('Failed to update rebate');
    }
  };

  const createRebate = async () => {
    try {
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/admin/rebates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newRebate),
      });

      if (response.ok) {
        await fetchRebates();
        setCreateDialogOpen(false);
        setNewRebate({
          name: '',
          type: 'federal_sres',
          calculationType: 'per_kw',
          value: 0,
          maxAmount: undefined,
          description: '',
          eligibilityCriteria: '',
          formula: '',
          active: true,
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create rebate');
      }
    } catch (error) {
      console.error('Error creating rebate:', error);
      alert('Failed to create rebate');
    }
  };

  const deleteRebate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rebate?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');

      const response = await fetch(`/api/admin/rebates?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchRebates();
      } else {
        alert('Failed to delete rebate');
      }
    } catch (error) {
      console.error('Error deleting rebate:', error);
      alert('Failed to delete rebate');
    }
  };

  const testFormula = async (formula: string) => {
    if (!formula) {
      alert('Please enter a formula to test');
      return;
    }

    try {
      const response = await fetch('/api/admin/rebates/test-formula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          formula,
          variables: {
            systemSizeKw: 10,
            batterySizeKwh: 13.5,
            batteryCost: 15000,
            solarCost: 12000,
            totalCost: 27000,
            panelCount: 25,
          },
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error('Error testing formula:', error);
      setTestResult({ success: false, error: 'Failed to test formula' });
    }
  };

  const renderRebateForm = (data: any, setData: (data: any) => void, isEdit = false) => (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Rebate Name</Label>
          <Input
            type="text"
            value={data.name || ''}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="mt-1"
            placeholder="e.g., Federal SRES Rebate"
          />
        </div>
        <div>
          <Label className="text-sm">Rebate Type</Label>
          <select
            value={data.type || 'federal_sres'}
            onChange={(e) => setData({ ...data, type: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          >
            <option value="federal_sres">Federal SRES</option>
            <option value="federal_battery">Federal Battery</option>
            <option value="wa_battery">WA Battery Scheme</option>
            <option value="state_solar">State Solar</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Calculation Type</Label>
          <select
            value={data.calculationType || 'per_kw'}
            onChange={(e) => setData({ ...data, calculationType: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          >
            <option value="per_kw">Per kW</option>
            <option value="per_kwh">Per kWh (Battery)</option>
            <option value="percentage">Percentage</option>
            <option value="formula">Formula (Advanced)</option>
          </select>
        </div>

        {data.calculationType !== 'formula' && (
          <div>
            <Label className="text-sm">
              Value {data.calculationType === 'percentage' ? '(%)' : '($)'}
            </Label>
            <Input
              type="number"
              step={data.calculationType === 'percentage' ? '1' : '10'}
              value={data.value || 0}
              onChange={(e) => setData({ ...data, value: parseFloat(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>
        )}

        {data.calculationType === 'formula' && (
          <div>
            <Label className="text-sm">Max Amount ($) - Optional</Label>
            <Input
              type="number"
              step="100"
              value={data.maxAmount || ''}
              onChange={(e) =>
                setData({ ...data, maxAmount: e.target.value ? parseFloat(e.target.value) : null })
              }
              className="mt-1"
              placeholder="No limit"
            />
          </div>
        )}
      </div>

      {data.calculationType !== 'formula' && (
        <div>
          <Label className="text-sm">Max Amount ($) - Optional</Label>
          <Input
            type="number"
            step="100"
            value={data.maxAmount || ''}
            onChange={(e) =>
              setData({ ...data, maxAmount: e.target.value ? parseFloat(e.target.value) : null })
            }
            className="mt-1"
            placeholder="No limit"
          />
        </div>
      )}

      {data.calculationType === 'formula' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Formula</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormulaHelpOpen(true)}
            >
              <Info className="h-4 w-4 mr-1" />
              Help & Examples
            </Button>
          </div>
          <Textarea
            value={data.formula || ''}
            onChange={(e) => setData({ ...data, formula: e.target.value })}
            className="mt-1 font-mono text-sm"
            rows={3}
            placeholder="e.g., min(systemSizeKw * 500, 5000)"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => testFormula(data.formula)}
            >
              <TestTube className="h-4 w-4 mr-1" />
              Test Formula
            </Button>
          </div>
          {testResult && (
            <div
              className={`p-3 rounded-lg text-sm ${
                testResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {testResult.success ? (
                <div>
                  <p className="font-semibold">✓ Formula Valid</p>
                  <p className="mt-1">
                    Test result with sample values: <strong>${testResult.value?.toFixed(2)}</strong>
                  </p>
                  <p className="text-xs mt-1 text-emerald-600">
                    Sample: 10kW system, 13.5kWh battery ($15,000), 25 panels
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">✗ Invalid Formula</p>
                  <p className="mt-1">{testResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <Label className="text-sm">Description</Label>
        <Textarea
          value={data.description || ''}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          className="mt-1"
          rows={2}
          placeholder="Brief description of the rebate program"
        />
      </div>

      <div>
        <Label className="text-sm">Eligibility Criteria</Label>
        <Textarea
          value={data.eligibilityCriteria || ''}
          onChange={(e) => setData({ ...data, eligibilityCriteria: e.target.value })}
          className="mt-1"
          rows={2}
          placeholder="Who qualifies for this rebate?"
        />
      </div>
    </div>
  );

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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard">
                <Button variant="ghost" className="mr-4">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Rebate Configuration</h1>
                <p className="text-xs text-gray-500">Manage government rebate programs</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/dashboard/zone-ratings">
                <Button variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Zone Ratings
                </Button>
              </Link>
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-emerald hover:bg-emerald-600">
                <Plus className="h-4 w-4 mr-2" />
                Create New Rebate
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="bg-gradient-emerald rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Government Rebates</h2>
            <p className="text-gray-600">
              Configure federal and state rebate programs. Changes apply immediately to new quotes.
            </p>
          </div>

          <div className="space-y-6">
            {rebates.map((rebate) => {
              const isEditing = editingId === rebate.id;

              return (
                <div key={rebate.id} className="border-2 border-gray-200 rounded-xl p-6">
                  {isEditing ? (
                    <div>
                      {renderRebateForm(editData, setEditData, true)}
                      <div className="flex gap-2 mt-4">
                        <Button onClick={saveEdit} className="bg-emerald hover:bg-emerald-600">
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button onClick={cancelEdit} variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-primary">{rebate.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {rebate.calculationType === 'formula' ? (
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                Formula-based
                              </span>
                            ) : rebate.calculationType === 'percentage' ? (
                              `${rebate.value}% of cost`
                            ) : rebate.calculationType === 'per_kw' ? (
                              `$${rebate.value} per kW`
                            ) : (
                              `$${rebate.value} per kWh`
                            )}
                            {rebate.maxAmount && ` (max $${rebate.maxAmount.toLocaleString()})`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => startEdit(rebate)} variant="outline" size="sm">
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => deleteRebate(rebate.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {rebate.calculationType === 'formula' && rebate.formula && (
                          <div>
                            <p className="text-xs text-gray-500 font-semibold">Formula</p>
                            <code className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded block mt-1">
                              {rebate.formula}
                            </code>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Description</p>
                          <p className="text-sm text-gray-700">{rebate.description}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Eligibility</p>
                          <p className="text-sm text-gray-700">{rebate.eligibilityCriteria}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {rebates.length === 0 && (
              <div className="text-center py-12">
                <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No rebates configured yet</p>
                <Button onClick={() => setCreateDialogOpen(true)} className="bg-emerald hover:bg-emerald-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rebate
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Rebate Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Rebate</DialogTitle>
            <DialogDescription>
              Add a new government rebate program. You can use simple calculations or advanced formulas.
            </DialogDescription>
          </DialogHeader>
          {renderRebateForm(newRebate, setNewRebate)}
          <div className="flex gap-2 mt-4">
            <Button onClick={createRebate} className="bg-emerald hover:bg-emerald-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Rebate
            </Button>
            <Button onClick={() => setCreateDialogOpen(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formula Help Dialog */}
      <Dialog open={formulaHelpOpen} onOpenChange={setFormulaHelpOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Formula Help & Examples</DialogTitle>
            <DialogDescription>
              Create complex rebate calculations using mathematical expressions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-sm mb-2">Available Variables</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {getAvailableVariables().map((v) => (
                  <div key={v.name} className="bg-gray-50 p-2 rounded">
                    <code className="font-mono text-emerald-600">{v.name}</code>
                    <p className="text-xs text-gray-600 mt-1">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Supported Functions</h4>
              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                <p><code className="font-mono">min(a, b)</code> - Minimum of two values</p>
                <p><code className="font-mono">max(a, b)</code> - Maximum of two values</p>
                <p><code className="font-mono">condition ? valueIfTrue : valueIfFalse</code> - Conditional</p>
                <p><code className="font-mono">+, -, *, /</code> - Basic arithmetic</p>
                <p><code className="font-mono">&gt;, &lt;, &gt;=, &lt;=, ==</code> - Comparisons</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Example Formulas</h4>
              <div className="space-y-3">
                {EXAMPLE_FORMULAS.map((example, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <p className="font-semibold text-sm">{example.name}</p>
                    <code className="block bg-gray-100 p-2 rounded my-2 text-xs font-mono">
                      {example.formula}
                    </code>
                    <p className="text-xs text-gray-600">{example.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
