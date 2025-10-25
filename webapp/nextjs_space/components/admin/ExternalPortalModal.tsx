'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExternalPortalModalProps {
  portalName: string;
  portalUrl: string;
  trigger: React.ReactNode;
  copyData?: { label: string; value: string }[];
}

export function ExternalPortalModal({
  portalName,
  portalUrl,
  trigger,
  copyData = [],
}: ExternalPortalModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  const handleOpenExternal = () => {
    window.open(portalUrl, '_blank');
  };

  const handleOpenSideBySide = () => {
    // Get current window dimensions and position
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const currentLeft = window.screenX || window.screenLeft;
    const currentTop = window.screenY || window.screenTop;
    
    // Calculate new window size (half of screen width)
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    const newWidth = Math.floor(screenWidth / 2);
    const newHeight = screenHeight;
    
    // Position new window on the right side
    const newLeft = currentLeft + Math.floor(currentWidth / 2);
    const newTop = 0;
    
    // Resize current window to left half
    window.resizeTo(Math.floor(screenWidth / 2), screenHeight);
    window.moveTo(0, 0);
    
    // Open new window on right half
    const features = `width=${newWidth},height=${newHeight},left=${newLeft},top=${newTop},resizable=yes,scrollbars=yes,status=yes`;
    window.open(portalUrl, '_blank', features);
    
    toast.success('Portal opened side-by-side!');
    setIsOpen(false);
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className={`${
            isFullscreen 
              ? 'max-w-[100vw] max-h-[100vh] w-full h-full m-0 p-0' 
              : 'max-w-[90vw] max-h-[90vh] w-full h-full'
          }`}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">{portalName}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleOpenSideBySide}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Side-by-Side
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenExternal}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  New Tab
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            {/* Left Panel - Copy Data */}
            {copyData.length > 0 && (
              <div className="lg:w-80 border-r bg-gray-50 p-4 overflow-y-auto">
                <h3 className="font-semibold mb-3 text-sm text-gray-700">
                  Quick Copy Data
                </h3>
                <div className="space-y-2">
                  {copyData.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                          <p className="text-sm font-medium text-gray-900 break-all">
                            {item.value}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(item.value, item.label)}
                          className="shrink-0"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right Panel - Iframe or Fallback */}
            <div className="flex-1 relative bg-gray-50">
              {!iframeBlocked ? (
                <>
                  <iframe
                    src={portalUrl}
                    className="w-full h-full border-0"
                    title={portalName}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                    onLoad={(e) => {
                      // Check if iframe loaded successfully
                      try {
                        const iframe = e.target as HTMLIFrameElement;
                        // Try to access iframe content - will fail if blocked
                        iframe.contentWindow?.location.href;
                      } catch (err) {
                        // Iframe is blocked
                        setIframeBlocked(true);
                      }
                    }}
                  />
                  {/* Show fallback after 2 seconds if iframe doesn't load */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-white"
                    style={{ 
                      animation: 'fadeIn 0.3s ease-in-out 2s forwards',
                      opacity: 0,
                      pointerEvents: 'none'
                    }}
                  >
                    <div className="text-center p-8 max-w-md">
                      <div className="mb-4 text-gray-400">
                        <ExternalLink className="w-16 h-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">
                        Portal May Be Blocked
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        If the portal doesn't load, it may block iframe embedding. Click below to open in a new tab.
                      </p>
                      <Button 
                        onClick={() => {
                          setIframeBlocked(true);
                          handleOpenExternal();
                        }} 
                        className="w-full"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab Instead
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* Fallback UI when iframe is blocked */
                <div className="flex items-center justify-center h-full bg-white">
                  <div className="text-center p-8 max-w-md">
                    <div className="mb-4 text-blue-500">
                      <ExternalLink className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">
                      Portal Blocks Embedding
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      {portalName} doesn't allow iframe embedding for security reasons.
                      <br />
                      <strong>Use the copy buttons on the left</strong>, then open the portal.
                    </p>
                    <div className="space-y-3">
                      <Button 
                        onClick={handleOpenSideBySide} 
                        className="w-full bg-blue-600 hover:bg-blue-700" 
                        size="lg"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Side-by-Side (Recommended)
                      </Button>
                      <Button 
                        onClick={handleOpenExternal} 
                        variant="outline"
                        className="w-full" 
                        size="lg"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      💡 Tip: Side-by-side mode arranges windows for easy copy-paste
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
