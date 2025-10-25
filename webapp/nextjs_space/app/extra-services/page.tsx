'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Wrench,
  Home,
  Video,
  Lock,
  Shield,
  Zap,
  Wind,
  Droplet,
  Lightbulb,
  Check,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Search,
  ChevronRight,
  Loader2,
  Sun,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  imageUrl?: string;
  specifications: {
    addonCategory: string;
    serviceType: string;
    benefits: string[];
    iconName: string;
    duration: string;
    serviceArea: string;
  };
  isRecommended: boolean;
  retailPrice: number;
  installationCost: number;
  totalCost: number;
}

const ICON_MAP: Record<string, any> = {
  Wrench,
  Home,
  Video,
  Lock,
  Shield,
  Zap,
  Wind,
  Droplet,
  Lightbulb,
};

const SERVICE_TYPES: Record<string, { label: string; icon: any; color: string }> = {
  roof_gutter: { label: 'Roof & Gutter', icon: Home, color: 'blue' },
  security: { label: 'Security', icon: Shield, color: 'red' },
  electrical: { label: 'Electrical', icon: Zap, color: 'yellow' },
  hvac: { label: 'HVAC', icon: Wind, color: 'cyan' },
};

export default function ExtraServicesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    message: '',
  });

  useEffect(() => {
    loadServices();
  }, []);

  // Auto-open booking form if 'book' query parameter is present
  useEffect(() => {
    const bookServiceId = searchParams.get('book');
    if (bookServiceId && services.length > 0) {
      const service = services.find(s => s.id === bookServiceId);
      if (service) {
        handleBooking(service);
      }
    }
  }, [searchParams, services]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/extra-services');
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = (service: Service) => {
    setSelectedService(service);
    setShowBookingForm(true);
  };

  const handleCloseBookingForm = () => {
    setShowBookingForm(false);
    setSelectedService(null);
    // Clear the 'book' query parameter from URL
    router.push('/extra-services');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const response = await fetch('/api/extra-services/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService?.id,
          serviceName: selectedService?.name,
          ...formData,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Booking request submitted! We\'ll contact you soon.');
        handleCloseBookingForm();
        setFormData({ name: '', email: '', phone: '', address: '', message: '' });
      } else {
        toast.error('Failed to submit booking');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Error submitting booking');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesType = selectedType === 'all' || service.specifications.serviceType === selectedType;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (showBookingForm && selectedService) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Button
            variant="outline"
            onClick={handleCloseBookingForm}
            className="mb-6"
          >
            ← Back to Services
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Book {selectedService.name}</CardTitle>
              <CardDescription>
                Fill out the form below and we'll contact you to schedule your service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <Input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0400 000 000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Service Address *</label>
                  <Input
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, Perth WA 6000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Additional Details</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Any specific requirements or questions..."
                    rows={4}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Service:</span>
                    <span>{selectedService.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Price:</span>
                    <span className="text-lg font-bold text-coral">
                      {formatCurrency(selectedService.totalCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Duration:</span>
                    <span>{selectedService.specifications.duration}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Booking Request
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-2">
              <Sun className="h-10 w-10 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold text-primary">Sun Direct Power</h1>
                <p className="text-xs text-muted-foreground">Perth's Solar Experts</p>
              </div>
            </Link>
            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/#rebates" className="text-sm font-medium hover:text-coral transition-colors">
                Rebates
              </Link>
              <Link href="/#how-it-works" className="text-sm font-medium hover:text-coral transition-colors">
                How It Works
              </Link>
              <Link href="/#testimonials" className="text-sm font-medium hover:text-coral transition-colors">
                Reviews
              </Link>
              <Link href="/extra-services" className="text-sm font-medium text-coral">
                Services
              </Link>
              <Link href="/blog" className="text-sm font-medium hover:text-coral transition-colors">
                Blog
              </Link>
              <Link href="/gallery" className="text-sm font-medium hover:text-coral transition-colors">
                Gallery
              </Link>
              <Link href="/shop" className="text-sm font-medium hover:text-coral transition-colors">
                Shop
              </Link>
              <Link href="/careers" className="text-sm font-medium hover:text-coral transition-colors">
                Careers
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Login
                </Button>
              </Link>
              <Link href="/calculator-v2">
                <Button className="bg-coral hover:bg-coral-600 text-white">
                  Get Quote
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Extra Services</h1>
            <p className="text-xl text-blue-100 mb-8">
              Professional home services beyond solar installations
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>Perth Metro</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <span>1300 786 347</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span>services@sundirectpower.com.au</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedType('all')}
              className={selectedType === 'all' ? 'bg-gradient-to-r from-coral to-orange-600' : ''}
            >
              All Services
            </Button>
            {Object.entries(SERVICE_TYPES).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  onClick={() => setSelectedType(type)}
                  className={selectedType === type ? 'bg-gradient-to-r from-coral to-orange-600' : ''}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-coral" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => {
              const Icon = ICON_MAP[service.specifications.iconName] || Wrench;
              const serviceType = SERVICE_TYPES[service.specifications.serviceType];
              
              return (
                <Card key={service.id} className="hover:shadow-lg transition-shadow overflow-hidden group">
                  <Link href={`/services/${service.id}`}>
                    {/* Service Image */}
                    {service.imageUrl && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {service.isRecommended && (
                          <Badge className="absolute top-3 right-3 bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <CardHeader>
                      {!service.imageUrl && (
                        <div className="flex items-start justify-between mb-2">
                          <div className="bg-gradient-to-br from-coral to-orange-600 rounded-lg p-3 group-hover:scale-110 transition-transform">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          {service.isRecommended && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      )}
                      <CardTitle className="text-xl group-hover:text-coral transition-colors">{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                  </Link>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Benefits */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">What's Included:</h4>
                        <ul className="space-y-1">
                          {service.specifications.benefits.slice(0, 3).map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{service.specifications.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{service.specifications.serviceArea}</span>
                        </div>
                      </div>

                      {/* Price & CTA */}
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-600">Starting from</span>
                          <span className="text-2xl font-bold text-coral">
                            {formatCurrency(service.totalCost)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/services/${service.id}`} className="flex-1">
                            <Button
                              variant="outline"
                              className="w-full border-coral text-coral hover:bg-coral hover:text-white"
                            >
                              View Details
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                          <Button
                            onClick={() => handleBooking(service)}
                            className="flex-1 bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700"
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredServices.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No services found matching your search</p>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Licensed & Insured</h3>
                <p className="text-sm text-gray-600">
                  All our technicians are fully licensed and insured
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold mb-2">Quality Guaranteed</h3>
                <p className="text-sm text-gray-600">
                  We stand behind our work with comprehensive warranties
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Fast Response</h3>
                <p className="text-sm text-gray-600">
                  Quick quotes and flexible scheduling to suit you
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
