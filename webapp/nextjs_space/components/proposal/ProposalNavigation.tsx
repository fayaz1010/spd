'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface ProposalNavigationProps {
  activeSection: string;
  hasSavingsData: boolean;
}

export default function ProposalNavigation({
  activeSection,
  hasSavingsData,
}: ProposalNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    { id: 'hero', label: 'Overview' },
    { id: 'summary', label: 'Summary' },
    { id: 'property', label: 'Property' },
    { id: 'system', label: 'System' },
    { id: 'production', label: 'Production' },
    { id: 'costs', label: 'Costs' },
    { id: 'savings', label: 'Savings' },
    ...(hasSavingsData ? [{ id: 'roi', label: 'ROI' }] : []),
    { id: 'environment', label: 'Environment' },
    { id: 'included', label: "What's Included" },
    { id: 'installation', label: 'Installation' },
    { id: 'terms', label: 'Terms' },
    { id: 'signature', label: 'Sign' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for fixed nav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className={`hidden lg:block fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white shadow-md py-2'
            : 'bg-white/90 backdrop-blur-sm py-4'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">☀️</span>
              </div>
              <span className="font-bold text-gray-900">Sun Direct Power</span>
            </div>

            <div className="flex items-center space-x-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">☀️</span>
            </div>
            <span className="font-bold text-gray-900">Sun Direct Power</span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t">
            <div className="py-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16 lg:h-20" />
    </>
  );
}
