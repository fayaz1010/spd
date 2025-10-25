'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, Upload, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Photo {
  id: string;
  url: string;
  file: File;
  category: string;
  timestamp: Date;
}

interface PhotoCaptureProps {
  category: string;
  onPhotosChange: (photos: Photo[]) => void;
  existingPhotos?: Photo[];
  minPhotos?: number;
  maxPhotos?: number;
}

export function PhotoCapture({
  category,
  onPhotosChange,
  existingPhotos = [],
  minPhotos = 1,
  maxPhotos = 20,
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<Photo[]>(existingPhotos);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setCameraActive(true);
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
        console.log('[Photo Capture] Falling back to default camera');
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
          videoRef.current?.play().then(() => {
            setCameraReady(true);
          }).catch(err => {
            console.error('Video play error:', err);
            toast.error('Could not start camera');
          });
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Could not access camera');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setCameraReady(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      toast.error('Camera not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Ensure video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera not ready, please wait');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageUrl);
    }
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    // Convert base64 to File
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const photo: Photo = {
          id: `${Date.now()}`,
          url: capturedImage,
          file,
          category,
          timestamp: new Date(),
        };

        const updatedPhotos = [...photos, photo];
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos);
        setCapturedImage(null);
        toast.success('Photo saved');

        // Check if max reached - if so, stop camera
        if (updatedPhotos.length >= maxPhotos) {
          stopCamera();
          toast.success('Maximum photos reached');
        } else {
          // Keep camera running for next photo
          toast.success(`Photo ${updatedPhotos.length}/${maxPhotos} saved. Camera ready for next photo.`);
        }
      });
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: Photo[] = [];
    const remainingSlots = maxPhotos - photos.length;

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const photo: Photo = {
          id: `${Date.now()}-${i}`,
          url: URL.createObjectURL(file),
          file,
          category,
          timestamp: new Date(),
        };
        newPhotos.push(photo);
      }
    }

    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const removePhoto = (id: string) => {
    const updatedPhotos = photos.filter((p) => p.id !== id);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const isMinimumMet = photos.length >= minPhotos;
  const isMaximumReached = photos.length >= maxPhotos;

  return (
    <div className="space-y-4">
      {/* Camera View */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative h-full">
            {/* Loading Indicator */}
            {!cameraReady && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
            
            {/* Video Stream or Captured Image */}
            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ opacity: cameraReady ? 1 : 0 }}
              />
            ) : (
              <img
                src={capturedImage}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              {!capturedImage ? (
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={stopCamera}
                    className="text-white"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Camera className="w-8 h-8 text-black" />
                  </Button>
                  <div className="w-12" /> {/* Spacer */}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={retakePhoto}
                    className="flex-1"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Retake
                  </Button>
                  <Button
                    size="lg"
                    onClick={confirmPhoto}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Confirm
                  </Button>
                </div>
              )}
            </div>

            {/* Photo Counter */}
            <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-2 rounded-lg">
              {photos.length + (capturedImage ? 1 : 0)} / {maxPhotos}
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square">
              <img
                src={photo.url}
                alt="Captured"
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                {new Date(photo.timestamp).toLocaleTimeString('en-AU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Capture Buttons */}
      {!isMaximumReached && !cameraActive && (
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Button */}
          <Button
            type="button"
            variant="default"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={startCamera}
          >
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
          </Button>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between text-sm">
        <span className={isMinimumMet ? 'text-green-600' : 'text-orange-600'}>
          {photos.length} / {minPhotos} minimum
        </span>
        <span className="text-gray-500">
          {maxPhotos - photos.length} slots remaining
        </span>
      </div>
    </div>
  );
}
