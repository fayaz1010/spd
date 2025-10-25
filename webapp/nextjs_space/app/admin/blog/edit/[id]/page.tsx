'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/blog/RichTextEditor';
import { ArrowLeft, Save, Eye, Upload, Loader2 } from 'lucide-react';
import { generateSlug, calculateReadingTime, validateMetaTitle, validateMetaDescription } from '@/lib/blog/utils';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    category: '',
    tags: '',
    author: 'Sun Direct Power',
    status: 'DRAFT',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch post data
  useEffect(() => {
    fetchPost();
    fetchCategories();
  }, [params.id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/posts/${params.id}`);
      const data = await response.json();

      if (data.success) {
        const post = data.post;
        setFormData({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          featuredImage: post.featuredImage || '',
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          keywords: Array.isArray(post.keywords) ? post.keywords.join(', ') : '',
          category: post.category || '',
          tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
          author: post.author,
          status: post.status,
        });
      } else {
        toast.error('Post not found');
        router.push('/admin/blog');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      router.push('/admin/blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/blog/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/blog/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, featuredImage: data.url }));
        toast.success('Image uploaded successfully');
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.slug) newErrors.slug = 'Slug is required';
    if (!formData.content) newErrors.content = 'Content is required';
    if (!formData.excerpt) newErrors.excerpt = 'Excerpt is required';
    if (!formData.metaTitle) newErrors.metaTitle = 'Meta title is required';
    if (!formData.metaDescription) newErrors.metaDescription = 'Meta description is required';

    const metaTitleValidation = validateMetaTitle(formData.metaTitle);
    if (!metaTitleValidation.valid) {
      newErrors.metaTitle = metaTitleValidation.message!;
    }

    const metaDescValidation = validateMetaDescription(formData.metaDescription);
    if (!metaDescValidation.valid) {
      newErrors.metaDescription = metaDescValidation.message!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    try {
      setSaving(true);

      const readingTime = calculateReadingTime(formData.content);
      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
      const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);

      const payload = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        featuredImage: formData.featuredImage || null,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        keywords,
        category: formData.category || null,
        tags,
        author: formData.author,
        status: status || formData.status,
        readingTime,
      };

      const response = await fetch(`/api/blog/posts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Post updated successfully');
        router.push('/admin/blog');
      } else {
        toast.error(data.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-coral mx-auto mb-4" />
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/blog">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Blog Post</h1>
                <p className="text-sm text-gray-600">Update your blog post</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave()}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              {formData.status !== 'PUBLISHED' && (
                <Button
                  className="bg-coral hover:bg-coral-600"
                  onClick={() => handleSave('PUBLISHED')}
                  disabled={saving}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white rounded-lg shadow p-6">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter post title..."
                className="mt-2"
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            {/* Slug */}
            <div className="bg-white rounded-lg shadow p-6">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="post-url-slug"
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Preview: /blog/{formData.slug || 'post-url-slug'}
              </p>
              {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug}</p>}
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <Label>Content *</Label>
              <div className="mt-2">
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Start writing your blog post..."
                />
              </div>
              {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content}</p>}
            </div>

            {/* Excerpt */}
            <div className="bg-white rounded-lg shadow p-6">
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief summary of the post..."
                rows={3}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.excerpt.length} characters
              </p>
              {errors.excerpt && <p className="text-sm text-red-500 mt-1">{errors.excerpt}</p>}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-lg shadow p-6">
              <Label>Featured Image</Label>
              <div className="mt-2">
                {formData.featuredImage ? (
                  <div className="relative">
                    <img
                      src={formData.featuredImage}
                      alt="Featured"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({ ...formData, featuredImage: '' })}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload an image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        {uploading ? 'Uploading...' : 'Choose File'}
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="bg-white rounded-lg shadow p-6">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow p-6">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="solar, perth, guide (comma-separated)"
                className="mt-2"
              />
            </div>

            {/* SEO */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">SEO Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title *</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="SEO title (30-60 chars)"
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.metaTitle.length}/60 characters
                  </p>
                  {errors.metaTitle && <p className="text-sm text-red-500 mt-1">{errors.metaTitle}</p>}
                </div>

                <div>
                  <Label htmlFor="metaDescription">Meta Description *</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="SEO description (120-160 chars)"
                    rows={3}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.metaDescription.length}/160 characters
                  </p>
                  {errors.metaDescription && <p className="text-sm text-red-500 mt-1">{errors.metaDescription}</p>}
                </div>

                <div>
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="keyword1, keyword2, keyword3"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
