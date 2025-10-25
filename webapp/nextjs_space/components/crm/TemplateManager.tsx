'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Mail, MessageSquare, Plus, Edit, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  type: string;
  category?: string;
  subject?: string;
  body: string;
  variables?: string[];
  usageCount: number;
  isActive: boolean;
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'EMAIL',
    category: '',
    subject: '',
    body: '',
    variables: [] as string[],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/communications/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = isEditing && selectedTemplate
        ? `/api/communications/templates/${selectedTemplate.id}`
        : '/api/communications/templates';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Template ${isEditing ? 'updated' : 'created'} successfully`,
        });
        setIsDialogOpen(false);
        resetForm();
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
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/communications/templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Template deleted successfully',
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

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      category: template.category || '',
      subject: template.subject || '',
      body: template.body,
      variables: template.variables || [],
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (template: Template) => {
    setFormData({
      name: `${template.name} (Copy)`,
      type: template.type,
      category: template.category || '',
      subject: template.subject || '',
      body: template.body,
      variables: template.variables || [],
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'EMAIL',
      category: '',
      subject: '',
      body: '',
      variables: [],
    });
    setSelectedTemplate(null);
    setIsEditing(false);
  };

  const insertVariable = (variable: string) => {
    setFormData({
      ...formData,
      body: formData.body + `{{${variable}}}`,
    });
  };

  const commonVariables = [
    'customer_name',
    'system_size',
    'quote_reference',
    'installation_date',
    'total_cost',
    'annual_savings',
    'company_name',
    'company_phone',
  ];

  if (loading) {
    return <div className="p-6 text-center">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Message Templates</h2>
          <p className="text-gray-600">Create and manage email and SMS templates</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Quote Follow-up"
                />
              </div>

              {/* Type & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="confirmation">Confirmation</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Subject (Email only) */}
              {formData.type === 'EMAIL' && (
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Your Solar Quote is Ready!"
                  />
                </div>
              )}

              {/* Variables */}
              <div>
                <Label>Insert Variables</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonVariables.map((variable) => (
                    <Button
                      key={variable}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable)}
                    >
                      {variable}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div>
                <Label htmlFor="body">Message Body</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={10}
                  placeholder="Hi {{customer_name}}, your {{system_size}}kW solar quote is ready..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use {`{{variable_name}}`} for dynamic content
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {isEditing ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No templates yet</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              Create Your First Template
            </Button>
          </Card>
        ) : (
          templates.map((template) => {
            const Icon = template.type === 'EMAIL' ? Mail : MessageSquare;

            return (
              <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${template.type === 'EMAIL' ? 'text-blue-600' : 'text-green-600'}`} />
                    <h3 className="font-semibold">{template.name}</h3>
                  </div>
                  {!template.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>

                {template.category && (
                  <Badge variant="outline" className="mb-3">
                    {template.category}
                  </Badge>
                )}

                {template.subject && (
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {template.subject}
                  </p>
                )}

                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {template.body}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Used {template.usageCount} times</span>
                </div>

                <div className="flex gap-2">
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
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
