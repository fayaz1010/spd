'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  MoreVertical,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Deal {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  value: number;
  stage: string;
  priority: string;
  assignedTo?: string;
  assignedToName?: string;
  expectedCloseDate?: string;
  lastContactAt?: string;
  createdAt: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
  totalValue: number;
}

const STAGES = [
  { id: 'LEAD', name: 'New Leads', color: 'bg-gray-100 border-gray-300' },
  { id: 'QUALIFIED', name: 'Qualified', color: 'bg-blue-100 border-blue-300' },
  { id: 'PROPOSAL', name: 'Proposal Sent', color: 'bg-purple-100 border-purple-300' },
  { id: 'NEGOTIATION', name: 'Negotiation', color: 'bg-orange-100 border-orange-300' },
  { id: 'WON', name: 'Won', color: 'bg-green-100 border-green-300' },
  { id: 'LOST', name: 'Lost', color: 'bg-red-100 border-red-300' },
];

export default function PipelineKanban() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<Stage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [draggedFromStage, setDraggedFromStage] = useState<string | null>(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/deals', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        organizeDealsIntoStages(data.deals || []);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pipeline',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const organizeDealsIntoStages = (deals: Deal[]) => {
    const organized = STAGES.map(stage => {
      const stageDeals = deals.filter(deal => deal.stage === stage.id);
      const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      
      return {
        ...stage,
        deals: stageDeals,
        totalValue,
      };
    });

    setStages(organized);
  };

  const handleDragStart = (deal: Deal, fromStage: string) => {
    setDraggedDeal(deal);
    setDraggedFromStage(fromStage);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (toStage: string) => {
    if (!draggedDeal || !draggedFromStage) return;

    // Don't update if dropped in same stage
    if (draggedFromStage === toStage) {
      setDraggedDeal(null);
      setDraggedFromStage(null);
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/crm/deals/${draggedDeal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage: toStage }),
      });

      if (response.ok) {
        // Update local state
        const updatedStages = stages.map(stage => {
          if (stage.id === draggedFromStage) {
            // Remove from old stage
            return {
              ...stage,
              deals: stage.deals.filter(d => d.id !== draggedDeal.id),
              totalValue: stage.totalValue - (draggedDeal.value || 0),
            };
          } else if (stage.id === toStage) {
            // Add to new stage
            return {
              ...stage,
              deals: [...stage.deals, { ...draggedDeal, stage: toStage }],
              totalValue: stage.totalValue + (draggedDeal.value || 0),
            };
          }
          return stage;
        });

        setStages(updatedStages);

        toast({
          title: 'Deal Moved',
          description: `${draggedDeal.customerName} moved to ${STAGES.find(s => s.id === toStage)?.name}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move deal',
        variant: 'destructive',
      });
    } finally {
      setDraggedDeal(null);
      setDraggedFromStage(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredStages = stages.map(stage => ({
    ...stage,
    deals: stage.deals.filter(deal =>
      searchQuery === '' ||
      deal.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.customerPhone?.includes(searchQuery)
    ),
  }));

  const totalPipelineValue = stages.reduce((sum, stage) => sum + stage.totalValue, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/crm/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Sales Pipeline</h1>
                <p className="text-xs text-gray-500">
                  {formatCurrency(totalPipelineValue)} total pipeline value
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Link href="/admin/crm/deals/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Deal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {filteredStages.map((stage) => (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Stage Header */}
              <div className={`${stage.color} border-2 rounded-t-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-xs font-medium">
                    {stage.deals.length}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {formatCurrency(stage.totalValue)}
                </p>
              </div>

              {/* Deals List */}
              <div className="bg-gray-100 border-2 border-t-0 border-gray-300 rounded-b-lg p-2 min-h-[500px] max-h-[calc(100vh-250px)] overflow-y-auto">
                <div className="space-y-2">
                  {stage.deals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal, stage.id)}
                      className="bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-lg transition-shadow"
                    >
                      {/* Deal Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Link href={`/admin/crm/deals/${deal.id}`}>
                            <h4 className="font-medium text-gray-900 hover:text-blue-600 mb-1">
                              {deal.customerName}
                            </h4>
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(deal.value)}
                            </span>
                            {deal.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(deal.priority)}`}>
                                {deal.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Deal Info */}
                      <div className="space-y-2 text-sm text-gray-600">
                        {deal.customerEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{deal.customerEmail}</span>
                          </div>
                        )}
                        {deal.customerPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{deal.customerPhone}</span>
                          </div>
                        )}
                        {deal.assignedToName && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>{deal.assignedToName}</span>
                          </div>
                        )}
                        {deal.expectedCloseDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>Close: {formatDate(deal.expectedCloseDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Deal Footer */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>Created {formatDate(deal.createdAt)}</span>
                        {deal.lastContactAt && (
                          <span>Last contact {formatDate(deal.lastContactAt)}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {stage.deals.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No deals in this stage</p>
                      <p className="text-xs mt-1">Drag deals here to move them</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline Stats */}
        <Card className="mt-6 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Pipeline Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stages.map((stage) => (
              <div key={stage.id} className="text-center">
                <p className="text-sm text-gray-600 mb-1">{stage.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stage.deals.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(stage.totalValue)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
