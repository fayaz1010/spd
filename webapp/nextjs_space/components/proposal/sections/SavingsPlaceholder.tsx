'use client';

import { Info, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface SavingsPlaceholderProps {
  quoteId: string;
  token: string;
}

export default function SavingsPlaceholder({ quoteId, token }: SavingsPlaceholderProps) {
  const [showModal, setShowModal] = useState(false);
  const [bimonthlyBill, setBimonthlyBill] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!bimonthlyBill || parseFloat(bimonthlyBill) <= 0) {
      alert('Please enter a valid bill amount');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/quotes/${quoteId}/add-bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyBill: parseFloat(bimonthlyBill) / 2,
        }),
      });

      if (response.ok) {
        // Reload page to show savings
        window.location.reload();
      } else {
        alert('Failed to update bill amount. Please try again.');
      }
    } catch (error) {
      console.error('Error updating bill:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-blue-300">
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="w-10 h-10 text-blue-600" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            See Your Personalized Savings
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            To calculate your exact savings, ROI, and payback period, we need your current <strong>quarterly (bi-monthly)</strong> electricity bill amount.
          </p>
          
          {/* Important Note */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-8 max-w-2xl mx-auto">
            <p className="text-sm text-gray-800">
              <strong>📋 Important:</strong> Please be as accurate as possible. In Australia, electricity bills are typically sent every 2 months (quarterly). 
              Check your latest bill for the <strong>total amount</strong> to ensure accurate savings analysis.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-600 mb-1">💰</p>
              <p className="text-sm font-semibold text-gray-900">Monthly Savings</p>
              <p className="text-xs text-gray-600">See exact dollar amount</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-2xl font-bold text-green-600 mb-1">📈</p>
              <p className="text-sm font-semibold text-gray-900">ROI Analysis</p>
              <p className="text-xs text-gray-600">Return on investment</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-2xl font-bold text-purple-600 mb-1">⏱️</p>
              <p className="text-sm font-semibold text-gray-900">Payback Period</p>
              <p className="text-xs text-gray-600">Break-even timeline</p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => setShowModal(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Add Your Bill Amount
          </Button>

          {/* Privacy Note */}
          <p className="text-sm text-gray-500 mt-6">
            🔒 Your information is secure and will only be used for calculating your savings
          </p>
        </div>

        {/* Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Your Quarterly Bill</DialogTitle>
              <DialogDescription>
                Enter your quarterly (bi-monthly) electricity bill amount to see personalized savings calculations
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="bimonthlyBill">Bi-Monthly Electricity Bill ($)</Label>
                <Input
                  id="bimonthlyBill"
                  type="number"
                  value={bimonthlyBill}
                  onChange={(e) => setBimonthlyBill(e.target.value)}
                  placeholder="600"
                  min="0"
                  step="0.01"
                  className="text-lg"
                />
                <p className="text-xs text-gray-500 mt-2">
                  <strong>💡 Tip:</strong> Check your latest electricity bill for the <strong>total amount</strong>. 
                  In Australia, bills are sent every 2 months (quarterly).
                </p>
                <p className="text-xs text-yellow-600 mt-2 font-medium">
                  ⚠️ Please be accurate - this affects your savings analysis!
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Calculating...' : 'Calculate Savings'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
