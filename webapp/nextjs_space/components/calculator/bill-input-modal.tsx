
/**
 * Bill Input Modal Component
 * Allows users to input actual bill data for more accurate calculations
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar, DollarSign, Zap } from 'lucide-react';

interface BillPeriod {
  period: string;
  startDate: string;
  endDate: string;
  days: number;
  consumption: number;
  exported?: number;
  cost: number;
}

interface BillInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bills: BillPeriod[], seasonalPattern: any) => void;
  initialBills?: BillPeriod[];
}

export function BillInputModal({ isOpen, onClose, onSave, initialBills = [] }: BillInputModalProps) {
  const [bills, setBills] = useState<BillPeriod[]>(
    initialBills.length > 0
      ? initialBills
      : [
          {
            period: 'Summer',
            startDate: '',
            endDate: '',
            days: 0,
            consumption: 0,
            exported: 0,
            cost: 0,
          },
        ]
  );

  const addBill = () => {
    setBills([
      ...bills,
      {
        period: '',
        startDate: '',
        endDate: '',
        days: 0,
        consumption: 0,
        exported: 0,
        cost: 0,
      },
    ]);
  };

  const removeBill = (index: number) => {
    setBills(bills.filter((_, i) => i !== index));
  };

  const updateBill = (index: number, field: keyof BillPeriod, value: any) => {
    const newBills = [...bills];
    newBills[index] = { ...newBills[index], [field]: value };
    
    // Auto-calculate days if both dates are provided
    if (field === 'startDate' || field === 'endDate') {
      const start = new Date(newBills[index].startDate);
      const end = new Date(newBills[index].endDate);
      if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        newBills[index].days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    
    setBills(newBills);
  };

  const calculateSeasonalPattern = (bills: BillPeriod[]) => {
    if (bills.length === 0) return null;

    // Group bills by season (based on start month)
    const summerMonths = [11, 0, 1, 2]; // Dec, Jan, Feb, Mar
    const winterMonths = [5, 6, 7, 8]; // Jun, Jul, Aug, Sep

    const summerBills = bills.filter((b) => {
      if (!b.startDate) return false;
      const month = new Date(b.startDate).getMonth();
      return summerMonths.includes(month);
    });

    const winterBills = bills.filter((b) => {
      if (!b.startDate) return false;
      const month = new Date(b.startDate).getMonth();
      return winterMonths.includes(month);
    });

    const avgDailyConsumption = (bills: BillPeriod[]) => {
      if (bills.length === 0) return 0;
      const totalConsumption = bills.reduce((sum, b) => sum + b.consumption, 0);
      const totalDays = bills.reduce((sum, b) => sum + b.days, 0);
      return totalDays > 0 ? totalConsumption / totalDays : 0;
    };

    return {
      summer: {
        avgDaily: avgDailyConsumption(summerBills),
        typical: summerBills.length > 0 ? 'warm' : 'unknown',
      },
      winter: {
        avgDaily: avgDailyConsumption(winterBills),
        typical: winterBills.length > 0 ? 'cold' : 'unknown',
      },
      annual: {
        avgDaily: avgDailyConsumption(bills),
      },
    };
  };

  const handleSave = () => {
    const validBills = bills.filter(
      (b) => b.consumption > 0 && b.days > 0 && b.startDate && b.endDate
    );
    
    if (validBills.length === 0) {
      alert('Please enter at least one valid bill period with consumption and dates.');
      return;
    }

    const seasonalPattern = calculateSeasonalPattern(validBills);
    onSave(validBills, seasonalPattern);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Enter Your Electricity Bills
          </DialogTitle>
          <DialogDescription>
            Adding your actual bill data helps us provide more accurate savings calculations and system sizing.
            Enter as many bills as you have available (we recommend at least 2 from different seasons).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {bills.map((bill, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-primary">Bill #{index + 1}</h3>
                {bills.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBill(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`period-${index}`}>
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Period Name
                  </Label>
                  <Input
                    id={`period-${index}`}
                    placeholder="e.g., Summer 2024"
                    value={bill.period}
                    onChange={(e) => updateBill(index, 'period', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`days-${index}`}>
                    Days in Period
                  </Label>
                  <Input
                    id={`days-${index}`}
                    type="number"
                    placeholder="e.g., 90"
                    value={bill.days || ''}
                    onChange={(e) => updateBill(index, 'days', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor={`startDate-${index}`}>
                    Start Date
                  </Label>
                  <Input
                    id={`startDate-${index}`}
                    type="date"
                    value={bill.startDate}
                    onChange={(e) => updateBill(index, 'startDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`endDate-${index}`}>
                    End Date
                  </Label>
                  <Input
                    id={`endDate-${index}`}
                    type="date"
                    value={bill.endDate}
                    onChange={(e) => updateBill(index, 'endDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`consumption-${index}`}>
                    <Zap className="inline h-4 w-4 mr-1" />
                    Consumption (kWh)
                  </Label>
                  <Input
                    id={`consumption-${index}`}
                    type="number"
                    placeholder="e.g., 2118"
                    value={bill.consumption || ''}
                    onChange={(e) => updateBill(index, 'consumption', parseFloat(e.target.value) || 0)}
                  />
                  {bill.consumption > 0 && bill.days > 0 && (
                    <p className="text-xs text-emerald mt-1">
                      {(bill.consumption / bill.days).toFixed(1)} kWh/day average
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`cost-${index}`}>
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Bill Amount ($)
                  </Label>
                  <Input
                    id={`cost-${index}`}
                    type="number"
                    placeholder="e.g., 650"
                    value={bill.cost || ''}
                    onChange={(e) => updateBill(index, 'cost', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor={`exported-${index}`}>
                    Exported to Grid (kWh) - Optional
                  </Label>
                  <Input
                    id={`exported-${index}`}
                    type="number"
                    placeholder="Leave blank if no solar yet"
                    value={bill.exported || ''}
                    onChange={(e) => updateBill(index, 'exported', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addBill}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Bill Period
          </Button>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Bills
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
