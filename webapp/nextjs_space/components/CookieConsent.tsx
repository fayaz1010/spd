'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        console.error('Error parsing cookie consent:', e);
      }
    }
  }, []);

  const saveConsent = (prefs: typeof preferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    setShowCustomize(false);
    
    // Here you would typically initialize analytics/marketing scripts based on preferences
    if (prefs.analytics) {
      // Initialize Google Analytics
      console.log('Analytics enabled');
    }
    if (prefs.marketing) {
      // Initialize marketing pixels
      console.log('Marketing enabled');
    }
  };

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  };

  const rejectNonEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    saveConsent(essentialOnly);
  };

  const saveCustomPreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-2 border-gray-200 shadow-2xl animate-slide-up">
      <div className="max-w-7xl mx-auto">
        {!showCustomize ? (
          // Main Banner
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">We Use Cookies</h3>
                <p className="text-sm text-gray-600">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                  By clicking "Accept All", you consent to our use of cookies.{' '}
                  <Link href="/cookie-policy" className="text-coral hover:text-coral-600 underline">
                    Learn more
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomize(true)}
                className="flex-1 md:flex-none"
              >
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectNonEssential}
                className="flex-1 md:flex-none"
              >
                Reject Non-Essential
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
                className="bg-coral hover:bg-coral-600 text-white flex-1 md:flex-none"
              >
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          // Customize Panel
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Cookie className="w-5 h-5 text-orange-600" />
                Customize Cookie Preferences
              </h3>
              <button
                onClick={() => setShowCustomize(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Essential Cookies */}
              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900">Essential Cookies</h4>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Required</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Necessary for the website to function. Cannot be disabled.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mt-1"
                />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">Analytics Cookies</h4>
                  <p className="text-xs text-gray-600">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="mt-1"
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">Marketing Cookies</h4>
                  <p className="text-xs text-gray-600">
                    Used to deliver personalized advertisements and track campaign performance.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomize(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveCustomPreferences}
                className="bg-coral hover:bg-coral-600 text-white"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
