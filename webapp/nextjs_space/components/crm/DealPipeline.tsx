'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, DollarSign, Users, Target } from 'lucide-react';
import { DealCard } from './DealCard';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number;
  stage: string;
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
}

const STAGES = [
  { id: 'NEW_LEAD', label: 'New Lead', color: 'bg-gray-100' },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-blue-100' },
  { id: 'QUOTE_SENT', label: 'Quote Sent', color: 'bg-purple-100' },
  { id: 'FOLLOW_UP', label: 'Follow-up', color: 'bg-yellow-100' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-100' },
  { id: 'WON', label: 'Won', color: 'bg-green-100' },
  { id: 'LOST', label: 'Lost', color: 'bg-red-100' },
  { id: 'ON_HOLD', label: 'On Hold', color: 'bg-gray-100' },
];

export function DealPipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/crm/deals');
      if (response.ok) {
        const data = await response.json();
        setDeals(data.deals || []);
        setMetrics(data.metrics || {});
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const dealId = active.id as string;
    const newStage = over.id as string;

    // Find the deal
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) {
      setActiveId(null);
      return;
    }

    // Optimistically update UI
    setDeals(deals.map(d => 
      d.id === dealId ? { ...d, stage: newStage } : d
    ));

    // Update on server
    try {
      const response = await fetch(`/api/crm/deals/${dealId}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          performedBy: 'admin-user-id', // TODO: Get from session
        }),
      });

      if (!response.ok) throw new Error('Failed to update stage');

      toast({
        title: 'Deal Updated',
        description: `Moved to ${STAGES.find(s => s.id === newStage)?.label}`,
      });

      // Refresh deals to get updated metrics
      fetchDeals();
    } catch (error) {
      // Revert on error
      setDeals(deals);
      toast({
        title: 'Error',
        description: 'Failed to update deal stage',
        variant: 'destructive',
      });
    }

    setActiveId(null);
  };

  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  const getStageValue = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + deal.value, 0);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading pipeline...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-3">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Deals</p>
              <p className="text-2xl font-bold">{metrics?.totalDeals || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pipeline Value</p>
              <p className="text-2xl font-bold">
                ${((metrics?.totalValue || 0) / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Won Deals</p>
              <p className="text-2xl font-bold">{metrics?.byStage?.WON || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 rounded-full p-3">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Negotiation</p>
              <p className="text-2xl font-bold">{metrics?.byStage?.NEGOTIATION || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline Board */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageDeals = getDealsByStage(stage.id);
            const stageValue = getStageValue(stage.id);

            return (
              <div key={stage.id} className="flex-shrink-0 w-80">
                <Card className={`${stage.color} p-4`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{stage.label}</h3>
                      <p className="text-sm text-gray-600">
                        {stageDeals.length} deals · ${(stageValue / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <Badge variant="secondary">{stageDeals.length}</Badge>
                  </div>

                  <SortableContext
                    id={stage.id}
                    items={stageDeals.map(d => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 min-h-[200px]">
                      {stageDeals.map(deal => (
                        <DealCard key={deal.id} deal={deal} />
                      ))}
                    </div>
                  </SortableContext>
                </Card>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeId ? (
            <DealCard deal={deals.find(d => d.id === activeId)!} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
