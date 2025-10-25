'use client';

import { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onCancel?: () => void;
  label?: string;
  required?: boolean;
}

export function SignaturePad({ onSave, onCancel, label = 'Signature', required = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setContext(ctx);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;

    setIsDrawing(true);
    setIsEmpty(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    setIsDrawing(false);
    context.closePath();
  };

  const clear = () => {
    if (!context || !canvasRef.current) return;

    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const save = () => {
    if (!canvasRef.current) return;
    if (isEmpty) {
      alert('Please provide a signature');
      return;
    }

    // Convert canvas to base64 image
    const signature = canvasRef.current.toDataURL('image/png');
    onSave(signature);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={isEmpty}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-48 border-2 border-gray-300 rounded-lg cursor-crosshair bg-white touch-none"
          style={{ touchAction: 'none' }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Sign here</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={save}
          disabled={isEmpty}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          <Check className="h-4 w-4 mr-2" />
          Save Signature
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        By signing, you confirm that the information provided is accurate and complete.
      </p>
    </div>
  );
}

interface SignatureDisplayProps {
  signature: string;
  label?: string;
  onEdit?: () => void;
}

export function SignatureDisplay({ signature, label = 'Signature', onEdit }: SignatureDisplayProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
          >
            Edit
          </Button>
        )}
      </div>
      <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
        <img src={signature} alt={label} className="max-h-32 mx-auto" />
      </div>
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="h-4 w-4" />
        <span>Signed on {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}
