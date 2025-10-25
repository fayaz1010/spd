'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Copy,
  Mail,
  MessageSquare,
  Search,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'EMAIL' | 'SMS';
  category: string;
  createdAt: string;
  usageCount: number;
}

export default function TemplatesLibrary() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EMAIL' | 'SMS'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formType, setFormType] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [formCategory, setFormCategory] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormSubject('');
    setFormBody('');
    setFormType('EMAIL');
    setFormCategory('');
    setShowCreateModal(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSubject(template.subject);
    setFormBody(template.body);
    setFormType(template.type);
    setFormCategory(template.category);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formName || !formBody) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in name and body',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const url = editingTemplate
        ? `/api/crm/templates/${editingTemplate.id}`
        : '/api/crm/templates';
      
      const response = await fetch(url, {
        method: editingTemplate ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName,
          subject: formSubject,
          body: formBody,
          type: formType,
          category: formCategory,
        }),
      });

      if (response.ok) {
        toast({
          title: editingTemplate ? 'Template Updated' : 'Template Created',
          description: 'Template saved successfully',
        });
        setShowCreateModal(false);
        fetchTemplates();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/crm/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
          title: 'Template Deleted',
          description: 'Template removed successfully',
        });
        fetchTemplates();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          subject: template.subject,
          body: template.body,
          type: template.type,
          category: template.category,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Template Duplicated',
          description: 'Copy created successfully',
        });
        fetchTemplates();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive',
      });
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.body.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || template.type === filterType;

    return matchesSearch && matchesType;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/crm/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Email & SMS Templates</h1>
                <p className="text-xs text-gray-500">{templates.length} templates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="EMAIL">Email Only</option>
                <option value="SMS">SMS Only</option>
              </select>
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {Object.keys(groupedTemplates).length === 0 ? (
          <Card className="p-12 text-center">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Mail className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create your first template to streamline your communication
            </p>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create First Template
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTemplates.map((template) => (
                    <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {template.type === 'EMAIL' ? (
                            <Mail className="h-5 w-5 text-blue-600" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-purple-600" />
                          )}
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          template.type === 'EMAIL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {template.type}
                        </span>
                      </div>

                      {template.subject && (
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {template.subject}
                        </p>
                      )}

                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {template.body}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>Used {template.usageCount || 0} times</span>
                        <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Welcome Email"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full mt-2 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Follow-up, Welcome, Quote, etc."
                  className="mt-2"
                />
              </div>

              {formType === 'EMAIL' && (
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Welcome to Sun Direct Power!"
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="body">Message Body *</Label>
                  <Button variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  id="body"
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Hi {{name}}, thank you for your interest..."
                  rows={formType === 'SMS' ? 4 : 10}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{{'} name {'}}'}, {'{{'} email {'}}'}, {'{{'} phone {'}}'} for personalization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
