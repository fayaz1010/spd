
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, startOfDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Type-safe wrapper for Calendar
const Calendar: any = BigCalendar;
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Filter, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    jobId: string;
    jobNumber: string;
    status: string;
    teamId: string | null;
    teamName: string | null;
    teamColor: string | null;
    subcontractorName: string | null;
    customerName: string;
    systemSize: number;
    address: string;
  };
}

interface Team {
  id: string;
  name: string;
  color: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedTeam !== 'all') params.append('teamId', selectedTeam);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await fetch(`/api/admin/calendar/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch calendar data');

      const data = await response.json();
      
      // Convert date strings to Date objects
      const formattedEvents = data.events.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      
      setEvents(formattedEvents);
      setTeams(data.teams);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, selectedStatus]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  // Handle slot selection (create new event)
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    // Could implement quick job creation here
    console.log('Slot selected:', slotInfo);
  };

  // Event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    const teamColor = event.resource.teamColor || '#3b82f6';
    const statusColors: Record<string, string> = {
      PENDING_SCHEDULE: '#eab308',
      SCHEDULED: '#3b82f6',
      SUB_CONFIRMED: '#10b981',
      MATERIALS_READY: '#8b5cf6',
      IN_PROGRESS: '#f59e0b',
      COMPLETED: '#22c55e',
      CANCELLED: '#6b7280',
    };

    const backgroundColor = event.resource.teamName
      ? teamColor
      : statusColors[event.resource.status] || '#64748b';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.85rem',
        padding: '2px 5px',
      },
    };
  };

  // Custom event wrapper
  const EventComponent = ({ event }: any): React.ReactElement | null => {
    if (!event) return null;
    return (
      <div className="flex items-center gap-1 overflow-hidden">
        <span className="font-medium truncate">{event.title}</span>
        {event.resource?.systemSize && (
          <span className="text-xs opacity-75">({event.resource.systemSize}kW)</span>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Installation Calendar
          </h1>
          <p className="text-muted-foreground">
            Manage and schedule all installation jobs
          </p>
        </div>
        <Button onClick={fetchCalendarData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    {team.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="SUB_CONFIRMED">Sub Confirmed</SelectItem>
              <SelectItem value="MATERIALS_READY">Materials Ready</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium">Legend:</span>
          {teams.slice(0, 5).map((team) => (
            <div key={team.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: team.color }}
              />
              <span className="text-sm">{team.name}</span>
            </div>
          ))}
          {!selectedTeam || selectedTeam === 'all' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span className="text-sm">Unassigned</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Calendar */}
      <Card className="p-4">
        <div style={{ height: '700px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              eventPropGetter={eventStyleGetter as any}
              components={{
                event: EventComponent as any,
              }}
              selectable
              popup
              style={{ height: '100%' }}
            />
          )}
        </div>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Job Number</p>
                <p className="font-medium">{selectedEvent.resource.jobNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{selectedEvent.resource.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{selectedEvent.resource.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Size</p>
                <p className="font-medium">{selectedEvent.resource.systemSize} kW</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="font-medium">
                  {selectedEvent.resource.teamName || selectedEvent.resource.subcontractorName || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge>{selectedEvent.resource.status.replace(/_/g, ' ')}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="font-medium">
                  {format(selectedEvent.start, 'PPP')} at {format(selectedEvent.start, 'p')}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  window.location.href = `/admin/jobs/${selectedEvent.resource.jobId}`;
                }}
              >
                View Full Details
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
