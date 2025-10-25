'use client';

import { useState, useRef } from 'react';
import { CheckCircle, Edit3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface SignatureSectionProps {
  quoteId: string;
  token: string;
  customerName: string;
  isSigned: boolean;
}

export default function SignatureSection({
  quoteId,
  token,
  customerName,
  isSigned,
}: SignatureSectionProps) {
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState(false);
  const [agreedInstallation, setAgreedInstallation] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    // Validation
    if (!agreedTerms || !agreedPrice || !agreedInstallation) {
      alert('Please accept all terms before signing');
      return;
    }

    let signatureData = '';

    if (signatureMethod === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      signatureData = canvas.toDataURL();
    } else {
      if (!typedName.trim()) {
        alert('Please enter your name');
        return;
      }
      signatureData = `typed:${typedName}`;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/signatures/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          signatureData,
          signerName: signatureMethod === 'type' ? typedName : customerName,
          signatureMethod,
        }),
      });

      if (response.ok) {
        alert('Proposal signed successfully! We\'ll be in touch soon.');
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to sign proposal. Please try again.');
      }
    } catch (error) {
      console.error('Error signing proposal:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSigned) {
    return (
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-12 text-center">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Proposal Signed! ✓
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Thank you for choosing Sun Direct Power. We'll contact you shortly to schedule your installation.
            </p>
            <p className="text-sm text-gray-600">
              A confirmation email has been sent to your inbox.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Accept Your Proposal
          </h2>
          <p className="text-xl text-gray-600">
            Review and sign to proceed with your solar installation
          </p>
        </div>

        {/* Agreement Checkboxes */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Please confirm the following:
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Checkbox
                id="terms"
                checked={agreedTerms}
                onCheckedChange={(checked) => setAgreedTerms(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                I have reviewed this proposal and understand the terms and conditions outlined above
              </label>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Checkbox
                id="price"
                checked={agreedPrice}
                onCheckedChange={(checked) => setAgreedPrice(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="price" className="text-sm text-gray-700 cursor-pointer">
                I accept the quoted price and payment terms for this solar system installation
              </label>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Checkbox
                id="installation"
                checked={agreedInstallation}
                onCheckedChange={(checked) => setAgreedInstallation(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="installation" className="text-sm text-gray-700 cursor-pointer">
                I authorize Sun Direct Power to proceed with the installation of this solar system
              </label>
            </div>
          </div>
        </div>

        {/* Signature Method Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Sign Your Proposal
          </h3>

          {/* Method Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSignatureMethod('draw')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-colors ${
                signatureMethod === 'draw'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Edit3 className="w-5 h-5 inline-block mr-2" />
              Draw Signature
            </button>
            <button
              onClick={() => setSignatureMethod('type')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-colors ${
                signatureMethod === 'type'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Check className="w-5 h-5 inline-block mr-2" />
              Type Name
            </button>
          </div>

          {/* Draw Signature */}
          {signatureMethod === 'draw' && (
            <div>
              <Label className="mb-2 block">Draw your signature below:</Label>
              <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={200}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <Button
                variant="outline"
                onClick={clearSignature}
                className="mt-3"
              >
                Clear Signature
              </Button>
            </div>
          )}

          {/* Type Name */}
          {signatureMethod === 'type' && (
            <div>
              <Label htmlFor="typedName" className="mb-2 block">
                Type your full name:
              </Label>
              <Input
                id="typedName"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="John Smith"
                className="text-2xl font-serif text-center py-6"
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                This will serve as your electronic signature
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <Button
            onClick={handleSubmit}
            disabled={loading || !agreedTerms || !agreedPrice || !agreedInstallation}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-xl rounded-xl shadow-lg"
          >
            {loading ? 'Submitting...' : 'Submit Acceptance'}
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            By signing, you agree to proceed with this solar installation
          </p>
        </div>
      </div>
    </div>
  );
}
