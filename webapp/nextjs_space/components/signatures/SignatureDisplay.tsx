'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface SignatureDisplayProps {
  signatureData: string;
  signerName: string;
  signedAt: Date | string;
  showBorder?: boolean;
}

export function SignatureDisplay({ 
  signatureData, 
  signerName, 
  signedAt,
  showBorder = true 
}: SignatureDisplayProps) {
  const formattedDate = typeof signedAt === 'string' 
    ? new Date(signedAt).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : signedAt.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-5 h-5" />
        <span className="font-semibold">Digitally Signed</span>
      </div>
      
      <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
        <img 
          src={signatureData} 
          alt="Signature" 
          className="max-h-32 mx-auto"
        />
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Signed by:</span>
          <span className="font-medium">{signerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium">{formattedDate}</span>
        </div>
      </div>
    </div>
  );

  if (showBorder) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Electronic Signature</CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}
