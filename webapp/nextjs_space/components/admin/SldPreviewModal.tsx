'use client';

import { useState, useEffect } from 'react';
import { X, Download, Edit, Check } from 'lucide-react';

interface SldPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgContent: string;
  fileName: string;
  jobNumber: string;
}

export function SldPreviewModal({
  isOpen,
  onClose,
  svgContent,
  fileName,
  jobNumber,
}: SldPreviewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSvg, setEditedSvg] = useState(svgContent);

  // Update editedSvg when svgContent changes
  useEffect(() => {
    if (svgContent) {
      setEditedSvg(svgContent);
    }
  }, [svgContent]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const blob = new Blob([editedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // TODO: Save to database
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Single Line Diagram Preview</h2>
            <p className="text-sm text-gray-600">Job: {jobNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </>
            )}
            {isEditing && (
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          {!isEditing ? (
            // Preview Mode
            <div className="w-full h-full bg-gray-50 rounded-lg overflow-auto">
              <div 
                className="w-full min-h-full p-4"
                dangerouslySetInnerHTML={{ __html: editedSvg }}
              />
            </div>
          ) : (
            // Edit Mode
            <div className="w-full h-full flex gap-4">
              {/* SVG Code Editor */}
              <div className="w-1/2 flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  SVG Code (Edit):
                </label>
                <textarea
                  value={editedSvg}
                  onChange={(e) => setEditedSvg(e.target.value)}
                  className="flex-1 p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  spellCheck={false}
                />
              </div>

              {/* Live Preview */}
              <div className="w-1/2 flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  Live Preview:
                </label>
                <div className="flex-1 bg-gray-50 rounded-lg overflow-auto">
                  <div 
                    className="w-full min-h-full p-4"
                    dangerouslySetInnerHTML={{ __html: editedSvg }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">File:</span> {fileName}
            </div>
            <div>
              <span className="font-medium">Size:</span>{' '}
              {(editedSvg.length / 1024).toFixed(2)} KB
            </div>
            <div>
              <span className="font-medium">Format:</span> SVG (Scalable Vector Graphics)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
