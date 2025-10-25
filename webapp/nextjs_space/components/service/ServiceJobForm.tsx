'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ServiceJobFormProps {
  installationJobId?: string;
  customerId?: string;
  onSuccess?: (jobId: string) => void;
  onCancel?: () => void;
}

export function ServiceJobForm({ 
  installationJobId, 
  customerId, 
  onSuccess, 
  onCancel 
}: ServiceJobFormProps) {
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceType: 'MAINTENANCE',
    priority: 'MEDIUM',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/service/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          installationJobId,
          customerId,
          scheduledDate: scheduledDate?.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create service job');

      const data = await response.json();
      
      toast({
        title: 'Service Job Created',
        description: 'Service job has been created successfully',
      });

      onSuccess?.(data.job.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create service job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-primary rounded-full p-3">
          <Wrench className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Create Service Job</h2>
          <p className="text-sm text-gray-600">Schedule maintenance or repair work</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Annual maintenance check"
            required
          />
        </div>

        {/* Service Type */}
        <div>
          <Label htmlFor="serviceType">Service Type *</Label>
          <Select
            value={formData.serviceType}
            onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="REPAIR">Repair</SelectItem>
              <SelectItem value="INSPECTION">Inspection</SelectItem>
              <SelectItem value="UPGRADE">Upgrade</SelectItem>
              <SelectItem value="WARRANTY">Warranty Work</SelectItem>
              <SelectItem value="EMERGENCY">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div>
          <Label htmlFor="priority">Priority *</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scheduled Date */}
        <div>
          <Label>Scheduled Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={setScheduledDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the service work needed..."
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-primary"
          >
            {loading ? 'Creating...' : 'Create Service Job'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
