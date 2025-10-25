'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListChecks, CheckCircle } from 'lucide-react';

export default function ComplianceChecklistPage() {
  const checklistItems = [
    {
      category: 'Pre-Installation',
      items: [
        'Site photos (4+ angles)',
        'Roof assessment',
        'Shading analysis',
        'Customer ID verification',
        'Property ownership proof',
      ],
    },
    {
      category: 'Equipment Documentation',
      items: [
        'Photo of EVERY panel serial number',
        'Inverter serial number',
        'Battery serial number (if applicable)',
        'Scan QR codes',
        'Verify CEC approved list',
      ],
    },
    {
      category: 'Installation Progress',
      items: [
        '15-20 photos of roof work',
        'Electrical work photos',
        'Battery installation photos (if applicable)',
        'Cable management photos',
      ],
    },
    {
      category: 'Safety & Compliance',
      items: [
        'Installer selfie with ID badge',
        'CEC accreditation card',
        'Electrical license',
        'Safety equipment photos',
      ],
    },
    {
      category: 'Testing',
      items: [
        'Insulation resistance test',
        'Earth continuity test',
        'Polarity tests',
        'System performance photos',
      ],
    },
    {
      category: 'Final Documentation',
      items: [
        'Completed system photos',
        'Clean site photos',
        'Customer handover photo',
        'COES certificate',
        'Certificate of Compliance',
        'Commissioning report',
        'Customer signatures',
      ],
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ListChecks className="h-8 w-8" />
          Installation Compliance Checklist
        </h1>
        <p className="text-muted-foreground">
          Complete requirements for rebates and loan approvals
        </p>
      </div>

      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="text-lg font-semibold mb-2">📸 Photo Requirements</h3>
        <p className="text-sm text-gray-700">
          Minimum 30-50 photos required total for compliance and rebate applications
        </p>
      </Card>

      <div className="grid gap-4">
        {checklistItems.map((section) => (
          <Card key={section.category} className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              {section.category}
            </h3>
            <div className="grid gap-2">
              {section.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold mb-2 text-red-800">🚨 Critical Requirements</h3>
        <ul className="text-sm space-y-1 text-red-700">
          <li>• All equipment serial numbers must be photographed clearly</li>
          <li>• VPP enrollment mandatory for all battery systems</li>
          <li>• Installer selfie with ID badge required</li>
          <li>• Minimum 30-50 photos total</li>
        </ul>
      </Card>
    </div>
  );
}
