'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image as ImageIcon, Plus, Edit, Trash2, ArrowLeft, Eye, EyeOff, Loader2, Zap, DollarSign, Leaf, TreePine, Battery, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  iconName: string;
  imageUrl: string;
  gradient: string;
  stats: Array<{ value: string; label: string }>;
  sortOrder: number;
  isActive: boolean;
}

const iconOptions = [
  { value: 'Zap', label: 'Lightning (Zap)' },
  { value: 'DollarSign', label: 'Dollar Sign' },
  { value: 'Leaf', label: 'Leaf' },
  { value: 'TreePine', label: 'Tree' },
  { value: 'Battery', label: 'Battery' },
];

const gradientOptions = [
  { value: 'from-primary/20 to-emerald/20', label: 'Blue to Green' },
  { value: 'from-gold/20 to-coral/20', label: 'Gold to Coral' },
  { value: 'from-emerald/20 to-primary/20', label: 'Green to Blue' },
  { value: 'from-emerald/20 to-gold/20', label: 'Green to Gold' },
  { value: 'from-purple/20 to-pink/20', label: 'Purple to Pink' },
];

export default function HeroCarouselManagement() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [aiPrompt, setAiPrompt] = useState({
    topic: '',
    targetAudience: '',
    callToAction: '',
    additionalContext: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    ctaText: '',
    ctaLink: '/calculator-v2',
    iconName: 'Zap',
    imageUrl: '',
    gradient: 'from-primary/20 to-emerald/20',
    stat1Value: '',
    stat1Label: '',
    stat2Value: '',
    stat2Label: '',
    stat3Value: '',
    stat3Label: '',
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        console.error('No admin token found');
        toast.error('Please log in again');
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/admin/hero-slides', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched slides:', data);
      setSlides(data.slides || []);
    } catch (error) {
      console.error('Error fetching slides:', error);
      toast.error('Failed to load hero slides');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const stats = [
        { value: formData.stat1Value, label: formData.stat1Label },
        { value: formData.stat2Value, label: formData.stat2Label },
        { value: formData.stat3Value, label: formData.stat3Label },
      ].filter(s => s.value && s.label);

      const payload = {
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        ctaText: formData.ctaText,
        ctaLink: formData.ctaLink,
        iconName: formData.iconName,
        imageUrl: formData.imageUrl,
        gradient: formData.gradient,
        stats,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      };

      const url = editingSlide
        ? `/api/admin/hero-slides/${editingSlide.id}`
        : '/api/admin/hero-slides';
      
      const method = editingSlide ? 'PUT' : 'POST';
      const token = localStorage.getItem('admin_token');

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save slide');

      toast.success(editingSlide ? 'Slide updated!' : 'Slide added!');
      setDialogOpen(false);
      resetForm();
      fetchSlides();
    } catch (error) {
      console.error('Error saving slide:', error);
      toast.error('Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      ctaText: slide.ctaText,
      ctaLink: slide.ctaLink,
      iconName: slide.iconName,
      imageUrl: slide.imageUrl,
      gradient: slide.gradient,
      stat1Value: slide.stats[0]?.value || '',
      stat1Label: slide.stats[0]?.label || '',
      stat2Value: slide.stats[1]?.value || '',
      stat2Label: slide.stats[1]?.label || '',
      stat3Value: slide.stats[2]?.value || '',
      stat3Label: slide.stats[2]?.label || '',
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/hero-slides/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete slide');

      toast.success('Slide deleted!');
      fetchSlides();
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast.error('Failed to delete slide');
    }
  };

  const resetForm = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      ctaText: '',
      ctaLink: '/calculator-v2',
      iconName: 'Zap',
      imageUrl: '',
      gradient: 'from-primary/20 to-emerald/20',
      stat1Value: '',
      stat1Label: '',
      stat2Value: '',
      stat2Label: '',
      stat3Value: '',
      stat3Label: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await fetch('/api/admin/hero-slides/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(aiPrompt),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate slide');
      }

      toast.success('Hero slide generated! Review and activate when ready.');
      setAiDialogOpen(false);
      setAiPrompt({
        topic: '',
        targetAudience: '',
        callToAction: '',
        additionalContext: '',
      });
      fetchSlides();
    } catch (error: any) {
      console.error('Error generating slide:', error);
      toast.error(error.message || 'Failed to generate slide');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={() => router.push('/admin/dashboard/website')}
            className="bg-white/20 text-white border-white/30 hover:bg-white/30 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website Management
          </Button>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <ImageIcon className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Hero Carousel Management</h1>
              <p className="text-teal-100 text-lg">
                Manage homepage hero slides and content
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Hero Slides</h2>
            <p className="text-gray-600">{slides.length} total slides</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Generate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>AI Generate Hero Slide</DialogTitle>
                  <DialogDescription>
                    Describe what you want and AI will create a complete hero slide with content and image
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAiGenerate} className="space-y-4">
                  <div>
                    <Label>Topic / Main Message *</Label>
                    <Input
                      value={aiPrompt.topic}
                      onChange={(e) => setAiPrompt({ ...aiPrompt, topic: e.target.value })}
                      required
                      placeholder="e.g., Government rebates up to $20,000 available"
                    />
                    <p className="text-xs text-gray-500 mt-1">What's the main message or offer?</p>
                  </div>
                  <div>
                    <Label>Target Audience</Label>
                    <Input
                      value={aiPrompt.targetAudience}
                      onChange={(e) => setAiPrompt({ ...aiPrompt, targetAudience: e.target.value })}
                      placeholder="e.g., Perth homeowners, first-time solar buyers"
                    />
                  </div>
                  <div>
                    <Label>Call to Action</Label>
                    <Input
                      value={aiPrompt.callToAction}
                      onChange={(e) => setAiPrompt({ ...aiPrompt, callToAction: e.target.value })}
                      placeholder="e.g., Calculate savings, Get free quote"
                    />
                  </div>
                  <div>
                    <Label>Additional Context</Label>
                    <Textarea
                      value={aiPrompt.additionalContext}
                      onChange={(e) => setAiPrompt({ ...aiPrompt, additionalContext: e.target.value })}
                      placeholder="Any specific details, statistics, or requirements..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAiDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={generating} className="bg-gradient-to-r from-purple-600 to-pink-600">
                      {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {generating ? 'Generating...' : 'Generate Slide'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Slide
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSlide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
                <DialogDescription>
                  {editingSlide ? 'Update hero slide details' : 'Add a new slide to the hero carousel'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g., Massive Rebates Available"
                    />
                  </div>
                  <div>
                    <Label>Subtitle *</Label>
                    <Input
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      required
                      placeholder="e.g., Over $20,000 in Government Incentives"
                    />
                  </div>
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Full description of the slide content"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CTA Button Text *</Label>
                    <Input
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      required
                      placeholder="e.g., Calculate My Rebates"
                    />
                  </div>
                  <div>
                    <Label>CTA Link *</Label>
                    <Input
                      value={formData.ctaLink}
                      onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      required
                      placeholder="/calculator-v2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Icon</Label>
                    <Select
                      value={formData.iconName}
                      onValueChange={(value) => setFormData({ ...formData, iconName: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            {icon.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gradient</Label>
                    <Select
                      value={formData.gradient}
                      onValueChange={(value) => setFormData({ ...formData, gradient: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gradientOptions.map((grad) => (
                          <SelectItem key={grad.value} value={grad.value}>
                            {grad.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Image URL *</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    required
                    placeholder="/images/hero/slide-1.jpg"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Statistics (3 stats)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Stat 1 Value</Label>
                      <Input
                        value={formData.stat1Value}
                        onChange={(e) => setFormData({ ...formData, stat1Value: e.target.value })}
                        placeholder="e.g., $400-600"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Stat 1 Label</Label>
                      <Input
                        value={formData.stat1Label}
                        onChange={(e) => setFormData({ ...formData, stat1Label: e.target.value })}
                        placeholder="e.g., Per kW SRES"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Stat 2 Value</Label>
                      <Input
                        value={formData.stat2Value}
                        onChange={(e) => setFormData({ ...formData, stat2Value: e.target.value })}
                        placeholder="e.g., 30% Off"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Stat 2 Label</Label>
                      <Input
                        value={formData.stat2Label}
                        onChange={(e) => setFormData({ ...formData, stat2Label: e.target.value })}
                        placeholder="e.g., Battery Rebate"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Stat 3 Value</Label>
                      <Input
                        value={formData.stat3Value}
                        onChange={(e) => setFormData({ ...formData, stat3Value: e.target.value })}
                        placeholder="e.g., $20,000+"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Stat 3 Label</Label>
                      <Input
                        value={formData.stat3Label}
                        onChange={(e) => setFormData({ ...formData, stat3Label: e.target.value })}
                        placeholder="e.g., Total Savings"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingSlide ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {slides.map((slide) => (
              <Card key={slide.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex">
                  <div className="relative w-64 h-48 bg-gray-200 flex-shrink-0">
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold">{slide.title}</h3>
                          {slide.isActive ? (
                            <Badge className="bg-green-500">
                              <Eye className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                          <Badge variant="outline">Order: {slide.sortOrder}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{slide.subtitle}</p>
                        <p className="text-sm text-gray-700 mb-3">{slide.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Badge variant="secondary">{slide.iconName}</Badge>
                          <span>→</span>
                          <Badge variant="secondary">{slide.ctaText}</Badge>
                          <span className="text-xs">({slide.ctaLink})</span>
                        </div>
                        <div className="flex gap-3">
                          {slide.stats.map((stat, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-bold text-teal-600">{stat.value}</span>
                              <span className="text-gray-600"> {stat.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(slide)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(slide.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && slides.length === 0 && (
          <Card className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No slides yet</h3>
            <p className="text-gray-600 mb-4">Add your first hero slide to get started</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
