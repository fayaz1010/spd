'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Globe,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  ExternalLink,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

interface Platform {
  name: string;
  url: string;
  postedDate: string;
}

interface ForeignApplicantTrackerProps {
  vacancy: {
    id: string;
    vacancyCode: string;
    allowForeignApplicants: boolean;
    advertisingStartDate: string | null;
    advertisingPlatforms: Platform[];
    sponsorFeePaid: boolean;
    sponsorFeePaidDate: string | null;
    sponsorFeeAmount: number | null;
    nominationFeePaid: boolean;
    nominationFeePaidDate: string | null;
    nominationFeeAmount: number | null;
    safLevyPaid: boolean;
    safLevyPaidDate: string | null;
    safLevyAmount: number | null;
    foreignEligibilityDate: string | null;
    position: {
      title: string;
      positionCode: string;
    };
  };
  onUpdate: () => void;
}

export function ForeignApplicantTracker({ vacancy, onUpdate }: ForeignApplicantTrackerProps) {
  const { toast } = useToast();
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isEligible, setIsEligible] = useState(false);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newPlatform, setNewPlatform] = useState({ name: '', url: '', postedDate: '' });

  // Check if position is electrician
  const isElectricianPosition = () => {
    const code = vacancy.position.positionCode.toUpperCase();
    const title = vacancy.position.title.toUpperCase();
    return code.includes('ELEC') || title.includes('ELECTRICIAN');
  };

  useEffect(() => {
    if (vacancy.advertisingStartDate) {
      const startDate = new Date(vacancy.advertisingStartDate);
      const eligibilityDate = addDays(startDate, 28);
      const today = new Date();
      const remaining = differenceInDays(eligibilityDate, today);
      
      setDaysRemaining(Math.max(0, remaining));
      setProgress(Math.min(100, ((28 - remaining) / 28) * 100));
      
      // Check all eligibility criteria
      const platformsOk = (vacancy.advertisingPlatforms?.length || 0) >= 3;
      const feesOk = vacancy.sponsorFeePaid && vacancy.nominationFeePaid && vacancy.safLevyPaid;
      const timeOk = remaining <= 0;
      
      setIsEligible(platformsOk && feesOk && timeOk);
    }
  }, [vacancy]);

  const handleStartAdvertising = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/vacancies/${vacancy.id}/foreign-tracking`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advertisingStartDate: new Date().toISOString(),
          foreignEligibilityDate: addDays(new Date(), 28).toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: '28-day countdown started',
        });
        onUpdate();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start countdown',
        variant: 'destructive',
      });
    }
  };

  const handleAddPlatform = async () => {
    if (!newPlatform.name || !newPlatform.url || !newPlatform.postedDate) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const platforms = [...(vacancy.advertisingPlatforms || []), newPlatform];
      
      const response = await fetch(`/api/admin/vacancies/${vacancy.id}/foreign-tracking`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ advertisingPlatforms: platforms }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Platform added',
        });
        setNewPlatform({ name: '', url: '', postedDate: '' });
        setShowAddPlatform(false);
        onUpdate();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add platform',
        variant: 'destructive',
      });
    }
  };

  const handleMarkFeePaid = async (feeType: 'sponsor' | 'nomination' | 'saf', amount: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/vacancies/${vacancy.id}/foreign-tracking`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [`${feeType}FeePaid`]: true,
          [`${feeType}FeePaidDate`]: new Date().toISOString(),
          [`${feeType}FeeAmount`]: amount,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${feeType.charAt(0).toUpperCase() + feeType.slice(1)} fee marked as paid`,
        });
        onUpdate();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update fee status',
        variant: 'destructive',
      });
    }
  };

  if (!isElectricianPosition()) {
    return null; // Only show for electrician positions
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          Foreign Applicant Eligibility (482 Visa Sponsorship)
        </CardTitle>
        <CardDescription>
          Labour Market Testing (LMT) - Track 28-day advertising period and prerequisites
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Countdown Timer */}
        {vacancy.advertisingStartDate ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="font-semibold">28-Day Countdown:</span>
              </div>
              <Badge variant={daysRemaining === 0 ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                {daysRemaining === 0 ? '✅ Complete' : `${daysRemaining} days remaining`}
              </Badge>
            </div>
            
            <Progress value={progress} className="h-3" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Started:</span>
                <span className="ml-2 font-medium">
                  {format(new Date(vacancy.advertisingStartDate), 'MMM dd, yyyy')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Eligible:</span>
                <span className="ml-2 font-medium">
                  {vacancy.foreignEligibilityDate && format(new Date(vacancy.foreignEligibilityDate), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">28-day advertising period not started</p>
            <Button onClick={handleStartAdvertising}>
              <Clock className="h-4 w-4 mr-2" />
              Start 28-Day Countdown
            </Button>
          </div>
        )}

        {/* Platform Tracking */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              {(vacancy.advertisingPlatforms?.length || 0) >= 3 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Advertising Platforms ({vacancy.advertisingPlatforms?.length || 0}/3)
            </h4>
            <Dialog open={showAddPlatform} onOpenChange={setShowAddPlatform}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Platform
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Advertising Platform</DialogTitle>
                  <DialogDescription>
                    Record where you've posted this job advertisement
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Platform Name</Label>
                    <Input
                      placeholder="e.g., Seek, Indeed, LinkedIn"
                      value={newPlatform.name}
                      onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Post URL</Label>
                    <Input
                      placeholder="https://..."
                      value={newPlatform.url}
                      onChange={(e) => setNewPlatform({ ...newPlatform, url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Posted Date</Label>
                    <Input
                      type="date"
                      value={newPlatform.postedDate}
                      onChange={(e) => setNewPlatform({ ...newPlatform, postedDate: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddPlatform} className="w-full">
                    Add Platform
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {vacancy.advertisingPlatforms && vacancy.advertisingPlatforms.length > 0 ? (
            <div className="space-y-2">
              {vacancy.advertisingPlatforms.map((platform, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{platform.name}</span>
                    <span className="text-sm text-gray-600">
                      - Posted {format(new Date(platform.postedDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <a href={platform.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No platforms added yet</p>
          )}
        </div>

        {/* Fee Tracking */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            {vacancy.sponsorFeePaid && vacancy.nominationFeePaid && vacancy.safLevyPaid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            Fee Requirements (
            {[vacancy.sponsorFeePaid, vacancy.nominationFeePaid, vacancy.safLevyPaid].filter(Boolean).length}/3)
          </h4>
          
          <div className="space-y-2">
            {/* Sponsor Fee */}
            <div className={`p-3 rounded-lg border ${vacancy.sponsorFeePaid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {vacancy.sponsorFeePaid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">Sponsor Fee</span>
                </div>
                {vacancy.sponsorFeePaid ? (
                  <span className="text-sm text-green-700">
                    ${vacancy.sponsorFeeAmount} - Paid {vacancy.sponsorFeePaidDate && format(new Date(vacancy.sponsorFeePaidDate), 'MMM dd, yyyy')}
                  </span>
                ) : (
                  <Button size="sm" onClick={() => handleMarkFeePaid('sponsor', 420)}>
                    Mark as Paid ($420)
                  </Button>
                )}
              </div>
            </div>

            {/* Nomination Fee */}
            <div className={`p-3 rounded-lg border ${vacancy.nominationFeePaid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {vacancy.nominationFeePaid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">Nomination Fee</span>
                </div>
                {vacancy.nominationFeePaid ? (
                  <span className="text-sm text-green-700">
                    ${vacancy.nominationFeeAmount} - Paid {vacancy.nominationFeePaidDate && format(new Date(vacancy.nominationFeePaidDate), 'MMM dd, yyyy')}
                  </span>
                ) : (
                  <Button size="sm" onClick={() => handleMarkFeePaid('nomination', 540)}>
                    Mark as Paid ($540)
                  </Button>
                )}
              </div>
            </div>

            {/* SAF Levy */}
            <div className={`p-3 rounded-lg border ${vacancy.safLevyPaid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {vacancy.safLevyPaid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">SAF Levy</span>
                </div>
                {vacancy.safLevyPaid ? (
                  <span className="text-sm text-green-700">
                    ${vacancy.safLevyAmount} - Paid {vacancy.safLevyPaidDate && format(new Date(vacancy.safLevyPaidDate), 'MMM dd, yyyy')}
                  </span>
                ) : (
                  <Button size="sm" onClick={() => handleMarkFeePaid('saf', 1200)}>
                    Mark as Paid ($1,200)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Eligibility Status */}
        <div className={`p-4 rounded-lg border-2 ${isEligible ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
          <div className="flex items-center gap-3">
            {isEligible ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Eligible for Foreign Applicants</p>
                  <p className="text-sm text-green-700">All requirements met - overseas candidates can now apply</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900">Not Yet Eligible</p>
                  <p className="text-sm text-yellow-700">
                    {daysRemaining > 0 && `${daysRemaining} days remaining. `}
                    {(vacancy.advertisingPlatforms?.length || 0) < 3 && `Need ${3 - (vacancy.advertisingPlatforms?.length || 0)} more platforms. `}
                    {!vacancy.sponsorFeePaid && 'Sponsor fee pending. '}
                    {!vacancy.nominationFeePaid && 'Nomination fee pending. '}
                    {!vacancy.safLevyPaid && 'SAF levy pending.'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
