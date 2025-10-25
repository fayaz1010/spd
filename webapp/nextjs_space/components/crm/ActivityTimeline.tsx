'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Eye, 
  CheckCircle, 
  DollarSign,
  MapPin,
  MessageSquare,
  TrendingUp,
  User,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: Date | string;
  completedAt?: Date | string;
  performer: {
    name: string;
    email: string;
  };
  duration?: number;
  outcome?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
  onAddActivity?: () => void;
}

const ACTIVITY_ICONS: Record<string, any> = {
  EMAIL_SENT: Mail,
  EMAIL_RECEIVED: Mail,
  CALL_MADE: Phone,
  CALL_RECEIVED: Phone,
  MEETING_SCHEDULED: Calendar,
  MEETING_COMPLETED: Calendar,
  PROPOSAL_SENT: FileText,
  PROPOSAL_VIEWED: Eye,
  PROPOSAL_SIGNED: CheckCircle,
  QUOTE_GENERATED: FileText,
  SITE_VISIT: MapPin,
  NOTE_ADDED: MessageSquare,
  STAGE_CHANGED: TrendingUp,
  PAYMENT_RECEIVED: DollarSign,
};

const ACTIVITY_COLORS: Record<string, string> = {
  EMAIL_SENT: 'bg-blue-100 text-blue-600',
  EMAIL_RECEIVED: 'bg-blue-100 text-blue-600',
  CALL_MADE: 'bg-green-100 text-green-600',
  CALL_RECEIVED: 'bg-green-100 text-green-600',
  MEETING_SCHEDULED: 'bg-purple-100 text-purple-600',
  MEETING_COMPLETED: 'bg-purple-100 text-purple-600',
  PROPOSAL_SENT: 'bg-orange-100 text-orange-600',
  PROPOSAL_VIEWED: 'bg-yellow-100 text-yellow-600',
  PROPOSAL_SIGNED: 'bg-green-100 text-green-600',
  QUOTE_GENERATED: 'bg-indigo-100 text-indigo-600',
  SITE_VISIT: 'bg-pink-100 text-pink-600',
  NOTE_ADDED: 'bg-gray-100 text-gray-600',
  STAGE_CHANGED: 'bg-blue-100 text-blue-600',
  PAYMENT_RECEIVED: 'bg-green-100 text-green-600',
};

export function ActivityTimeline({ activities, onAddActivity }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    const Icon = ACTIVITY_ICONS[type] || MessageSquare;
    return Icon;
  };

  const getActivityColor = (type: string) => {
    return ACTIVITY_COLORS[type] || 'bg-gray-100 text-gray-600';
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  };

  if (activities.length === 0) {
    return (
      <Card className="p-6 text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">No activities yet</p>
        {onAddActivity && (
          <Button onClick={onAddActivity}>
            Add First Activity
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activity Timeline</h3>
        {onAddActivity && (
          <Button onClick={onAddActivity} size="sm">
            Add Activity
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Activities */}
        <div className="space-y-6">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <div key={activity.id} className="relative flex gap-4">
                {/* Icon */}
                <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${colorClass} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <Card className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{activity.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {formatActivityType(activity.type)}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{activity.performer.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(activity.createdAt)}</span>
                    </div>
                    {activity.duration && (
                      <div className="flex items-center gap-1">
                        <span>{activity.duration} min</span>
                      </div>
                    )}
                  </div>

                  {/* Outcome */}
                  {activity.outcome && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm">
                        <span className="font-medium">Outcome:</span> {activity.outcome}
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
