'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Eraser, Check, X } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureData: string, signerName: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export function SignaturePad({ 
  onSave, 
  onCancel,
  title = "Sign Your Quote",
  description = "Please sign below to accept this quote"
}: SignaturePadProps) {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [signerName, setSignerName] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigPadRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigPadRef.current && !isEmpty && signerName.trim()) {
      const signatureData = sigPadRef.current.toDataURL('image/png');
      onSave(signatureData, signerName);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signer Name Input */}
        <div className="space-y-2">
          <Label htmlFor="signerName">Full Name *</Label>
          <Input
            id="signerName"
            type="text"
            placeholder="Enter your full name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            required
          />
        </div>

        {/* Signature Canvas */}
        <div className="space-y-2">
          <Label>Signature *</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <SignatureCanvas
              ref={sigPadRef}
              canvasProps={{
                className: 'w-full h-48 cursor-crosshair',
              }}
              onBegin={handleBegin}
              backgroundColor="rgb(255, 255, 255)"
            />
          </div>
          <p className="text-sm text-gray-500">
            Sign above using your mouse or touchscreen
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isEmpty}
          >
            <Eraser className="w-4 h-4 mr-2" />
            Clear
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isEmpty || !signerName.trim()}
          >
            <Check className="w-4 h-4 mr-2" />
            Accept & Sign
          </Button>
        </div>

        {/* Legal Text */}
        <div className="text-xs text-gray-500 border-t pt-4">
          <p>
            By signing this document, you acknowledge that you have read and agree to the terms and conditions outlined in this quote. 
            This electronic signature is legally binding and has the same effect as a handwritten signature.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
