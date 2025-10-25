'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  DollarSign, 
  Zap, 
  TrendingUp,
  Phone,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface DealCardProps {
  deal: {
    id: string;
    title: string;
    value: number;
    probability: number;
    leadScore: number;
    lead: {
      name: string;
      email: string;
      phone: string;
      systemSizeKw: number;
    };
    owner: {
      name: string;
    };
  };
  isDragging?: boolean;
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 75) return 'text-green-600';
    if (prob >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/admin/crm/deals/${deal.id}`}>
        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                {deal.title}
              </h4>
              <p className="text-xs text-gray-600">{deal.lead.name}</p>
            </div>
            <Badge className={getScoreColor(deal.leadScore)}>
              {deal.leadScore}
            </Badge>
          </div>

          {/* Value & System Size */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold">
                ${(deal.value / 1000).toFixed(1)}k
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-blue-600" />
              <span>{deal.lead.systemSizeKw}kW</span>
            </div>
          </div>

          {/* Probability */}
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={`h-4 w-4 ${getProbabilityColor(deal.probability)}`} />
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  deal.probability >= 75
                    ? 'bg-green-600'
                    : deal.probability >= 50
                    ? 'bg-yellow-600'
                    : 'bg-gray-400'
                }`}
                style={{ width: `${deal.probability}%` }}
              />
            </div>
            <span className="text-xs font-medium">{deal.probability}%</span>
          </div>

          {/* Contact Info */}
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span className="truncate">{deal.lead.phone}</span>
            </div>
          </div>

          {/* Owner */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">{deal.owner.name}</span>
          </div>
        </Card>
      </Link>
    </div>
  );
}
