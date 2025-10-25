'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  DollarSign,
  Loader2,
  Upload,
  Paperclip,
  Download,
  Trash2,
  CreditCard,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentConfirmationCardProps {
  leadId: string;
  lead: any;
  onUpdate?: () => void;
}

export function PaymentConfirmationCard({ 
  leadId, 
  lead,
  onUpdate 
}: PaymentConfirmationCardProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Get values from quote (already calculated and saved in database)
  // DO NOT recalculate - use exact values from quote generation
  const quoteDepositAmount = lead?.CustomerQuote?.depositAmount || 0;
  const quoteTotalCost = lead?.CustomerQuote?.totalCostAfterRebates || lead?.CustomerQuote?.totalCost || 0;
  const quoteFinalAmount = quoteTotalCost - quoteDepositAmount;
  
  // Deposit payment - use values from Lead if already saved, otherwise use values from Quote
  const [depositPaid, setDepositPaid] = useState(lead?.depositPaid || false);
  const [depositAmount, setDepositAmount] = useState(
    lead?.depositAmount !== null && lead?.depositAmount !== undefined 
      ? lead.depositAmount 
      : quoteDepositAmount
  );
  const [depositPaidAt, setDepositPaidAt] = useState(
    lead?.depositPaidAt 
      ? new Date(lead.depositPaidAt).toISOString().split('T')[0]
      : ''
  );
  const [depositReceiptUrl, setDepositReceiptUrl] = useState(lead?.depositReceiptUrl || '');
  const [depositPaymentMethod, setDepositPaymentMethod] = useState(lead?.depositPaymentMethod || '');
  const [depositTransactionRef, setDepositTransactionRef] = useState(lead?.depositTransactionRef || '');
  
  // Final payment - use values from Lead if already saved, otherwise use calculated from Quote
  const [finalPaid, setFinalPaid] = useState(lead?.finalPaid || false);
  const [finalAmount, setFinalAmount] = useState(
    lead?.finalAmount !== null && lead?.finalAmount !== undefined 
      ? lead.finalAmount 
      : quoteFinalAmount
  );
  const [finalPaidAt, setFinalPaidAt] = useState(
    lead?.finalPaidAt 
      ? new Date(lead.finalPaidAt).toISOString().split('T')[0]
      : ''
  );
  const [finalReceiptUrl, setFinalReceiptUrl] = useState(lead?.finalReceiptUrl || '');
  const [finalPaymentMethod, setFinalPaymentMethod] = useState(lead?.finalPaymentMethod || '');
  const [finalTransactionRef, setFinalTransactionRef] = useState(lead?.finalTransactionRef || '');

  const handleFileUpload = async (file: File, type: 'deposit' | 'final') => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('leadId', leadId);
      formData.append('type', `payment-${type}`);

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      if (type === 'deposit') {
        setDepositReceiptUrl(data.url);
      } else {
        setFinalReceiptUrl(data.url);
      }
      
      toast.success('Receipt uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/leads/${leadId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          depositPaid,
          depositAmount: parseFloat(depositAmount.toString()) || 0,
          depositPaidAt: depositPaidAt || null,
          depositReceiptUrl,
          depositPaymentMethod,
          depositTransactionRef,
          finalPaid,
          finalAmount: parseFloat(finalAmount.toString()) || 0,
          finalPaidAt: finalPaidAt || null,
          finalReceiptUrl,
          finalPaymentMethod,
          finalTransactionRef
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      toast.success('Payment details saved successfully');
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save payment details');
    } finally {
      setSaving(false);
    }
  };

  // Use the quote's total cost for display (already calculated and saved)
  const remainingBalance = quoteTotalCost - (depositPaid ? depositAmount : 0) - (finalPaid ? finalAmount : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Payment Confirmation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Payment Summary */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-3">Payment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Contract Value:</span>
              <span className="font-semibold">${quoteTotalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deposit Paid:</span>
              <span className={depositPaid ? "text-green-600 font-semibold" : "text-gray-500"}>
                ${depositPaid ? depositAmount.toLocaleString() : '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Final Payment:</span>
              <span className={finalPaid ? "text-green-600 font-semibold" : "text-gray-500"}>
                ${finalPaid ? finalAmount.toLocaleString() : '0'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Remaining Balance:</span>
              <span className={`font-bold ${remainingBalance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                ${remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Deposit Payment Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Deposit Payment
            </h3>
            {depositPaid ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Paid
              </Badge>
            ) : (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="depositAmount">Deposit Amount ($)</Label>
              <Input
                id="depositAmount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="depositPaidAt">Payment Date</Label>
              <Input
                id="depositPaidAt"
                type="date"
                value={depositPaidAt}
                onChange={(e) => setDepositPaidAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="depositMethod">Payment Method</Label>
              <select
                id="depositMethod"
                value={depositPaymentMethod}
                onChange={(e) => setDepositPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select method...</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <Label htmlFor="depositRef">Transaction Reference</Label>
              <Input
                id="depositRef"
                value={depositTransactionRef}
                onChange={(e) => setDepositTransactionRef(e.target.value)}
                placeholder="TXN-123456"
              />
            </div>
          </div>

          {/* Upload Receipt */}
          <div className="space-y-2">
            <Label>Payment Receipt</Label>
            {depositReceiptUrl ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Paperclip className="h-4 w-4 text-green-600" />
                <span className="text-sm flex-1 truncate">{depositReceiptUrl.split('/').pop()}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(depositReceiptUrl, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDepositReceiptUrl('')}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="depositReceipt"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'deposit');
                  }}
                />
                <label htmlFor="depositReceipt" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload receipt</p>
                  <p className="text-xs text-gray-400">PDF or Image</p>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="depositPaid"
              checked={depositPaid}
              onChange={(e) => setDepositPaid(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="depositPaid" className="cursor-pointer">
              Confirm deposit payment received
            </Label>
          </div>
        </div>

        <Separator />

        {/* Final Payment Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Final Payment
            </h3>
            {finalPaid ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Paid
              </Badge>
            ) : (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="finalAmount">Final Amount ($)</Label>
              <Input
                id="finalAmount"
                type="number"
                value={finalAmount}
                onChange={(e) => setFinalAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="finalPaidAt">Payment Date</Label>
              <Input
                id="finalPaidAt"
                type="date"
                value={finalPaidAt}
                onChange={(e) => setFinalPaidAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="finalMethod">Payment Method</Label>
              <select
                id="finalMethod"
                value={finalPaymentMethod}
                onChange={(e) => setFinalPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select method...</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <Label htmlFor="finalRef">Transaction Reference</Label>
              <Input
                id="finalRef"
                value={finalTransactionRef}
                onChange={(e) => setFinalTransactionRef(e.target.value)}
                placeholder="TXN-123456"
              />
            </div>
          </div>

          {/* Upload Receipt */}
          <div className="space-y-2">
            <Label>Payment Receipt</Label>
            {finalReceiptUrl ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Paperclip className="h-4 w-4 text-green-600" />
                <span className="text-sm flex-1 truncate">{finalReceiptUrl.split('/').pop()}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(finalReceiptUrl, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFinalReceiptUrl('')}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="finalReceipt"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'final');
                  }}
                />
                <label htmlFor="finalReceipt" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload receipt</p>
                  <p className="text-xs text-gray-400">PDF or Image</p>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="finalPaid"
              checked={finalPaid}
              onChange={(e) => setFinalPaid(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="finalPaid" className="cursor-pointer">
              Confirm final payment received
            </Label>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving || uploading}
          className="w-full"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Payment Details
            </>
          )}
        </Button>

        {/* Payment Status */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Payment Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Deposit:</span>
              {depositPaid ? (
                <Badge className="bg-green-600">Confirmed</Badge>
              ) : (
                <Badge variant="destructive">Not Paid</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Final Payment:</span>
              {finalPaid ? (
                <Badge className="bg-green-600">Confirmed</Badge>
              ) : (
                <Badge variant="destructive">Not Paid</Badge>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Overall Status:</span>
              {depositPaid && finalPaid ? (
                <Badge className="bg-green-600">Fully Paid</Badge>
              ) : depositPaid ? (
                <Badge className="bg-orange-500">Partially Paid</Badge>
              ) : (
                <Badge variant="destructive">Unpaid</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
