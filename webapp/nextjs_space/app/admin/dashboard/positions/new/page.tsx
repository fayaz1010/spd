'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewPositionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    positionCode: '',
    title: '',
    department: '',
    level: '',
    description: '',
    salaryType: 'hourly',
    hourlyRateMin: '',
    hourlyRateMax: '',
    annualSalaryMin: '',
    annualSalaryMax: '',
    superannuationRate: '11.5',
    overtimeAvailable: true,
    overtimeRate: '1.5',
    bonusStructure: '',
    employmentType: 'FULL_TIME',
    hoursPerWeek: '38',
    workSchedule: '',
    rdoAvailable: false,
    travelRequired: false,
    travelDetails: '',
    isActive: true,
    isPublic: false,
  });

  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [essentialReqs, setEssentialReqs] = useState<string[]>(['']);
  const [desirableReqs, setDesirableReqs] = useState<string[]>(['']);
  const [licenses, setLicenses] = useState<string[]>(['']);
  const [certs, setCerts] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<Array<{type: string, description: string}>>([{type: '', description: ''}]);
  const [locations, setLocations] = useState<string[]>(['']);
  const [physicalReqs, setPhysicalReqs] = useState<string[]>(['']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('admin_token');
      
      const payload = {
        ...formData,
        hourlyRateMin: formData.hourlyRateMin ? parseFloat(formData.hourlyRateMin) : null,
        hourlyRateMax: formData.hourlyRateMax ? parseFloat(formData.hourlyRateMax) : null,
        annualSalaryMin: formData.annualSalaryMin ? parseFloat(formData.annualSalaryMin) : null,
        annualSalaryMax: formData.annualSalaryMax ? parseFloat(formData.annualSalaryMax) : null,
        superannuationRate: parseFloat(formData.superannuationRate),
        overtimeRate: parseFloat(formData.overtimeRate),
        hoursPerWeek: parseFloat(formData.hoursPerWeek),
        responsibilities: responsibilities.filter(r => r.trim()),
        essentialRequirements: essentialReqs.filter(r => r.trim()),
        desirableRequirements: desirableReqs.filter(r => r.trim()),
        requiredLicenses: licenses.filter(l => l.trim()),
        requiredCerts: certs.filter(c => c.trim()),
        benefits: benefits.filter(b => b.type && b.description),
        workLocations: locations.filter(l => l.trim()),
        physicalRequirements: physicalReqs.filter(p => p.trim()),
      };

      const response = await fetch('/api/admin/positions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create position');
      }

      toast({
        title: 'Success',
        description: 'Position created successfully',
      });

      router.push('/admin/dashboard/positions');
    } catch (error: any) {
      console.error('Error creating position:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create position',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addArrayItem = (setter: Function, current: any[]) => {
    setter([...current, current[0] instanceof Object ? {type: '', description: ''} : '']);
  };

  const removeArrayItem = (setter: Function, current: any[], index: number) => {
    setter(current.filter((_, i) => i !== index));
  };

  const updateArrayItem = (setter: Function, current: any[], index: number, value: any) => {
    const updated = [...current];
    updated[index] = value;
    setter(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard/positions">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Create New Position
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Define a standardized role template with pay scales and requirements
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details about this position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="positionCode">Position Code *</Label>
                    <Input
                      id="positionCode"
                      placeholder="e.g., ELEC-L3"
                      value={formData.positionCode}
                      onChange={(e) => setFormData({ ...formData, positionCode: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Position Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior Electrician"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Installation">Installation</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Customer Service">Customer Service</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="level">Level *</Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entry">Entry</SelectItem>
                        <SelectItem value="Mid">Mid</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the role and its purpose..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card>
              <CardHeader>
                <CardTitle>Compensation</CardTitle>
                <CardDescription>Salary ranges and pay structure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Salary Type *</Label>
                  <Select value={formData.salaryType} onValueChange={(value) => setFormData({ ...formData, salaryType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="annual">Annual Salary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.salaryType === 'hourly' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hourlyRateMin">Min Hourly Rate ($) *</Label>
                      <Input
                        id="hourlyRateMin"
                        type="number"
                        step="0.01"
                        placeholder="45.00"
                        value={formData.hourlyRateMin}
                        onChange={(e) => setFormData({ ...formData, hourlyRateMin: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourlyRateMax">Max Hourly Rate ($) *</Label>
                      <Input
                        id="hourlyRateMax"
                        type="number"
                        step="0.01"
                        placeholder="55.00"
                        value={formData.hourlyRateMax}
                        onChange={(e) => setFormData({ ...formData, hourlyRateMax: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="annualSalaryMin">Min Annual Salary ($) *</Label>
                      <Input
                        id="annualSalaryMin"
                        type="number"
                        step="1000"
                        placeholder="80000"
                        value={formData.annualSalaryMin}
                        onChange={(e) => setFormData({ ...formData, annualSalaryMin: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="annualSalaryMax">Max Annual Salary ($) *</Label>
                      <Input
                        id="annualSalaryMax"
                        type="number"
                        step="1000"
                        placeholder="100000"
                        value={formData.annualSalaryMax}
                        onChange={(e) => setFormData({ ...formData, annualSalaryMax: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="superannuationRate">Superannuation Rate (%) *</Label>
                    <Input
                      id="superannuationRate"
                      type="number"
                      step="0.1"
                      value={formData.superannuationRate}
                      onChange={(e) => setFormData({ ...formData, superannuationRate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="overtimeRate">Overtime Multiplier</Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      step="0.1"
                      value={formData.overtimeRate}
                      onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overtimeAvailable"
                    checked={formData.overtimeAvailable}
                    onCheckedChange={(checked) => setFormData({ ...formData, overtimeAvailable: checked as boolean })}
                  />
                  <Label htmlFor="overtimeAvailable" className="font-normal cursor-pointer">
                    Overtime available
                  </Label>
                </div>

                <div>
                  <Label htmlFor="bonusStructure">Bonus Structure (Optional)</Label>
                  <Textarea
                    id="bonusStructure"
                    placeholder="Describe performance bonuses, incentives, etc..."
                    value={formData.bonusStructure}
                    onChange={(e) => setFormData({ ...formData, bonusStructure: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
                <CardDescription>Key duties and tasks for this role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {responsibilities.map((resp, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="e.g., Install solar panel systems"
                      value={resp}
                      onChange={(e) => updateArrayItem(setResponsibilities, responsibilities, index, e.target.value)}
                    />
                    {responsibilities.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem(setResponsibilities, responsibilities, index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem(setResponsibilities, responsibilities)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Responsibility
                </Button>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
                <CardDescription>Essential and desirable qualifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Essential Requirements</Label>
                  {essentialReqs.map((req, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="e.g., A-Grade Electrical License"
                        value={req}
                        onChange={(e) => updateArrayItem(setEssentialReqs, essentialReqs, index, e.target.value)}
                      />
                      {essentialReqs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem(setEssentialReqs, essentialReqs, index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(setEssentialReqs, essentialReqs)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Essential Requirement
                  </Button>
                </div>

                <div>
                  <Label className="mb-2 block">Desirable Requirements</Label>
                  {desirableReqs.map((req, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="e.g., Battery installation experience"
                        value={req}
                        onChange={(e) => updateArrayItem(setDesirableReqs, desirableReqs, index, e.target.value)}
                      />
                      {desirableReqs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem(setDesirableReqs, desirableReqs, index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(setDesirableReqs, desirableReqs)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Desirable Requirement
                  </Button>
                </div>

                <div>
                  <Label className="mb-2 block">Required Licenses</Label>
                  {licenses.map((lic, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="e.g., CEC Grid-Connect Accreditation"
                        value={lic}
                        onChange={(e) => updateArrayItem(setLicenses, licenses, index, e.target.value)}
                      />
                      {licenses.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem(setLicenses, licenses, index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(setLicenses, licenses)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add License
                  </Button>
                </div>

                <div>
                  <Label className="mb-2 block">Required Certifications</Label>
                  {certs.map((cert, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="e.g., Working at Heights"
                        value={cert}
                        onChange={(e) => updateArrayItem(setCerts, certs, index, e.target.value)}
                      />
                      {certs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem(setCerts, certs, index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(setCerts, certs)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Certification
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>Work schedule and arrangements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employment Type *</Label>
                    <Select value={formData.employmentType} onValueChange={(value) => setFormData({ ...formData, employmentType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full-time</SelectItem>
                        <SelectItem value="PART_TIME">Part-time</SelectItem>
                        <SelectItem value="CASUAL">Casual</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hoursPerWeek">Hours per Week *</Label>
                    <Input
                      id="hoursPerWeek"
                      type="number"
                      step="0.5"
                      value={formData.hoursPerWeek}
                      onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="workSchedule">Work Schedule</Label>
                  <Input
                    id="workSchedule"
                    placeholder="e.g., Monday-Friday, 7:00am-3:30pm (9-day fortnight)"
                    value={formData.workSchedule}
                    onChange={(e) => setFormData({ ...formData, workSchedule: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rdoAvailable"
                    checked={formData.rdoAvailable}
                    onCheckedChange={(checked) => setFormData({ ...formData, rdoAvailable: checked as boolean })}
                  />
                  <Label htmlFor="rdoAvailable" className="font-normal cursor-pointer">
                    RDO (Rostered Day Off) available
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Work Location */}
            <Card>
              <CardHeader>
                <CardTitle>Work Location & Travel</CardTitle>
                <CardDescription>Where this role is based and travel requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Work Locations</Label>
                  {locations.map((loc, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="e.g., Perth, Joondalup"
                        value={loc}
                        onChange={(e) => updateArrayItem(setLocations, locations, index, e.target.value)}
                      />
                      {locations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem(setLocations, locations, index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem(setLocations, locations)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="travelRequired"
                    checked={formData.travelRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, travelRequired: checked as boolean })}
                  />
                  <Label htmlFor="travelRequired" className="font-normal cursor-pointer">
                    Travel required
                  </Label>
                </div>

                {formData.travelRequired && (
                  <div>
                    <Label htmlFor="travelDetails">Travel Details</Label>
                    <Textarea
                      id="travelDetails"
                      placeholder="Describe travel requirements..."
                      value={formData.travelDetails}
                      onChange={(e) => setFormData({ ...formData, travelDetails: e.target.value })}
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Position visibility and availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                  />
                  <Label htmlFor="isActive" className="font-normal cursor-pointer">
                    Active (can be assigned to staff)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked as boolean })}
                  />
                  <Label htmlFor="isPublic" className="font-normal cursor-pointer">
                    Public (show on careers page)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link href="/admin/dashboard/positions">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving}
                className="bg-coral hover:bg-coral-600"
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Position
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
