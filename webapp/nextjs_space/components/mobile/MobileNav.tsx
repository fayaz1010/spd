'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Briefcase, 
  CheckSquare, 
  Camera, 
  Settings,
  Menu,
  X,
  Shield,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
  userRole?: 'installer' | 'admin' | 'team';
}

export function MobileNav({ userRole = 'installer' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/team/mobile', icon: Home, label: 'Dashboard' },
    { href: '/team/mobile/jobs', icon: Briefcase, label: 'Jobs' },
    { href: '/team/mobile/compliance', icon: Shield, label: 'Compliance' },
    { href: '/team/mobile/photos', icon: Camera, label: 'Photos' },
    { href: '/team/mobile/service', icon: CheckSquare, label: 'Service' },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary rounded-lg p-2">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-primary">Sun Direct</h1>
              <p className="text-xs text-gray-600">Installer Portal</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-gradient-primary text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/team/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Settings</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive(item.href) ? 'text-blue-600' : ''}`} />
              <span className="text-xs font-medium truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacer for fixed header and bottom nav */}
      <div className="lg:hidden h-16" /> {/* Top spacer */}
      <div className="lg:hidden h-20" /> {/* Bottom spacer */}
    </>
  );
}
