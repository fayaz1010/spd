'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Search,
  ArrowRight,
  Calendar,
  Users,
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
  publishedAt: string;
  position: {
    id: string;
    title: string;
    department: string;
    level: string;
    description: string;
    salaryType: string;
    hourlyRateMin?: number;
    hourlyRateMax?: number;
    annualSalaryMin?: number;
    annualSalaryMax?: number;
    employmentType: string;
    hoursPerWeek: number;
    workLocations: string[];
    benefits: any[];
    isPublic: boolean;
  };
}

export default function CareersPage() {
  const router = useRouter();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [filteredVacancies, setFilteredVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchVacancies();
  }, []);

  useEffect(() => {
    filterVacancies();
  }, [vacancies, searchTerm, departmentFilter]);

  const fetchVacancies = async () => {
    try {
      const response = await fetch('/api/careers');
      if (response.ok) {
        const data = await response.json();
        setVacancies(data.vacancies || []);
      }
    } catch (error) {
      console.error('Error fetching vacancies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVacancies = () => {
    let filtered = [...vacancies];

    if (searchTerm) {
      filtered = filtered.filter(v =>
        (v.customTitle || v.position.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.position.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(v => v.position.department === departmentFilter);
    }

    setFilteredVacancies(filtered);
  };

  const getDepartments = () => {
    const depts = new Set(vacancies.map(v => v.position.department));
    return Array.from(depts);
  };

  const getSalaryDisplay = (position: Vacancy['position']) => {
    if (!position.isPublic) return 'Competitive';
    
    if (position.salaryType === 'hourly') {
      return `$${position.hourlyRateMin} - $${position.hourlyRateMax}/hr`;
    } else {
      return `$${position.annualSalaryMin?.toLocaleString()} - $${position.annualSalaryMax?.toLocaleString()}/yr`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Join Our Team</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Build a brighter future with Western Australia's leading solar installation company
            </p>
            <div className="flex items-center justify-center gap-8 text-blue-100">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <span>{vacancies.length} Open Positions</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Growing Team</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Perth, WA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-64 h-12">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {getDepartments().map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vacancies Grid */}
        {filteredVacancies.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No positions found</h3>
            <p className="text-gray-500">
              {searchTerm || departmentFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Check back soon for new opportunities'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVacancies.map((vacancy) => (
              <Card key={vacancy.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2 group-hover:text-blue-600 transition-colors">
                        {vacancy.customTitle || vacancy.position.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary">{vacancy.position.department}</Badge>
                        <Badge variant="outline">{vacancy.position.level}</Badge>
                        <Badge className="bg-green-100 text-green-800">
                          {vacancy.openings} {vacancy.openings === 1 ? 'Opening' : 'Openings'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {vacancy.customDescription || vacancy.position.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">{getSalaryDisplay(vacancy.position)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{vacancy.position.employmentType.replace('_', ' ')} • {vacancy.position.hoursPerWeek}hrs/week</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{vacancy.position.workLocations.join(', ') || 'Perth, WA'}</span>
                    </div>
                    {vacancy.closingDate && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Calendar className="h-4 w-4" />
                        <span>Closes {format(new Date(vacancy.closingDate), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  {vacancy.position.benefits && vacancy.position.benefits.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Benefits Include:</p>
                      <div className="flex flex-wrap gap-1">
                        {vacancy.position.benefits.slice(0, 3).map((benefit: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {benefit.type}
                          </Badge>
                        ))}
                        {vacancy.position.benefits.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{vacancy.position.benefits.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Link href={`/careers/${vacancy.id}`}>
                    <Button className="w-full group-hover:bg-blue-700 transition-colors">
                      View Details & Apply
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Why Join Us Section */}
      <div className="bg-gray-50 py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Join SunDirect Power?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Great Team Culture</h3>
              <p className="text-gray-600">
                Work with passionate professionals in a supportive environment
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Competitive Compensation</h3>
              <p className="text-gray-600">
                Industry-leading pay, bonuses, and comprehensive benefits
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Career Growth</h3>
              <p className="text-gray-600">
                Clear progression paths and ongoing training opportunities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
