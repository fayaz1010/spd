'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Calculator, Download, Upload, ArrowLeft } from 'lucide-react';
import { InstallationCostItemModal } from '@/components/admin/installation-cost-item-modal';

interface InstallationCostItem {
  id?: string;
  name: string;
  code: string;
  category: string;
  calculationType: string;
  baseRate: number;
  multiplier: number;
  formula?: string;
  minSystemSize?: number;
  maxSystemSize?: number;
  roofType?: string;
  roofPitch?: string;
  orientation?: string;
  storeys?: number;
  phases?: number;
  hasOptimisers?: boolean;
  hasBattery?: boolean;
  batteryType?: string;
  isRetrofit?: boolean;
  estimatedHours?: number;
  skillLevel?: string;
  teamSize: number;
  providerId?: string;
  providerType?: string;
  minQuantity: number;
  maxQuantity?: number;
  isRequired: boolean;
  isOptional: boolean;
  defaultIncluded: boolean;
  description?: string;
  notes?: string;
  isActive: boolean;
  priority: number;
  sortOrder: number;
  // New fields
  applicationTiming: string;
  showInCalculator: boolean;
  showInQuote: boolean;
  requiresInspection: boolean;
  itemGroup?: string;
  mutuallyExclusive: boolean;
}

const CATEGORIES = ['BASE', 'COMPLEXITY', 'LABOR', 'EQUIPMENT', 'RENTAL', 'REGULATORY'];
const CALCULATION_TYPES = ['FIXED', 'PER_WATT', 'PER_PANEL', 'PER_KW', 'PER_KWH', 'PER_UNIT', 'HOURLY', 'FORMULA'];
const APPLICATION_TIMINGS = ['MANDATORY', 'SITE_INSPECTION', 'CUSTOMER_ADDON', 'MANUAL'];

export default function InstallationCostingPage() {
  const router = useRouter();
  const [items, setItems] = useState<InstallationCostItem[]>([]);
  const [grouped, setGrouped] = useState<Record<string, InstallationCostItem[]>>({});
  const [activeTab, setActiveTab] = useState('BASE');
  const [loading, setLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingItem, setEditingItem] = useState<InstallationCostItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/installation-costing', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
        setGrouped(data.grouped);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/installation-costing/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleToggleActive = async (item: InstallationCostItem) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/installation-costing/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          isActive: !item.isActive,
        }),
      });

      if (response.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleSave = async (item: InstallationCostItem) => {
    try {
      const token = localStorage.getItem('token');
      const url = item.id 
        ? `/api/admin/installation-costing/${item.id}`
        : '/api/admin/installation-costing';
      
      const response = await fetch(url, {
        method: item.id ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        fetchItems();
        setEditingItem(null);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Installation Costing</h1>
            <p className="text-gray-600 mt-1">
              Unified installation cost management - Single source of truth
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCalculator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Calculator className="w-4 h-4" />
              Test Calculator
            </button>
            <button
              onClick={() => setEditingItem({} as InstallationCostItem)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {CATEGORIES.map(category => (
            <div key={category} className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">{category}</div>
              <div className="text-2xl font-bold text-gray-900">
                {grouped[category]?.length || 0}
              </div>
              <div className="text-xs text-gray-500">
                {grouped[category]?.filter(i => i.isActive).length || 0} active
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === category
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {category}
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100">
                {grouped[category]?.length || 0}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {grouped[activeTab]?.map((item) => (
              <tr key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500">{item.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {item.calculationType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${item.baseRate.toFixed(2)}
                  {item.multiplier !== 1 && (
                    <span className="text-gray-500 ml-1">×{item.multiplier}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.providerType === 'SUBCONTRACTOR'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.providerType || 'INTERNAL'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      item.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => item.id && handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!grouped[activeTab] || grouped[activeTab].length === 0) && (
          <div className="text-center py-12 text-gray-500">
            No items in this category yet.
            <button
              onClick={() => setEditingItem({} as InstallationCostItem)}
              className="block mx-auto mt-4 text-blue-600 hover:text-blue-700"
            >
              Add your first item
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 About This System</h3>
        <p className="text-sm text-blue-800 mb-2">
          This is the <strong>unified installation costing system</strong> - the single source of truth for all installation costs.
        </p>
        <ul className="text-sm text-blue-700 space-y-1 ml-4">
          <li>• Replaces fragmented systems (InstallationPricing, ComplexityFactor, LaborType, ExtraCost)</li>
          <li>• Supports multiple providers (Kluem Electrical, Internal Team, others)</li>
          <li>• Integrated with quotes, material orders, and subcontractor payments</li>
          <li>• Currently loaded: <strong>30 Kluem Electrical rates</strong></li>
        </ul>
        <div className="mt-4 pt-4 border-t border-blue-300">
          <p className="text-sm text-blue-800 mb-2">
            💰 <strong>Commission & Margin Settings:</strong>
          </p>
          <a
            href="/admin/dashboard/system-settings"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Configure subcontractor commission (15%) and internal team margin (30%) in System Settings →
          </a>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {editingItem && (
        <InstallationCostItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
