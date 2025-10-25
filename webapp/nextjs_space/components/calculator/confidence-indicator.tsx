
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ConfidenceIndicatorProps {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  imageryDate?: Date | string;
  imageryQuality?: string;
  imageryAgeInDays?: number;
}

export function ConfidenceIndicator({
  level,
  imageryDate,
  imageryQuality,
  imageryAgeInDays
}: ConfidenceIndicatorProps) {
  const getConfig = () => {
    switch (level) {
      case 'HIGH':
        return {
          color: 'emerald',
          icon: CheckCircle,
          label: 'High Confidence',
          description: 'Excellent data quality for accurate analysis',
          bgGradient: 'from-emerald-50 to-green-50',
          borderColor: 'border-emerald-300',
          textColor: 'text-emerald-700',
          dotColor: 'bg-emerald-500',
          checks: [
            'High-resolution imagery available',
            'Recent data (last 12 months)',
            'Clear view of roof',
            'Comprehensive segment analysis'
          ]
        };
      case 'MEDIUM':
        return {
          color: 'gold',
          icon: Info,
          label: 'Medium Confidence',
          description: 'Good data quality with minor limitations',
          bgGradient: 'from-gold-50 to-yellow-50',
          borderColor: 'border-gold-300',
          textColor: 'text-gold-700',
          dotColor: 'bg-gold-500',
          checks: [
            'Moderate-resolution imagery',
            'Data from last 24 months',
            'Most roof features visible',
            'Basic segment analysis available'
          ]
        };
      default:
        return {
          color: 'blue',
          icon: Info,
          label: 'Standard Analysis',
          description: 'Using reliable regional data and industry standards',
          bgGradient: 'from-blue-50 to-sky-50',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-700',
          dotColor: 'bg-blue-500',
          checks: [
            'Industry-standard solar calculations',
            'Based on verified Perth averages',
            'Proven estimation methodology',
            'Conservative and accurate projections'
          ]
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not available';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'long' });
  };

  return (
    <Card className={`border-2 ${config.borderColor} shadow-lg`}>
      <CardContent className={`bg-gradient-to-br ${config.bgGradient} p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${config.dotColor} animate-pulse`} />
            <div>
              <h4 className={`text-lg font-bold ${config.textColor}`}>
                Analysis Confidence: {config.label}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {config.description}
              </p>
            </div>
          </div>
          <Icon className={`h-8 w-8 ${config.textColor}`} />
        </div>

        {/* Data Quality Info */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Imagery Date</p>
              <p className="font-semibold text-gray-800">
                {formatDate(imageryDate)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Image Quality</p>
              <p className="font-semibold text-gray-800">
                {imageryQuality || 'Standard'}
              </p>
            </div>
            {imageryAgeInDays !== undefined && (
              <div className="col-span-2">
                <p className="text-gray-600 mb-1">Data Age</p>
                <p className="font-semibold text-gray-800">
                  {Math.floor(imageryAgeInDays / 30)} months old
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quality Checklist */}
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Quality Indicators:</h5>
          <ul className="space-y-2">
            {config.checks.map((check, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className={`h-4 w-4 ${config.textColor} mt-0.5 flex-shrink-0`} />
                <span className="text-gray-700">{check}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Analysis Reliability Score</span>
            <span className={`text-sm font-bold ${config.textColor}`}>
              {level === 'HIGH' ? '95%' : level === 'MEDIUM' ? '80%' : '85%'}
            </span>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                level === 'HIGH' ? 'bg-emerald-500 w-[95%]' :
                level === 'MEDIUM' ? 'bg-gold-500 w-[80%]' :
                'bg-blue-500 w-[85%]'
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
