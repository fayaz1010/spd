'use client';

import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useState } from 'react';

export default function TermsAndConditions() {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const sections = [
    {
      id: 'payment',
      title: 'Payment Terms',
      content: [
        '30% deposit required to commence installation',
        'Balance payable on completion of installation',
        'Payment methods: Bank transfer, credit card, or approved financing',
        'Deposit is non-refundable after equipment has been ordered',
        'Final payment due within 7 days of installation completion',
      ],
    },
    {
      id: 'warranty',
      title: 'Warranty Information',
      content: [
        'Solar panels: 30-year performance warranty, 25-year product warranty',
        'Battery: 10-year manufacturer warranty',
        'Inverter: 10-year manufacturer warranty',
        'Workmanship: 10-year installation warranty',
        'Warranty claims must be lodged through Sun Direct Power',
        'Warranties void if system is modified by unauthorized parties',
      ],
    },
    {
      id: 'installation',
      title: 'Installation Terms',
      content: [
        'Installation scheduled after deposit payment and approvals received',
        'Customer must provide clear access to installation areas',
        'Installation may be delayed due to weather conditions',
        'Customer responsible for ensuring pets are secured during installation',
        'Any structural modifications require customer approval',
        'Site must be safe and accessible for installation team',
      ],
    },
    {
      id: 'cancellation',
      title: 'Cancellation Policy',
      content: [
        '10-day cooling-off period from contract signing',
        'Full refund available within cooling-off period',
        'After cooling-off period, cancellation fees may apply',
        'Deposit non-refundable after equipment ordered',
        'Customer liable for any costs incurred up to cancellation',
      ],
    },
    {
      id: 'performance',
      title: 'Performance Guarantee',
      content: [
        'Production estimates based on industry-standard calculations',
        'Actual production may vary due to weather, shading, and soiling',
        'System performance monitored through provided app',
        'Annual system health check included',
        'Performance issues addressed under warranty terms',
        'Customer responsible for basic system maintenance (cleaning panels)',
      ],
    },
    {
      id: 'rebates',
      title: 'Rebates & Incentives',
      content: [
        'All eligible rebates included in quoted price',
        'Sun Direct Power handles all rebate applications',
        'Rebate amounts subject to government program availability',
        'Customer must meet eligibility criteria for rebates',
        'Changes to rebate programs may affect final price',
        'Customer notified of any rebate changes before installation',
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Terms & Conditions
          </h2>
          <p className="text-xl text-gray-600">
            Important information about your solar installation
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {sections.map((section) => {
            const isExpanded = expandedSections[section.id];

            return (
              <div
                key={section.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100"
              >
                {/* Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {section.title}
                    </h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Content */}
                {isExpanded && (
                  <div className="px-6 pb-6">
                    <ul className="space-y-2">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Download Full Terms */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
          <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Need the Full Terms?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Download the complete terms and conditions document
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Download PDF
          </button>
        </div>

        {/* Contact */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Questions about our terms?{' '}
            <a href="mailto:info@sundirectpower.com.au" className="text-blue-600 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
