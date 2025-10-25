'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, DollarSign, Info } from 'lucide-react';

interface BillBreakdownProps {
  billInterval: 'annual' | 'quarterly' | 'bimonthly' | 'monthly';
  setBillInterval: (interval: 'annual' | 'quarterly' | 'bimonthly' | 'monthly') => void;
  bills: {
    annual?: number;
    q1?: number; q2?: number; q3?: number; q4?: number;
    janFeb?: number; marApr?: number; mayJun?: number;
    julAug?: number; sepOct?: number; novDec?: number;
    jan?: number; feb?: number; mar?: number; apr?: number;
    may?: number; jun?: number; jul?: number; aug?: number;
    sep?: number; oct?: number; nov?: number; dec?: number;
  };
  setBills: (bills: any) => void;
  rates: {
    dailySupplyCharge: number;
    electricityRate: number;
    feedInTariff: number;
  };
  setRates: (rates: any) => void;
  onToggleUsage?: () => void;
}

export function BillBreakdown({
  billInterval,
  setBillInterval,
  bills,
  setBills,
  rates,
  setRates,
  onToggleUsage
}: BillBreakdownProps) {
  const calculateAverage = () => {
    if (billInterval === 'annual' && bills.annual) {
      return bills.annual;
    } else if (billInterval === 'quarterly') {
      const total = (bills.q1 || 0) + (bills.q2 || 0) + (bills.q3 || 0) + (bills.q4 || 0);
      return total / 4;
    } else if (billInterval === 'bimonthly') {
      const total = (bills.janFeb || 0) + (bills.marApr || 0) + (bills.mayJun || 0) +
                    (bills.julAug || 0) + (bills.sepOct || 0) + (bills.novDec || 0);
      return total / 6;
    } else if (billInterval === 'monthly') {
      const total = (bills.jan || 0) + (bills.feb || 0) + (bills.mar || 0) + (bills.apr || 0) +
                    (bills.may || 0) + (bills.jun || 0) + (bills.jul || 0) + (bills.aug || 0) +
                    (bills.sep || 0) + (bills.oct || 0) + (bills.nov || 0) + (bills.dec || 0);
      return total / 12;
    }
    return 0;
  };

  return (
    <Card className="border-2 hover:border-blue-300 transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Current Bills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interval Tabs */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {[
            { value: 'annual', label: 'Annual' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'bimonthly', label: 'Bi-Monthly' },
            { value: 'monthly', label: 'Monthly' }
          ].map((interval) => (
            <button
              key={interval.value}
              onClick={() => setBillInterval(interval.value as any)}
              className={`px-4 py-2 text-sm whitespace-nowrap transition-all ${
                billInterval === interval.value
                  ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {interval.label}
            </button>
          ))}
        </div>

        {/* Bill Amounts */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Bill amounts</Label>
          
          {/* Annual */}
          {billInterval === 'annual' && (
            <div>
              <Label className="text-xs text-gray-600">Annual bill</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={bills.annual || ''}
                  onChange={(e) => setBills({...bills, annual: Number(e.target.value)})}
                  className="pl-7"
                  placeholder="1800.00"
                />
              </div>
            </div>
          )}

          {/* Quarterly */}
          {billInterval === 'quarterly' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'q1', label: 'Jan-Mar (Q1)' },
                { key: 'q2', label: 'Apr-Jun (Q2)' },
                { key: 'q3', label: 'Jul-Sep (Q3)' },
                { key: 'q4', label: 'Oct-Dec (Q4)' }
              ].map((quarter) => (
                <div key={quarter.key}>
                  <Label className="text-xs text-gray-600">{quarter.label}</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={bills[quarter.key as keyof typeof bills] || ''}
                      onChange={(e) => setBills({...bills, [quarter.key]: Number(e.target.value)})}
                      className="pl-6 text-sm"
                      placeholder="450.00"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bi-Monthly */}
          {billInterval === 'bimonthly' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'janFeb', label: 'Jan-Feb', season: '☀️' },
                { key: 'marApr', label: 'Mar-Apr', season: '🍂' },
                { key: 'mayJun', label: 'May-Jun', season: '❄️' },
                { key: 'julAug', label: 'Jul-Aug', season: '❄️' },
                { key: 'sepOct', label: 'Sep-Oct', season: '🌸' },
                { key: 'novDec', label: 'Nov-Dec', season: '☀️' }
              ].map((period) => (
                <div key={period.key}>
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <span>{period.season}</span>
                    <span>{period.label}</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={bills[period.key as keyof typeof bills] || ''}
                      onChange={(e) => setBills({...bills, [period.key]: Number(e.target.value)})}
                      className="pl-6 text-sm"
                      placeholder="297.28"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Monthly */}
          {billInterval === 'monthly' && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'jan', label: 'Jan' },
                { key: 'feb', label: 'Feb' },
                { key: 'mar', label: 'Mar' },
                { key: 'apr', label: 'Apr' },
                { key: 'may', label: 'May' },
                { key: 'jun', label: 'Jun' },
                { key: 'jul', label: 'Jul' },
                { key: 'aug', label: 'Aug' },
                { key: 'sep', label: 'Sep' },
                { key: 'oct', label: 'Oct' },
                { key: 'nov', label: 'Nov' },
                { key: 'dec', label: 'Dec' }
              ].map((month) => (
                <div key={month.key}>
                  <Label className="text-xs text-gray-600">{month.label}</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={bills[month.key as keyof typeof bills] || ''}
                      onChange={(e) => setBills({...bills, [month.key]: Number(e.target.value)})}
                      className="pl-6 text-sm"
                      placeholder="148"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Average Display */}
          {billInterval !== 'annual' && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">
                Average: ${calculateAverage().toFixed(2)}
                {billInterval === 'bimonthly' && ' per bi-monthly period'}
                {billInterval === 'quarterly' && ' per quarter'}
                {billInterval === 'monthly' && ' per month'}
              </p>
            </div>
          )}
        </div>

        {/* Rate Table */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-gray-500" />
            <Label className="text-sm font-medium">Electricity rates</Label>
          </div>

          <div className="space-y-2">
            {/* Daily Supply Charge */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
              <div className="text-sm text-gray-700">Daily supply charge</div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={rates.dailySupplyCharge}
                  onChange={(e) => setRates({...rates, dailySupplyCharge: Number(e.target.value)})}
                  className="w-20 text-sm"
                />
              </div>
              <div className="text-sm text-gray-600">per day</div>
            </div>

            {/* Electricity Rate */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
              <div className="text-sm text-gray-700">Electricity rate</div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={rates.electricityRate}
                  onChange={(e) => setRates({...rates, electricityRate: Number(e.target.value)})}
                  className="w-20 text-sm"
                />
              </div>
              <div className="text-sm text-gray-600">per kWh</div>
            </div>

            {/* Feed-in Tariff */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center bg-green-50 p-2 rounded">
              <div className="text-sm text-green-800 font-medium">Feed-in tariff</div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={rates.feedInTariff}
                  onChange={(e) => setRates({...rates, feedInTariff: Number(e.target.value)})}
                  className="w-20 text-sm bg-white"
                />
              </div>
              <div className="text-sm text-green-600">per kWh</div>
            </div>
          </div>
        </div>

        {/* Enter Usage Instead */}
        {onToggleUsage && (
          <button
            onClick={onToggleUsage}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
          >
            <RefreshCw className="w-4 h-4" />
            Enter usage instead
          </button>
        )}
      </CardContent>
    </Card>
  );
}
