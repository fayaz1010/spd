'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X, HelpCircle, GripVertical, ArrowLeft, Zap } from 'lucide-react';
import { AIGenerateButton } from '@/components/admin/AIGenerateButton';
import { BulkAIGenerateButton } from '@/components/admin/BulkAIGenerateButton';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  sortOrder: number;
  isPublished: boolean;
  viewCount: number;
  helpful: number;
  notHelpful: number;
}

const CATEGORIES = [
  { value: 'solar', label: 'Solar Panels' },
  { value: 'battery', label: 'Battery Storage' },
  { value: 'installation', label: 'Installation' },
  { value: 'pricing', label: 'Pricing & Finance' },
  { value: 'rebates', label: 'Rebates & Incentives' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function FAQsManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'solar',
    tags: '',
    isPublished: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchFaqs();
  }, [filterCategory]);

  const fetchFaqs = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);

      const response = await fetch(`/api/admin/faqs?${params}`);
      const data = await response.json();

      if (data.success) {
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'solar',
      tags: '',
      isPublished: true,
      sortOrder: faqs.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      tags: faq.tags.join(', '),
      isPublished: faq.isPublished,
      sortOrder: faq.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      const payload = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category,
        tags,
        isPublished: formData.isPublished,
        sortOrder: formData.sortOrder,
      };

      const url = editingFaq
        ? `/api/admin/faqs/${editingFaq.id}`
        : '/api/admin/faqs';
      const method = editingFaq ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingFaq ? 'FAQ updated' : 'FAQ created');
        setIsDialogOpen(false);
        fetchFaqs();
      } else {
        toast.error(data.error || 'Failed to save FAQ');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Error saving FAQ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('FAQ deleted');
        fetchFaqs();
      } else {
        toast.error('Failed to delete FAQ');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Error deleting FAQ');
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isPublished ? 'FAQ unpublished' : 'FAQ published');
        fetchFaqs();
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Error updating FAQ');
    }
  };

  const handleBulkGenerated = async (generatedFaqs: any[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const faq of generatedFaqs) {
        try {
          const response = await fetch('/api/admin/faqs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: faq.question,
              answer: faq.answer,
              category: faq.category || 'solar',
              tags: Array.isArray(faq.tags) ? faq.tags : [],
              isPublished: true,
              sortOrder: faqs.length + successCount,
            }),
          });

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Created ${successCount} FAQs successfully!`);
        fetchFaqs();
      }
      if (errorCount > 0) {
        toast.error(`Failed to create ${errorCount} FAQs`);
      }
    } catch (error) {
      console.error('Error saving bulk FAQs:', error);
      toast.error('Error saving FAQs');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <Link href="/admin/dashboard/website">
        <Button variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Website Management
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">FAQs Management</h1>
          <p className="text-gray-600">Manage frequently asked questions</p>
        </div>
        <div className="flex gap-2">
          <BulkAIGenerateButton
            type="faq"
            onGenerated={handleBulkGenerated}
            buttonText="Bulk Generate FAQs"
            buttonVariant="secondary"
          />
          <Button onClick={openAddDialog} className="bg-coral hover:bg-coral/90">
            <Plus className="w-4 h-4 mr-2" />
            Add FAQ
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total FAQs</p>
                <p className="text-2xl font-bold">{faqs.length}</p>
              </div>
              <HelpCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold">
                  {faqs.filter(f => f.isPublished).length}
                </p>
              </div>
              <HelpCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold">{CATEGORIES.length}</p>
              </div>
              <HelpCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">
                  {faqs.reduce((sum, f) => sum + f.viewCount, 0)}
                </p>
              </div>
              <HelpCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <Label>Filter by Category:</Label>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* FAQs List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Loading FAQs...</p>
          </CardContent>
        </Card>
      ) : faqs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No FAQs found</p>
            <Button onClick={openAddDialog} className="mt-4">
              Create your first FAQ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                      <Badge variant="outline">
                        {CATEGORIES.find(c => c.value === faq.category)?.label}
                      </Badge>
                      {!faq.isPublished && (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>👁️ {faq.viewCount} views</span>
                      <span>👍 {faq.helpful} helpful</span>
                      <span>Sort: {faq.sortOrder}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublish(faq.id, faq.isPublished)}
                    >
                      {faq.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(faq)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(faq.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{faq.answer}</p>
                {faq.tags.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {faq.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
            <DialogDescription>
              {editingFaq ? 'Update the FAQ details' : 'Create a new frequently asked question'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="What is the question?"
              />
            </div>

            <div>
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Provide a detailed answer..."
                rows={6}
              />
              <div className="mt-2">
                <AIGenerateButton
                  type="faq"
                  onGenerated={(data) => {
                    setFormData({
                      ...formData,
                      question: data.question,
                      answer: data.answer,
                      category: data.category,
                      tags: data.tags,
                    });
                    toast.success('FAQ generated! Review and edit as needed.');
                  }}
                  buttonText="Generate with AI"
                  buttonVariant="outline"
                  size="sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="solar panels, installation, warranty"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <Label htmlFor="isPublished">Publish immediately</Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-coral hover:bg-coral/90">
                <Save className="w-4 h-4 mr-2" />
                {editingFaq ? 'Update' : 'Create'} FAQ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
