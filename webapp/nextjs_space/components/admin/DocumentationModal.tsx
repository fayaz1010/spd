'use client';

import { useState } from 'react';
import { X, Search, BookOpen, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DocumentationModalProps {
  onClose: () => void;
}

export default function DocumentationModal({ onClose }: DocumentationModalProps) {
  const [activeDoc, setActiveDoc] = useState<'quick' | 'guide'>('quick');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Product Management Documentation</h2>
              <p className="text-sm text-blue-100">Complete guide to managing products, suppliers & pricing</p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-blue-800">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b px-6 py-3 flex items-center justify-between bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveDoc('quick')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeDoc === 'quick'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Quick Reference</span>
            </button>
            <button
              onClick={() => setActiveDoc('guide')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeDoc === 'guide'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Complete Guide</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <iframe
            src={activeDoc === 'quick' ? '/docs/quick-reference.html' : '/docs/user-guide.html'}
            className="w-full h-full border-0"
            title="Documentation"
          />
        </div>
      </div>
    </div>
  );
}
