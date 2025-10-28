'use client';

import { useState } from 'react';
import { HelpCircle, Lightbulb, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FAQSectionProps {
  initialFAQs: FAQ[];
}

export default function FAQSection({ initialFAQs }: FAQSectionProps) {
  const [displayCount, setDisplayCount] = useState(6);
  const visibleFAQs = initialFAQs.slice(0, displayCount);
  const hasMore = displayCount < initialFAQs.length;

  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 7, initialFAQs.length));
  };

  if (initialFAQs.length === 0) return null;

  return (
    <section id="faqs" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-100 rounded-full p-3 mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-4xl font-bold text-primary mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Get answers to common questions about solar power
          </p>
        </div>

        <div className="space-y-4">
          {visibleFAQs.map((faq) => (
            <details key={faq.id} className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:hidden flex-shrink-0" />
                <ChevronUp className="w-5 h-5 text-blue-600 hidden group-open:block flex-shrink-0" />
              </summary>
              <div className="px-6 pb-6 pt-2">
                <div className="pl-14 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {faq.answer}
                </div>
              </div>
            </details>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-8">
            <Button
              onClick={loadMore}
              variant="outline"
              size="lg"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Load More FAQs ({initialFAQs.length - displayCount} remaining)
              <ChevronDown className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <Link href="/calculator-v2">
            <Button size="lg" className="bg-coral hover:bg-coral/90">
              Get Your Free Quote
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
