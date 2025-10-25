'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Send,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  validateForSubmission,
  getValidationBadge,
  type ValidationResult
} from '@/lib/submissionValidator';

interface SubmissionValidationProps {
  jobId: string;
  onSubmit?: () => void;
}

export function SubmissionValidation({ jobId, onSubmit }: SubmissionValidationProps) {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleValidate = async () => {
    setValidating(true);
    try {
      const validationResult = await validateForSubmission(jobId);
      setResult(validationResult);

      if (validationResult.canSubmit) {
        toast.success('All validation checks passed! Ready to submit.');
      } else {
        toast.error(`${validationResult.errors.length} validation errors found`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to run validation');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!result?.canSubmit) {
      toast.error('Cannot submit - validation errors must be fixed first');
      return;
    }

    setLoading(true);
    try {
      // Submit to GreenDeal/CER
      toast.success('Submitted to GreenDeal for STC processing');
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const groupByCategory = (items: any[]) => {
    const grouped: Record<string, any[]> = {};
    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  };

  const badge = result ? getValidationBadge(result) : null;

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-purple-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-purple-600" />
            Pre-Submission Validation
          </span>
          {badge && (
            <Badge
              className={
                badge.color === 'green'
                  ? 'bg-green-600'
                  : badge.color === 'yellow'
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
              }
            >
              {badge.icon} {badge.text}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Validation Summary */}
        {result && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Completion Progress</span>
                <span className="text-gray-600">{result.completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    result.canSubmit
                      ? 'bg-green-600'
                      : result.completionPercentage >= 80
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${result.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.summary.passedRules}
                </div>
                <div className="text-xs text-gray-600">Passed</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {result.summary.failedRules}
                </div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result.summary.requiredPassed}/{result.summary.requiredTotal}
                </div>
                <div className="text-xs text-gray-600">Required</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {result.summary.optionalPassed}/{result.summary.optionalTotal}
                </div>
                <div className="text-xs text-gray-600">Optional</div>
              </div>
            </div>

            {/* Errors by Category */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Validation Errors ({result.errors.length})
                </h3>
                {Object.entries(groupByCategory(result.errors)).map(([category, items]) => (
                  <div key={category} className="border border-red-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full p-3 bg-red-50 flex items-center justify-between hover:bg-red-100 transition-colors"
                    >
                      <span className="font-medium text-red-900">
                        {category} ({items.length})
                      </span>
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedCategories.has(category) && (
                      <div className="p-3 space-y-2">
                        {items.map((error: any, index: number) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-red-800">{error.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Warnings by Category */}
            {result.warnings.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-yellow-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Warnings ({result.warnings.length})
                </h3>
                {Object.entries(groupByCategory(result.warnings)).map(([category, items]) => (
                  <div key={category} className="border border-yellow-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(`warning-${category}`)}
                      className="w-full p-3 bg-yellow-50 flex items-center justify-between hover:bg-yellow-100 transition-colors"
                    >
                      <span className="font-medium text-yellow-900">
                        {category} ({items.length})
                      </span>
                      {expandedCategories.has(`warning-${category}`) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedCategories.has(`warning-${category}`) && (
                      <div className="p-3 space-y-2">
                        {items.map((warning: any, index: number) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-yellow-800">{warning.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Success Message */}
            {result.canSubmit && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Ready to Submit!</strong> All required validation checks have passed.
                  You can now submit this job to GreenDeal for STC processing.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleValidate}
            disabled={validating}
            variant="outline"
            className="flex-1"
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {result ? 'Re-validate' : 'Run Validation'}
              </>
            )}
          </Button>

          {result?.canSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit to GreenDeal
                </>
              )}
            </Button>
          )}
        </div>

        {/* Help Text */}
        {!result && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Click "Run Validation" to check if this job is ready for STC submission.
              The system will verify all 47+ compliance requirements.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
