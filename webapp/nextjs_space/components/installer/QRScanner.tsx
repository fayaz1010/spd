'use client';

import { useState, useRef, useEffect } from 'react';
import { Scan, X, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface QRScanResult {
  data: string;
  photo: string; // base64 image
  timestamp: Date;
}

interface QRScannerProps {
  onScan: (result: QRScanResult) => void;
  label: string;
  placeholder?: string;
  validateFormat?: (value: string) => boolean;
}

export function QRScanner({
  onScan,
  label,
  placeholder = 'Scan or enter manually',
  validateFormat,
}: QRScannerProps) {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopScanner();
    };
  }, []);

  const handleManualInput = (input: string) => {
    setValue(input);
    const valid = validateFormat ? validateFormat(input) : input.length > 0;
    setIsValid(valid);
    if (valid) {
      // Manual entry - no photo
      onScan({
        data: input,
        photo: '',
        timestamp: new Date(),
      });
    }
  };

  const startScanner = async () => {
    try {
      setShowScanner(true);
      setCameraReady(false);
      
      // Try mobile camera first, fallback to any camera for desktop
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false,
        });
      } catch (err) {
        // Fallback for desktop/webcam without facingMode
        console.log('[QR Scanner] Falling back to default camera');
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false,
        });
      }
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('[QR Scanner] Video metadata loaded');
          videoRef.current?.play().then(() => {
            console.log('[QR Scanner] Video playing, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
            setCameraReady(true);
            setScanning(true);
            startScanningLoop();
          }).catch(err => {
            console.error('[QR Scanner] Video play error:', err);
            toast.error('Could not start camera');
          });
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Could not access camera');
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setShowScanner(false);
    setScanning(false);
    setCameraReady(false);
  };

  const startScanningLoop = () => {
    console.log('[QR Scanner] Starting scanning loop...');
    // Scan every 300ms
    scanIntervalRef.current = setInterval(() => {
      scanFrame();
    }, 300);
  };

  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (canvas.width === 0 || canvas.height === 0) {
      console.log('[QR Scanner] Invalid canvas dimensions');
      return;
    }
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    console.log('[QR Scanner] Scanning frame...', canvas.width, 'x', canvas.height);

    // Try QR code detection first (jsQR)
    try {
      // @ts-ignore - jsQR will be loaded via CDN
      if (typeof window !== 'undefined' && window.jsQR) {
        // @ts-ignore
        const qrCode = window.jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (qrCode && qrCode.data) {
          console.log('[QR Scanner] QR Code detected:', qrCode.data);
          const photoData = canvas.toDataURL('image/jpeg', 0.9);
          handleScanSuccess(qrCode.data, photoData);
          return;
        }
      }
    } catch (error) {
      console.error('[QR Scanner] QR scan error:', error);
    }

    // Try barcode detection (ZXing)
    try {
      // @ts-ignore - ZXing will be loaded via CDN
      if (typeof window !== 'undefined' && window.ZXing) {
        // @ts-ignore
        const codeReader = new window.ZXing.BrowserMultiFormatReader();
        
        // Use decodeFromImageData which works with canvas ImageData
        const result = await codeReader.decodeFromImageData(imageData);
        
        if (result && result.text) {
          console.log('[QR Scanner] Barcode detected:', result.text);
          const photoData = canvas.toDataURL('image/jpeg', 0.9);
          handleScanSuccess(result.text, photoData);
          return;
        }
      }
    } catch (error) {
      // Barcode not found - this is normal, keep scanning
      // Only log actual errors, not "not found"
      // @ts-ignore
      if (error && error.message && !error.message.includes('NotFoundException')) {
        console.error('[QR Scanner] Barcode scan error:', error);
      }
    }
  };

  const handleScanSuccess = (scannedValue: string, photoData: string) => {
    setValue(scannedValue);
    const valid = validateFormat ? validateFormat(scannedValue) : scannedValue.length > 0;
    setIsValid(valid);
    
    if (valid) {
      onScan({
        data: scannedValue,
        photo: photoData,
        timestamp: new Date(),
      });
      toast.success('Code scanned & photo captured');
      stopScanner();
    } else {
      toast.error('Invalid code format');
    }
  };

  return (
    <div className="space-y-3">
      {/* Scanner View */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative h-full">
            {/* Loading Indicator */}
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
            
            {/* Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ opacity: cameraReady ? 1 : 0 }}
            />
            
            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Overlay */}
            {cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning Frame */}
                  <div className="w-64 h-64 border-4 border-white rounded-lg relative">
                    <div className="absolute inset-0 border-2 border-green-500 animate-pulse" />
                  </div>
                  <p className="text-white text-center mt-4 text-lg font-medium">
                    Position QR/Barcode in frame
                  </p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={stopScanner}
                className="text-white bg-black/50 hover:bg-black/70"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <label className="text-sm font-medium text-gray-900">{label}</label>

      {/* Manual Input */}
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleManualInput(e.target.value)}
          placeholder={placeholder}
          className={`pr-10 ${
            isValid === true
              ? 'border-green-500 focus:ring-green-500'
              : isValid === false
              ? 'border-red-500 focus:ring-red-500'
              : ''
          }`}
        />
        {isValid !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Scan Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={startScanner}
      >
        <Camera className="w-4 h-4 mr-2" />
        Scan QR/Barcode
      </Button>
    </div>
  );
}
