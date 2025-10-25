'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, FileCheck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComplianceDashboardProps {
  jobId: string;
}

export function ComplianceDashboard({ jobId }: ComplianceDashboardProps) {
  const [compliance, setCompliance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchCompliance();
  }, [jobId]);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/compliance/check?jobId=${jobId}`);
      const data = await response.json();

      if (data.success) {
        setCompliance(data.compliance);
      }
    } catch (error) {
      console.error('Error fetching compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreStatus = (score: number) => {
    if (score === 100) return 'Fully Compliant';
    if (score >= 90) return 'Nearly Complete';
    if (score >= 70) return 'In Progress';
    if (score >= 50) return 'Needs Attention';
    return 'Critical Issues';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!compliance) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-medium">Failed to load compliance data</p>
      </div>
    );
  }

  const { score, requirements, missingCritical, missingHigh, warnings, recommendations } = compliance;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className={`rounded-lg border-2 p-6 ${getScoreBg(score.overall)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">Compliance Score</h3>
            <p className="text-sm opacity-80">{getScoreStatus(score.overall)}</p>
          </div>
          <div className={`text-6xl font-bold ${getScoreColor(score.overall)}`}>
            {score.overall}%
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {score.readyForRebate ? (
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Rebate Ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              <XCircle className="h-4 w-4" />
              <span>Not Rebate Ready</span>
            </div>
          )}

          {score.readyForHandover ? (
            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Handover Ready</span>
            </div>
          ) : null}

          {score.auditReady ? (
            <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              <Shield className="h-4 w-4" />
              <span>Audit Ready</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid md:grid-cols-5 gap-4">
        {Object.entries(score.categories).map(([category, value]: [string, any]) => (
          <div key={category} className="bg-white rounded-lg border-2 border-gray-200 p-4">
            <p className="text-sm text-gray-600 capitalize mb-2">{category}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${getScoreColor(value)}`}>{value}%</p>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  value >= 90 ? 'bg-green-500' :
                  value >= 70 ? 'bg-yellow-500' :
                  value >= 50 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Critical Issues */}
      {missingCritical.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">
              Critical Requirements Missing ({missingCritical.length})
            </h3>
          </div>
          <div className="space-y-2">
            {missingCritical.map((req: any) => (
              <div key={req.id} className="bg-white rounded-lg p-3 border border-red-200">
                <p className="font-medium text-red-800">{req.name}</p>
                <p className="text-sm text-red-600">{req.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Priority Issues */}
      {missingHigh.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">
              High Priority Items ({missingHigh.length})
            </h3>
          </div>
          <div className="space-y-2">
            {missingHigh.map((req: any) => (
              <div key={req.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                <p className="font-medium text-yellow-800">{req.name}</p>
                <p className="text-sm text-yellow-600">{req.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800 mb-2">Warnings:</p>
              <ul className="text-sm text-orange-700 space-y-1">
                {warnings.map((warning: string, i: number) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 mb-2">Recommendations:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                {recommendations.map((rec: string, i: number) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* All Requirements (Collapsible) */}
      <div className="bg-white rounded-lg border-2 border-gray-200">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileCheck className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold">
              All Requirements ({requirements.filter((r: any) => r.completed).length}/{requirements.length})
            </h3>
          </div>
          <span className="text-gray-400">{showDetails ? '▼' : '▶'}</span>
        </button>

        {showDetails && (
          <div className="p-6 pt-0 space-y-4">
            {['Documents', 'Validation', 'Photos', 'Signatures', 'Network'].map(category => {
              const categoryReqs = requirements.filter((r: any) => r.category === category);
              const completed = categoryReqs.filter((r: any) => r.completed).length;
              
              return (
                <div key={category}>
                  <h4 className="font-semibold mb-2">
                    {category} ({completed}/{categoryReqs.length})
                  </h4>
                  <div className="space-y-2">
                    {categoryReqs.map((req: any) => (
                      <div
                        key={req.id}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          req.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {req.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${req.completed ? 'text-green-800' : 'text-gray-800'}`}>
                            {req.name}
                            {req.priority === 'critical' && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                CRITICAL
                              </span>
                            )}
                          </p>
                          <p className={`text-sm ${req.completed ? 'text-green-600' : 'text-gray-600'}`}>
                            {req.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <Button
        onClick={fetchCompliance}
        variant="outline"
        className="w-full"
      >
        Refresh Compliance Check
      </Button>
    </div>
  );
}
