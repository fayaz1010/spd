'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  Copy,
  Save,
  AlertCircle
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TemplateEditor from '@/components/admin/TemplateEditor';

interface PackageTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tier: string;
  sortOrder: number;
  active: boolean;
  solarSizingStrategy: string;
  solarCoveragePercent?: number;
  solarFixedKw?: number;
  batterySizingStrategy: string;
  batteryCoverageHours?: number;
  batteryFixedKwh?: number;
  includeMonitoring: boolean;
  includeWarranty: string;
  includeMaintenance: boolean;
  priceMultiplier: number;
  discountPercent: number;
  badge?: string;
  highlightColor?: string;
  features?: string[];
}

function SortableTemplateRow({ template, onEdit, onDelete, onToggleActive, onDuplicate }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-4 mb-3 ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Template Info */}
        <div className="flex-1 grid grid-cols-5 gap-4 items-center">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{template.displayName}</h3>
              {template.badge && (
                <span 
                  className="text-xs px-2 py-1 rounded-full text-white"
                  style={{ backgroundColor: template.highlightColor || '#3B82F6' }}
                >
                  {template.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{template.name}</p>
          </div>

          <div className="text-sm">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {template.tier}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            <div>Solar: {template.solarCoveragePercent}%</div>
            <div>Battery: {template.batteryCoverageHours}h</div>
          </div>

          <div className="text-sm text-gray-600">
            <div>Multiplier: {template.priceMultiplier}x</div>
            {template.discountPercent > 0 && (
              <div className="text-green-600">-{template.discountPercent}%</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {template.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleActive(template)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title={template.active ? 'Deactivate' : 'Activate'}
          >
            {template.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => onDuplicate(template)}
            className="p-2 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(template)}
            className="p-2 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(template)}
            className="p-2 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="ml-9 mt-2 text-sm text-gray-600">
        {template.description}
      </div>
    </div>
  );
}

export default function PackageTemplatesPage() {
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PackageTemplate | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/package-templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTemplates((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update sortOrder for all items
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sortOrder: index + 1,
        }));
        
        setHasChanges(true);
        return updatedItems;
      });
    }
  };

  const saveSortOrder = async () => {
    try {
      setSaving(true);
      
      // Update each template with new sortOrder
      await Promise.all(
        templates.map((template) =>
          fetch(`/api/admin/package-templates/${template.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template),
          })
        )
      );

      setHasChanges(false);
      alert('Sort order saved successfully!');
    } catch (error) {
      console.error('Error saving sort order:', error);
      alert('Failed to save sort order');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (template: PackageTemplate) => {
    try {
      const response = await fetch(`/api/admin/package-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, active: !template.active }),
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error toggling template:', error);
    }
  };

  const handleDelete = async (template: PackageTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.displayName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/package-templates/${template.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDuplicate = async (template: PackageTemplate) => {
    const newTemplate = {
      ...template,
      id: undefined,
      name: `${template.name} Copy`,
      displayName: `${template.displayName} (Copy)`,
      active: false,
    };

    try {
      const response = await fetch('/api/admin/package-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handleEdit = (template: PackageTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onClose={handleEditorClose}
      />
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Package Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage system packages shown to customers in the calculator
          </p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={saveSortOrder}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Order'}
            </button>
          )}
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Package
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Drag and drop to reorder packages</p>
          <p>The order here determines how packages appear in the customer calculator. Remember to click "Save Order" after reordering.</p>
        </div>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No package templates found</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Your First Package
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={templates.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {templates.map((template) => (
              <SortableTemplateRow
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onDuplicate={handleDuplicate}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

