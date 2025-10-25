'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface ServiceBooking {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  source: string;
  status: string;
  notes: string;
  metadata: {
    serviceId?: string;
    serviceName?: string;
    bookingType?: string;
    requestedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  PROPOSAL: 'bg-purple-100 text-purple-800',
  WON: 'bg-green-500 text-white',
  LOST: 'bg-red-100 text-red-800',
};

const STATUS_ICONS: Record<string, any> = {
  NEW: Clock,
  CONTACTED: Phone,
  QUALIFIED: CheckCircle,
  PROPOSAL: Mail,
  WON: CheckCircle,
  LOST: XCircle,
};

export default function ServiceBookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // Fetch leads where metadata.bookingType = 'extra_service'
      const response = await fetch('/api/admin/leads?bookingType=extra_service');
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.leads || []);
      } else {
        toast.error('Failed to load bookings');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone.includes(searchTerm) ||
      (booking.metadata?.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/dashboard/website/extra-services')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Extra Services
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Bookings</h1>
              <p className="text-gray-600 mt-1">Manage extra service booking requests</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {filteredBookings.length} Booking{filteredBookings.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by name, email, phone, or service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500">Loading bookings...</div>
            </CardContent>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500">No service bookings found</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const StatusIcon = STATUS_ICONS[booking.status] || Clock;
              
              return (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">
                            {booking.firstName} {booking.lastName}
                          </h3>
                          <Badge className={STATUS_COLORS[booking.status]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {booking.status}
                          </Badge>
                          {booking.metadata?.serviceName && (
                            <Badge variant="outline">
                              {booking.metadata.serviceName}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${booking.email}`} className="hover:text-primary">
                              {booking.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${booking.phone}`} className="hover:text-primary">
                              {booking.phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{booking.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(booking.createdAt)}</span>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                            <strong>Notes:</strong> {booking.notes}
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/dashboard/crm/leads/${booking.id}`)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View in CRM
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
