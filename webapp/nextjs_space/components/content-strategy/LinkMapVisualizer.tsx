'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  AlertCircle
} from 'lucide-react';

interface LinkMapVisualizerProps {
  strategy: any;
}

export function LinkMapVisualizer({ strategy }: LinkMapVisualizerProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const pillars = strategy.pillars || [];
  const totalClusters = pillars.reduce((sum: number, p: any) => sum + (p.clusters?.length || 0), 0);
  const generatedPillars = pillars.filter((p: any) => p.blogPostId).length;
  const generatedClusters = pillars.flatMap((p: any) => p.clusters || []).filter((c: any) => c.blogPostId).length;

  // Calculate positions for visualization
  const pillarSpacing = 200;
  const clusterSpacing = 100;
  const centerX = 500;
  const startY = 100;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-coral" />
            Content Link Map
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(1)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="bg-coral/10 border-2 border-coral/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-coral">{pillars.length}</p>
            <p className="text-xs text-gray-600">Pillars</p>
          </div>
          <div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalClusters}</p>
            <p className="text-xs text-gray-600">Clusters</p>
          </div>
          <div className="bg-green-500/10 border-2 border-green-500/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{generatedPillars + generatedClusters}</p>
            <p className="text-xs text-gray-600">Generated</p>
          </div>
          <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pillars.length + totalClusters - generatedPillars - generatedClusters}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
          <div className="bg-purple-500/10 border-2 border-purple-500/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalClusters * 3}</p>
            <p className="text-xs text-gray-600">Links</p>
          </div>
        </div>

        {/* SVG Visualization */}
        <div className="border-2 border-gray-200 rounded-lg overflow-auto bg-gray-50">
          <svg
            width="1000"
            height={Math.max(600, pillars.length * 150)}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {/* Draw links first (so they appear behind nodes) */}
            {pillars.map((pillar: any, pillarIndex: number) => {
              const pillarY = startY + pillarIndex * pillarSpacing;
              
              return pillar.clusters?.map((cluster: any, clusterIndex: number) => {
                const clusterX = centerX + 300;
                const clusterY = pillarY + (clusterIndex - pillar.clusters.length / 2) * 40;
                
                return (
                  <g key={`link-${pillar.id}-${cluster.id}`}>
                    {/* Link from cluster to pillar */}
                    <line
                      x1={clusterX}
                      y1={clusterY}
                      x2={centerX + 120}
                      y2={pillarY}
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.5"
                    />
                  </g>
                );
              });
            })}

            {/* Draw pillar nodes */}
            {pillars.map((pillar: any, index: number) => {
              const y = startY + index * pillarSpacing;
              const isSelected = selectedNode === pillar.id;
              
              return (
                <g
                  key={pillar.id}
                  onClick={() => setSelectedNode(isSelected ? null : pillar.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Pillar node */}
                  <rect
                    x={centerX - 100}
                    y={y - 30}
                    width="200"
                    height="60"
                    rx="8"
                    fill={isSelected ? '#FF6B6B' : (pillar.blogPostId ? '#dcfce7' : '#fff')}
                    stroke={pillar.blogPostId ? '#22c55e' : '#FF6B6B'}
                    strokeWidth="3"
                  />
                  {/* Status icon */}
                  {pillar.blogPostId ? (
                    <circle cx={centerX - 85} cy={y - 15} r="8" fill="#22c55e" />
                  ) : (
                    <circle cx={centerX - 85} cy={y - 15} r="8" fill="#eab308" />
                  )}
                  <text x={centerX - 85} y={y - 11} textAnchor="middle" fontSize="10" fill="#fff">✓</text>
                  <text
                    x={centerX}
                    y={y - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill={isSelected ? '#fff' : '#FF6B6B'}
                  >
                    PILLAR {index + 1}
                  </text>
                  <text
                    x={centerX}
                    y={y + 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill={isSelected ? '#fff' : '#666'}
                  >
                    {pillar.title.substring(0, 25)}...
                  </text>
                  
                  {/* Cluster count badge */}
                  <circle
                    cx={centerX + 110}
                    y={y}
                    r="15"
                    fill="#3b82f6"
                  />
                  <text
                    x={centerX + 110}
                    y={y + 5}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#fff"
                  >
                    {pillar.clusters?.length || 0}
                  </text>
                </g>
              );
            })}

            {/* Draw cluster nodes */}
            {pillars.map((pillar: any, pillarIndex: number) => {
              const pillarY = startY + pillarIndex * pillarSpacing;
              
              return pillar.clusters?.map((cluster: any, clusterIndex: number) => {
                const x = centerX + 300;
                const y = pillarY + (clusterIndex - pillar.clusters.length / 2) * 40;
                const isSelected = selectedNode === cluster.id;
                
                return (
                  <g
                    key={cluster.id}
                    onClick={() => setSelectedNode(isSelected ? null : cluster.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r="25"
                      fill={isSelected ? '#3b82f6' : (cluster.blogPostId ? '#dbeafe' : '#fff')}
                      stroke={cluster.blogPostId ? '#22c55e' : '#3b82f6'}
                      strokeWidth="2"
                    />
                    {/* Status indicator */}
                    {cluster.blogPostId && (
                      <circle cx={x + 15} cy={y - 15} r="6" fill="#22c55e" />
                    )}
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={isSelected ? '#fff' : '#3b82f6'}
                    >
                      C{clusterIndex + 1}
                    </text>
                  </g>
                );
              });
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-3 border-coral rounded bg-white"></div>
            <span>Pillar (Pending)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-3 border-green-600 rounded bg-green-100"></div>
            <span>Pillar (Generated)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 rounded-full bg-white"></div>
            <span>Cluster (Pending)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-green-600 rounded-full bg-blue-100"></div>
            <span>Cluster (Generated)</span>
          </div>
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900">
              {pillars.find((p: any) => p.id === selectedNode)?.title ||
               pillars.flatMap((p: any) => p.clusters).find((c: any) => c?.id === selectedNode)?.title}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Click node to deselect
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
