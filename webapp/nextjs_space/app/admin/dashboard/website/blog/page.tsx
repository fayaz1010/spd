'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Calendar,
  TrendingUp,
  Folder,
  Settings,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  viewCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

export default function BlogManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    totalViews: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, statusFilter, categoryFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        fetch('/api/blog/posts?limit=1000'), // Get all posts for now
        fetch('/api/blog/categories'),
      ]);

      const postsData = await postsRes.json();
      const categoriesData = await categoriesRes.json();

      const posts = postsData.posts || postsData;
      setPosts(posts);
      setCategories(categoriesData);

      // Calculate stats
      const stats = {
        total: posts.length,
        published: posts.filter((p: BlogPost) => p.status === 'PUBLISHED').length,
        draft: posts.filter((p: BlogPost) => p.status === 'DRAFT').length,
        totalViews: posts.reduce((sum: number, p: BlogPost) => sum + p.viewCount, 0),
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((post) => post.category === categoryFilter);
    }

    setFilteredPosts(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/blog/posts/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete post');

      toast.success('Post deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PUBLISHED: 'bg-green-100 text-green-800',
      DRAFT: 'bg-yellow-100 text-yellow-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.DRAFT;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/website">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Website
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Blog Management</h1>
            <p className="text-gray-600">Create and manage blog posts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/dashboard/website/blog/categories">
            <Button variant="outline">
              <Folder className="w-4 h-4 mr-2" />
              Categories
            </Button>
          </Link>
          <Link href="/admin/dashboard/website/blog/settings">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Link href="/admin/dashboard/website/blog/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
              <Edit className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No blog posts found</p>
              <Link href="/admin/dashboard/website/blog/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Post
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="text-sm text-gray-500 truncate max-w-md">
                          {post.excerpt}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.category ? (
                        <Badge variant="outline">{post.category}</Badge>
                      ) : (
                        <span className="text-gray-400">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(post.status)}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.viewCount.toLocaleString()}</TableCell>
                    <TableCell>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {post.status === 'PUBLISHED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            title="View Post"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Link href={`/admin/dashboard/website/blog/${post.id}`}>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
