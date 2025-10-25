'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Award,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

interface Vacancy {
  id: string;
  vacancyCode: string;
  openings: number;
  closingDate: string | null;
  startDate: string | null;
  customTitle: string | null;
  customDescription: string | null;
  requireCoverLetter: boolean;
  requireResume: boolean;
  screeningQuestions: any[];
  position: {
    title: string;
    department: string;
    level: string;
    description: string;
    responsibilities: string[];
    essentialRequirements: string[];
    desirableRequirements: string[];
    requiredLicenses: string[];
    requiredCerts: string[];
    salaryType: string;
    hourlyRateMin?: number;
    hourlyRateMax?: number;
    annualSalaryMin?: number;
    annualSalaryMax?: number;
    superannuationRate: number;
    overtimeAvailable: boolean;
    overtimeRate?: number;
    bonusStructure?: string;
    benefits: any[];
    employmentType: string;
    hoursPerWeek: number;
    workSchedule?: string;
    rdoAvailable: boolean;
    workLocations: string[];
    travelRequired: boolean;
    travelDetails?: string;
    physicalRequirements: string[];
    isPublic: boolean;
  };
}

export default function VacancyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVacancy();
  }, [params.id]);

  const fetchVacancy = async () => {
    try {
      const response = await fetch(`/api/careers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setVacancy(data.vacancy);
      } else {
        router.push('/careers');
      }
    } catch (error) {
      console.error('Error fetching vacancy:', error);
      router.push('/careers');
    } finally {
      setLoading(false);
    }
  };

  const getSalaryDisplay = () => {
    if (!vacancy) return '';
    if (!vacancy.position.isPublic) return 'Competitive salary package';
    
    if (vacancy.position.salaryType === 'hourly') {
      return `$${vacancy.position.hourlyRateMin} - $${vacancy.position.hourlyRateMax} per hour`;
    } else {
      return `$${vacancy.position.annualSalaryMin?.toLocaleString()} - $${vacancy.position.annualSalaryMax?.toLocaleString()} per year`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/careers">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Careers
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">
                {vacancy.customTitle || vacancy.position.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="text-sm">
                  {vacancy.position.department}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {vacancy.position.level}
                </Badge>
                <Badge className="bg-green-100 text-green-800 text-sm">
                  {vacancy.openings} {vacancy.openings === 1 ? 'Opening' : 'Openings'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-medium">{getSalaryDisplay()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{vacancy.position.employmentType.replace('_', ' ')} • {vacancy.position.hoursPerWeek}hrs/week</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{vacancy.position.workLocations.join(', ') || 'Perth, WA'}</span>
                </div>
                {vacancy.closingDate && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Calendar className="h-5 w-5" />
                    <span>Closes {format(new Date(vacancy.closingDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
            <Link href={`/careers/${vacancy.id}/apply`}>
              <Button size="lg" className="ml-4">
                Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About the Role */}
            <Card>
              <CardHeader>
                <CardTitle>About the Role</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">
                  {vacancy.customDescription || vacancy.position.description}
                </p>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            {vacancy.position.responsibilities && vacancy.position.responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {vacancy.position.responsibilities.map((resp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vacancy.position.essentialRequirements && vacancy.position.essentialRequirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Essential</h4>
                    <ul className="space-y-2">
                      {vacancy.position.essentialRequirements.map((req: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {vacancy.position.desirableRequirements && vacancy.position.desirableRequirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Desirable</h4>
                    <ul className="space-y-2">
                      {vacancy.position.desirableRequirements.map((req: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Licenses & Certifications */}
            {(vacancy.position.requiredLicenses?.length > 0 || vacancy.position.requiredCerts?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Required Licenses & Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vacancy.position.requiredLicenses?.map((license: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{license}</Badge>
                    ))}
                    {vacancy.position.requiredCerts?.map((cert: string, idx: number) => (
                      <Badge key={idx} variant="outline">{cert}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Compensation & Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Compensation & Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Base Salary</p>
                  <p className="font-semibold">{getSalaryDisplay()}</p>
                </div>
                {vacancy.position.isPublic && (
                  <div>
                    <p className="text-sm text-gray-600">Superannuation</p>
                    <p className="font-semibold">{vacancy.position.superannuationRate}%</p>
                  </div>
                )}
                {vacancy.position.overtimeAvailable && (
                  <div>
                    <p className="text-sm text-gray-600">Overtime</p>
                    <p className="font-semibold">{vacancy.position.overtimeRate}x rate</p>
                  </div>
                )}
                {vacancy.position.bonusStructure && (
                  <div>
                    <p className="text-sm text-gray-600">Bonuses</p>
                    <p className="text-sm">{vacancy.position.bonusStructure}</p>
                  </div>
                )}
                {vacancy.position.benefits && vacancy.position.benefits.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Additional Benefits</p>
                    <div className="space-y-1">
                      {vacancy.position.benefits.map((benefit: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span className="text-sm">{benefit.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work Details */}
            <Card>
              <CardHeader>
                <CardTitle>Work Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Schedule</p>
                  <p className="font-medium">{vacancy.position.workSchedule || 'Standard hours'}</p>
                </div>
                {vacancy.position.rdoAvailable && (
                  <div>
                    <p className="text-gray-600">RDO</p>
                    <p className="font-medium">9-day fortnight available</p>
                  </div>
                )}
                {vacancy.position.travelRequired && (
                  <div>
                    <p className="text-gray-600">Travel</p>
                    <p className="font-medium">{vacancy.position.travelDetails || 'Required'}</p>
                  </div>
                )}
                {vacancy.startDate && (
                  <div>
                    <p className="text-gray-600">Start Date</p>
                    <p className="font-medium">{format(new Date(vacancy.startDate), 'MMM dd, yyyy')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Apply Button */}
            <Link href={`/careers/${vacancy.id}/apply`}>
              <Button size="lg" className="w-full">
                Apply for this Position
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
