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
  ExternalLink,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: string | null;
  status: 'DRAFT' | 'ENHANCED' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  viewCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

interface CombinedReport {
  postId: string;
  postTitle: string;
  postSlug: string;
  postStatus: string;
  strategyName: string | null;
  strategyId: string | null;
  targetKeyword: string | null;
  qualityScore: number;
  qualityIssues: number;
  requiredActions: string[];
  needsRegeneration: boolean;
  needsEnhancement: boolean;
  needsManualFix: boolean;
  seoScore: number;
  seoGrade: string;
  seoIssues: number;
  keywordDensity: number;
  qualityReport: any;
  seoReport: any;
}

export default function BlogManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [aiFixing, setAiFixing] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);
  const [fixProgress, setFixProgress] = useState<string>('');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [combinedReports, setCombinedReports] = useState<Map<string, CombinedReport>>(new Map());
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
    postsWithIssues: 0,
    averageQuality: 0,
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
        postsWithIssues: 0,
        averageQuality: 0,
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

  const handleEnhance = async (id: string, title: string) => {
    if (!confirm(`Enhance "${title}"? This will add images, fix formatting, and optimize the content.`)) return;

    setEnhancing(id);
    try {
      const res = await fetch(`/api/blog/posts/${id}/enhance`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to enhance article');

      toast.success('Article enhanced successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to enhance article');
    } finally {
      setEnhancing(null);
    }
  };

  const handleAIFix = async (id: string, title: string) => {
    if (!confirm(`AI Fix "${title}"? This will analyze and automatically fix all quality and SEO issues.`)) return;

    setAiFixing(id);
    try {
      const response = await fetch(`/api/blog/posts/${id}/ai-fix`, {
        method: 'POST',
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.complete) {
              toast.success(`Fixed! Applied ${data.result.changesApplied.length} changes`);
              fetchData();
              handleScanQuality(); // Re-scan to show improvements
            }

            if (data.error) {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fix article');
    } finally {
      setAiFixing(null);
    }
  };

  const handleRegenerate = async (id: string, title: string) => {
    if (!confirm(`Regenerate "${title}"? This will replace the current content with freshly generated content from the strategy.`)) return;

    setRegenerating(id);
    try {
      const res = await fetch(`/api/blog/posts/${id}/regenerate`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to regenerate article');

      toast.success('Article regenerated successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate article');
    } finally {
      setRegenerating(null);
    }
  };

  const handleScanQuality = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/blog/scan-complete');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to scan posts');

      // Store combined reports
      const reportsMap = new Map<string, CombinedReport>();
      data.reports.forEach((report: CombinedReport) => {
        reportsMap.set(report.postId, report);
      });
      setCombinedReports(reportsMap);

      // Update stats
      setStats(prev => ({
        ...prev,
        postsWithIssues: data.summary.postsWithQualityIssues,
        averageQuality: data.summary.averageQualityScore,
      }));

      toast.success(`Scan complete! Quality: ${data.summary.postsWithQualityIssues} issues, SEO: ${data.summary.postsWithSEOIssues} issues`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to scan posts');
    } finally {
      setScanning(false);
    }
  };

  const handleFixAll = async () => {
    if (!confirm('Fix all posts with issues? This may take several minutes.')) return;

    setFixingAll(true);
    setFixProgress('Starting...');

    try {
      const response = await fetch('/api/blog/fix-all', {
        method: 'POST',
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.step) {
              setFixProgress(data.step);
            }

            if (data.complete) {
              toast.success(`Fixed ${data.results.regenerated + data.results.enhanced} posts!`);
              fetchData();
              handleScanQuality(); // Re-scan after fixes
            }

            if (data.error) {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fix posts');
    } finally {
      setFixingAll(false);
      setFixProgress('');
    }
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

  const getQualityBadge = (postId: string) => {
    const report = combinedReports.get(postId);
    if (!report) return null;

    const actions = report.requiredActions.join(', ');
    const title = actions ? `Actions needed: ${actions}` : 'No issues';

    if (report.qualityScore >= 90) {
      return (
        <Badge className="bg-green-100 text-green-800" title={title}>
          <CheckCircle className="w-3 h-3 mr-1" />
          {report.qualityScore}%
        </Badge>
      );
    } else if (report.qualityScore >= 70) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800" title={title}>
          <AlertTriangle className="w-3 h-3 mr-1" />
          {report.qualityScore}% {actions && `(${actions})`}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800" title={title}>
          <AlertTriangle className="w-3 h-3 mr-1" />
          {report.qualityScore}% {actions && `(${actions})`}
        </Badge>
      );
    }
  };

  const getSEOBadge = (postId: string) => {
    const report = combinedReports.get(postId);
    if (!report) return null;

    const gradeColors: Record<string, string> = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={gradeColors[report.seoGrade]} title={`${report.seoIssues} SEO issues`}>
        {report.seoGrade} ({report.seoScore}%)
      </Badge>
    );
  };

  const getStrategyBadge = (postId: string) => {
    const report = combinedReports.get(postId);
    if (!report || !report.strategyName) {
      return <span className="text-gray-400 text-sm">No strategy</span>;
    }

    return (
      <Badge variant="outline" className="text-xs">
        {report.strategyName}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PUBLISHED: 'bg-green-100 text-green-800',
      ENHANCED: 'bg-purple-100 text-purple-800',
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
          <Button 
            variant="outline" 
            onClick={handleScanQuality}
            disabled={scanning || fixingAll}
          >
            {scanning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-2" />
            )}
            Scan Quality
          </Button>
          {stats.postsWithIssues > 0 && (
            <Button 
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
              onClick={handleFixAll}
              disabled={fixingAll || scanning}
            >
              {fixingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {fixProgress}
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Fix All Issues ({stats.postsWithIssues})
                </>
              )}
            </Button>
          )}
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Posts with Issues</p>
                <p className="text-2xl font-bold">{stats.postsWithIssues}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Quality</p>
                <p className="text-2xl font-bold">{stats.averageQuality}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
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
                <SelectItem value="ENHANCED">Enhanced</SelectItem>
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
                  <TableHead>Strategy</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>SEO Score</TableHead>
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
                      {getStrategyBadge(post.id)}
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
                    <TableCell>
                      {getQualityBadge(post.id)}
                    </TableCell>
                    <TableCell>
                      {getSEOBadge(post.id)}
                    </TableCell>
                    <TableCell>{post.viewCount.toLocaleString()}</TableCell>
                    <TableCell>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Preview button for all articles */}
                        <Link href={`/admin/dashboard/website/blog/${post.id}/preview`}>
                          <Button variant="ghost" size="sm" title="Preview Article">
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                        </Link>
                        {/* View live for published articles */}
                        {post.status === 'PUBLISHED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            title="View Live"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        {/* AI Fix button (new smart fix) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIFix(post.id, post.title)}
                          disabled={aiFixing === post.id || enhancing === post.id || regenerating === post.id}
                          title="AI Fix (Smart analysis + automatic fixes)"
                        >
                          {aiFixing === post.id ? (
                            <Zap className="w-4 h-4 text-yellow-600 animate-pulse" />
                          ) : (
                            <Zap className="w-4 h-4 text-yellow-600" />
                          )}
                        </Button>
                        {/* Enhance button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEnhance(post.id, post.title)}
                          disabled={enhancing === post.id || regenerating === post.id || aiFixing === post.id}
                          title="Enhance Article (Add Images & Fix Formatting)"
                        >
                          {enhancing === post.id ? (
                            <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-purple-600" />
                          )}
                        </Button>
                        {/* Regenerate button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate(post.id, post.title)}
                          disabled={regenerating === post.id || enhancing === post.id}
                          title="Regenerate from Strategy"
                        >
                          {regenerating === post.id ? (
                            <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-orange-600" />
                          )}
                        </Button>
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
