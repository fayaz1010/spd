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
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Position {
  id: string;
  positionCode: string;
  title: string;
  department: string;
  level: string;
  description: string;
  responsibilities: string[];
  essentialRequirements: string[];
  desirableRequirements: string[];
  salaryType: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
}

interface ScreeningQuestion {
  question: string;
  required: boolean;
}

export default function NewVacancyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    positionId: '',
    openings: '1',
    closingDate: '',
    startDate: '',
    customTitle: '',
    customDescription: '',
    requireCoverLetter: false,
    requireResume: true,
  });

  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>([]);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/positions?isActive=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPositions(data.positions || []);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load positions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChange = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    setSelectedPosition(position || null);
    setFormData({ ...formData, positionId });
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
      const response = await fetch('/api/admin/vacancies', {
        method: 'POST',
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
          description: 'Vacancy created successfully',
        });
        router.push('/admin/dashboard/vacancies');
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to create vacancy',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create vacancy',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/dashboard/vacancies')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Vacancy</h1>
          <p className="text-gray-600">Post a new job opening from a position template</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Position Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Position Template</CardTitle>
            <CardDescription>
              Select the position template for this vacancy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="positionId">Position *</Label>
              <Select
                value={formData.positionId}
                onValueChange={handlePositionChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{position.title}</span>
                        <span className="text-xs text-gray-500">
                          {position.positionCode} • {position.department} • {position.level}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPosition && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Position Details</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Department:</span>{' '}
                    <span className="font-medium">{selectedPosition.department}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Level:</span>{' '}
                    <span className="font-medium">{selectedPosition.level}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Salary Range:</span>{' '}
                    <span className="font-medium">
                      {selectedPosition.salaryType === 'hourly'
                        ? `$${selectedPosition.hourlyRateMin} - $${selectedPosition.hourlyRateMax}/hr`
                        : `$${selectedPosition.annualSalaryMin?.toLocaleString()} - $${selectedPosition.annualSalaryMax?.toLocaleString()}/yr`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vacancy Details */}
        <Card>
          <CardHeader>
            <CardTitle>Vacancy Details</CardTitle>
            <CardDescription>
              Configure the vacancy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {/* Customization (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Customization (Optional)</CardTitle>
            <CardDescription>
              Override position template details if needed
            </CardDescription>
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
              <p className="text-xs text-gray-500 mt-1">
                {formData.customTitle || selectedPosition?.title || 'No title set'}
              </p>
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
            <CardDescription>
              What do applicants need to submit?
            </CardDescription>
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
                Require Resume/CV (recommended)
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
            <CardDescription>
              Add questions to help filter candidates
            </CardDescription>
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

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/dashboard/vacancies')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !formData.positionId}>
            {saving ? 'Creating...' : 'Create Vacancy (Draft)'}
          </Button>
        </div>
      </form>
    </div>
  );
}
