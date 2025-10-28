'use client';

import { usePathname } from 'next/navigation';
import ChatbotWidget from './ChatbotWidget-v2'; // Switched to v2 with settings integration
import { useEffect, useState } from 'react';

export default function ChatbotProvider() {
  const pathname = usePathname();
  const [context, setContext] = useState<'website' | 'portal'>('website');
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [leadId, setLeadId] = useState<string | undefined>();

  useEffect(() => {
    // Determine context based on pathname
    if (pathname?.startsWith('/portal')) {
      setContext('portal');
      
      // Try to get customer info from token
      try {
        const token = localStorage.getItem('customer_token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCustomerId(payload.userId);
          setLeadId(payload.leadId);
        }
      } catch (error) {
        console.error('Failed to parse customer token:', error);
      }
    } else {
      setContext('website');
      setCustomerId(undefined);
      setLeadId(undefined);
    }
  }, [pathname]);

  // Don't show chatbot on admin pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/installer')) {
    return null;
  }

  return (
    <ChatbotWidget
      context={context}
      customerId={customerId}
      leadId={leadId}
    />
  );
}
