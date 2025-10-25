'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import {
  validateSelfie,
  addSelfieOverlay,
  getSelfieRequirement,
  type SelfieMetadata
} from '@/lib/selfieCapture';

interface InstallerSelfieCaptureProps {
  jobId: string;
  stage: 'clock_in' | 'pre_install' | 'during_install' | 'post_install' | 'clock_out';
  onComplete: (selfieUrl: string, metadata: SelfieMetadata) => void;
  onSkip?: () => void;
  onClose: () => void;
}

export function InstallerSelfieCapture({
  jobId,
  stage,
  onComplete,
  onSkip,
  onClose
}: InstallerSelfieCaptureProps) {
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requirement = getSelfieRequirement(stage);

  useEffect(() => {
    if (capturing) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [capturing]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setCapturing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Get image as data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    setCapturing(false);
    stopCamera();

    // Validate the captured image
    validateCapturedImage(imageDataUrl);
  };

  const validateCapturedImage = async (dataUrl: string) => {
    setValidating(true);
    try {
      // Convert data URL to File
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

      // Validate selfie
      const result = await validateSelfie(file, stage, true);
      setValidationResult(result);

      if (result.isValid) {
        toast.success('Selfie validated successfully!');
      } else {
        toast.error('Selfie validation failed');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate selfie');
    } finally {
      setValidating(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setValidating(true);
    try {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setCapturedImage(dataUrl);

        // Validate
        const result = await validateSelfie(file, stage, true);
        setValidationResult(result);

        if (result.isValid) {
          toast.success('Selfie validated successfully!');
        } else {
          toast.error('Selfie validation failed');
        }
        setValidating(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to read file');
      setValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!capturedImage || !validationResult?.isValid) {
      toast.error('Cannot confirm invalid selfie');
      return;
    }

    setUploading(true);
    try {
      // Convert data URL to blob
      const blob = await (await fetch(capturedImage)).blob();
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

      // Add overlay with metadata
      const overlayedBlob = await addSelfieOverlay(file, validationResult.metadata);

      // Upload to server
      const formData = new FormData();
      formData.append('photo', overlayedBlob, 'selfie.jpg');
      formData.append('category', 'safety');
      formData.append('subcategory', stage);
      formData.append('jobId', jobId);
      formData.append('metadata', JSON.stringify(validationResult.metadata));

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/jobs/${jobId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      toast.success('Selfie uploaded successfully!');
      onComplete(data.photo.photoUrl, validationResult.metadata);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload selfie');
    } finally {
      setUploading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setValidationResult(null);
    setCapturing(true);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-blue-50">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold">{requirement?.name}</h2>
              <p className="text-sm text-gray-600">{requirement?.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Camera View */}
          {capturing && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border-4 border-blue-500"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Camera Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-white/30 rounded-lg m-4" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-64 border-4 border-white/50 rounded-full" />
                </div>
              </div>

              <Alert className="mt-4">
                <Camera className="h-4 w-4" />
                <AlertDescription>
                  Position your face in the oval and ensure good lighting
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Captured Image */}
          {capturedImage && !capturing && (
            <div className="space-y-4">
              <img
                src={capturedImage}
                alt="Captured selfie"
                className="w-full rounded-lg border-4 border-green-500"
              />

              {/* Validation Result */}
              {validating && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>Validating selfie...</AlertDescription>
                </Alert>
              )}

              {validationResult && !validating && (
                <div className="space-y-2">
                  {validationResult.isValid ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Selfie validated!</strong>
                        {validationResult.metadata.faceDetected && ' Face detected.'}
                        {validationResult.metadata.latitude && ' GPS location captured.'}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Validation failed:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {validationResult.errors.map((error: string, i: number) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {validationResult.warnings.map((warning: string, i: number) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Metadata Display */}
                  {validationResult.metadata && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                      <div><strong>Stage:</strong> {requirement?.name}</div>
                      <div><strong>Time:</strong> {new Date(validationResult.metadata.timestamp).toLocaleString()}</div>
                      {validationResult.metadata.latitude && (
                        <div>
                          <strong>GPS:</strong> {validationResult.metadata.latitude.toFixed(6)}, {validationResult.metadata.longitude?.toFixed(6)}
                          {validationResult.metadata.accuracy && ` (±${Math.round(validationResult.metadata.accuracy)}m)`}
                        </div>
                      )}
                      {validationResult.metadata.faceDetected !== undefined && (
                        <div>
                          <strong>Face Detection:</strong>{' '}
                          {validationResult.metadata.faceDetected ? (
                            <Badge className="bg-green-600">✓ Detected</Badge>
                          ) : (
                            <Badge variant="destructive">✗ Not Detected</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Initial State */}
          {!capturing && !capturedImage && (
            <div className="text-center space-y-4 py-8">
              <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-16 w-16 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{requirement?.name}</h3>
                <p className="text-gray-600">{requirement?.description}</p>
              </div>
              {requirement?.required && (
                <Badge variant="destructive">Required</Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!capturing && !capturedImage && (
              <>
                <Button onClick={() => setCapturing(true)} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Selfie
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Choose Photo
                </Button>
              </>
            )}

            {capturing && (
              <>
                <Button onClick={capturePhoto} className="flex-1" size="lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Capture
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCapturing(false);
                    stopCamera();
                  }}
                >
                  Cancel
                </Button>
              </>
            )}

            {capturedImage && !capturing && (
              <>
                <Button
                  onClick={handleConfirm}
                  disabled={!validationResult?.isValid || uploading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm & Upload
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleRetake}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
              </>
            )}

            {!requirement?.required && onSkip && !capturing && !capturedImage && (
              <Button variant="ghost" onClick={onSkip}>
                Skip (Optional)
              </Button>
            )}
          </div>

          {/* Help Text */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips for a good selfie:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>Ensure your face is clearly visible</li>
                <li>Use good lighting</li>
                <li>Remove sunglasses or hats if possible</li>
                <li>Hold camera at eye level</li>
                <li>GPS location will be automatically captured</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
