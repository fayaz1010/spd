'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Eye, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ScreeningQuestion {
  question: string;
  required: boolean;
}

interface Vacancy {
  id: string;
  vacancyCode: string;
  status: string;
  openings: number;
  publishedAt: string | null;
  closingDate: string | null;
  startDate: string | null;
  customTitle: string | null;
  customDescription: string | null;
  requireCoverLetter: boolean;
  requireResume: boolean;
  screeningQuestions: ScreeningQuestion[];
  viewCount: number;
  applicationCount: number;
  position: {
    id: string;
    positionCode: string;
    title: string;
    department: string;
    level: string;
  };
  applications: any[];
}

export default function EditVacancyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    openings: '1',
    closingDate: '',
    startDate: '',
    customTitle: '',
    customDescription: '',
    requireCoverLetter: false,
    requireResume: true,
    status: 'DRAFT',
  });

  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>([]);

  useEffect(() => {
    fetchVacancy();
  }, [params.id]);

  const fetchVacancy = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/vacancies/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const v = data.vacancy;
        setVacancy(v);
        setFormData({
          openings: v.openings.toString(),
          closingDate: v.closingDate ? v.closingDate.split('T')[0] : '',
          startDate: v.startDate ? v.startDate.split('T')[0] : '',
          customTitle: v.customTitle || '',
          customDescription: v.customDescription || '',
          requireCoverLetter: v.requireCoverLetter,
          requireResume: v.requireResume,
          status: v.status,
        });
        setScreeningQuestions(v.screeningQuestions || []);
      } else {
        toast({
          title: 'Error',
          description: 'Vacancy not found',
          variant: 'destructive',
        });
        router.push('/admin/dashboard/vacancies');
      }
    } catch (error) {
      console.error('Error fetching vacancy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vacancy',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addScreeningQuestion = () => {
    setScreeningQuestions([...screeningQuestions, { question: '', required: true }]);
  };

  const updateScreeningQuestion = (index: number, field: keyof ScreeningQuestion, value: any) => {
    const updated = [...screeningQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setScreeningQuestions(updated);
  };

  const removeScreeningQuestion = (index: number) => {
    setScreeningQuestions(screeningQuestions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/vacancies/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          openings: parseInt(formData.openings),
          screeningQuestions: screeningQuestions.filter(q => q.question.trim()),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Vacancy updated successfully',
        });
        fetchVacancy();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to update vacancy',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update vacancy',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-yellow-100 text-yellow-800',
      FILLED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/dashboard/vacancies')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{vacancy.vacancyCode}</h1>
              {getStatusBadge(vacancy.status)}
            </div>
            <p className="text-gray-600">{vacancy.customTitle || vacancy.position.title}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Views</span>
          </div>
          <div className="text-2xl font-bold">{vacancy.viewCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Applications</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{vacancy.applicationCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Published</div>
          <div className="text-lg font-medium">
            {vacancy.publishedAt ? format(new Date(vacancy.publishedAt), 'MMM dd, yyyy') : 'Not published'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Position Info */}
        <Card>
          <CardHeader>
            <CardTitle>Position Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-medium text-blue-900 mb-2">{vacancy.position.title}</p>
              <p className="text-sm text-blue-700">
                {vacancy.position.positionCode} • {vacancy.position.department} • {vacancy.position.level}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status & Details */}
        <Card>
          <CardHeader>
            <CardTitle>Vacancy Status & Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="FILLED">Filled</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {formData.status === 'PUBLISHED' && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ This vacancy will be visible on the public careers page
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="openings">Number of Openings *</Label>
                <Input
                  id="openings"
                  type="number"
                  min="1"
                  value={formData.openings}
                  onChange={(e) => setFormData({ ...formData, openings: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="closingDate">Closing Date</Label>
                <Input
                  id="closingDate"
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="startDate">Expected Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customization */}
        <Card>
          <CardHeader>
            <CardTitle>Customization (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customTitle">Custom Title</Label>
              <Input
                id="customTitle"
                placeholder="Leave empty to use position title"
                value={formData.customTitle}
                onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customDescription">Custom Description</Label>
              <Textarea
                id="customDescription"
                placeholder="Leave empty to use position description"
                value={formData.customDescription}
                onChange={(e) => setFormData({ ...formData, customDescription: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Application Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Application Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireResume"
                checked={formData.requireResume}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireResume: checked as boolean })
                }
              />
              <Label htmlFor="requireResume" className="font-normal cursor-pointer">
                Require Resume/CV
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireCoverLetter"
                checked={formData.requireCoverLetter}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireCoverLetter: checked as boolean })
                }
              />
              <Label htmlFor="requireCoverLetter" className="font-normal cursor-pointer">
                Require Cover Letter
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Screening Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Screening Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {screeningQuestions.map((q, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Enter question"
                    value={q.question}
                    onChange={(e) => updateScreeningQuestion(index, 'question', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={q.required}
                    onCheckedChange={(checked) =>
                      updateScreeningQuestion(index, 'required', checked)
                    }
                  />
                  <Label className="text-xs">Required</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeScreeningQuestion(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addScreeningQuestion}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </CardContent>
        </Card>

        {/* Applications List */}
        {vacancy.applications && vacancy.applications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications ({vacancy.applications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vacancy.applications.slice(0, 5).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{app.firstName} {app.lastName}</p>
                      <p className="text-sm text-gray-600">{app.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{app.status}</Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(app.createdAt), 'MMM dd')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push(`/admin/dashboard/applications?vacancyId=${vacancy.id}`)}
              >
                View All Applications
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/dashboard/vacancies')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
