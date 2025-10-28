'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Copy, FileText, CheckCircle } from 'lucide-react';

interface Position {
  id: string;
  positionCode: string;
  title: string;
  department: string;
  level: string;
  description: string;
  salaryType: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  employmentType: string;
  workLocations: string[];
  benefits: any[];
  responsibilities: string[];
  essentialRequirements: string[];
}

interface AdCopyGeneratorProps {
  position: Position;
}

export function AdCopyGenerator({ position }: AdCopyGeneratorProps) {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<'linkedin' | 'seek' | 'indeed' | 'generic'>('linkedin');
  const [copied, setCopied] = useState(false);

  const formatSalary = () => {
    if (position.salaryType === 'hourly') {
      return `$${position.hourlyRateMin}-${position.hourlyRateMax}/hour + 11.5% super`;
    } else {
      return `$${position.annualSalaryMin?.toLocaleString()}-${position.annualSalaryMax?.toLocaleString()}/year + super`;
    }
  };

  const generateAdCopy = () => {
    const salary = formatSalary();
    const locations = position.workLocations.join(', ');
    const topBenefits = position.benefits.slice(0, 5).map(b => b.description).join('\n✅ ');
    const topResponsibilities = position.responsibilities.slice(0, 5).join('\n• ');
    const topRequirements = position.essentialRequirements.slice(0, 5).join('\n• ');

    switch (platform) {
      case 'linkedin':
        return `🌟 We're Hiring: ${position.title} 🌟

Join Sun Direct Power - Western Australia's leading solar installation company!

📍 Location: ${locations}
💰 Salary: ${salary}
⏰ ${position.employmentType.replace('_', ' ')}

About the Role:
${position.description}

Key Responsibilities:
${topResponsibilities}

What We're Looking For:
${topRequirements}

Why Join Us?
✅ ${topBenefits}

Ready to power Australia's renewable energy future? Apply now!

👉 Visit our careers page: https://sundirectpower.com.au/careers
📧 Email: careers@sundirectpower.com.au
📞 Call: (08) 6156 6747

#SolarJobs #RenewableEnergy #Perth #WesternAustralia #Hiring #${position.title.replace(/\s+/g, '')}`;

      case 'seek':
        return `${position.title} - Sun Direct Power

Location: ${locations}
Salary: ${salary}
Job Type: ${position.employmentType.replace('_', ' ')}

About Sun Direct Power:
Western Australia's premier solar installation company, committed to delivering quality renewable energy solutions.

The Role:
${position.description}

Key Responsibilities:
${topResponsibilities}

Essential Requirements:
${topRequirements}

What We Offer:
✅ ${topBenefits}

How to Apply:
Visit https://sundirectpower.com.au/careers or email your resume to careers@sundirectpower.com.au

Sun Direct Power is an equal opportunity employer.`;

      case 'indeed':
        return `${position.title}

Sun Direct Power - ${locations}
${salary}
${position.employmentType.replace('_', ' ')}

Job Description:
${position.description}

Responsibilities:
${topResponsibilities}

Requirements:
${topRequirements}

Benefits:
✅ ${topBenefits}

To apply, visit: https://sundirectpower.com.au/careers

Company: Sun Direct Power
Industry: Solar Energy / Renewable Energy
Website: https://sundirectpower.com.au`;

      case 'generic':
        return `${position.title} - Sun Direct Power

We're seeking a talented ${position.title} to join our growing team!

📍 ${locations}
💰 ${salary}
⏰ ${position.employmentType.replace('_', ' ')}

ABOUT THE ROLE:
${position.description}

KEY RESPONSIBILITIES:
${topResponsibilities}

ESSENTIAL REQUIREMENTS:
${topRequirements}

WHAT WE OFFER:
✅ ${topBenefits}

HOW TO APPLY:
• Visit: https://sundirectpower.com.au/careers
• Email: careers@sundirectpower.com.au
• Phone: (08) 6156 6747

Sun Direct Power - Powering Western Australia's renewable energy future.`;

      default:
        return '';
    }
  };

  const adCopy = generateAdCopy();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(adCopy);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} ad copy copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Ad Copy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Job Ad Copy</DialogTitle>
          <DialogDescription>
            Create ready-to-post job advertisements for {position.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Platform</label>
            <Select value={platform} onValueChange={(value: any) => setPlatform(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="seek">Seek</SelectItem>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="generic">Generic (Email/Other)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generated Ad Copy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Generated Ad Copy</label>
              <Button
                onClick={handleCopy}
                size="sm"
                variant={copied ? 'default' : 'outline'}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={adCopy}
              readOnly
              rows={20}
              className="font-mono text-sm"
            />
          </div>

          {/* Platform Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Platform Tips:</h4>
            {platform === 'linkedin' && (
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use emojis to make your post stand out</li>
                <li>• Tag relevant connections and company page</li>
                <li>• Post during business hours (9am-5pm AWST)</li>
                <li>• Add relevant hashtags for better reach</li>
              </ul>
            )}
            {platform === 'seek' && (
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Paste into Seek's job description field</li>
                <li>• Add company logo and photos</li>
                <li>• Select appropriate job category</li>
                <li>• Set application expiry date</li>
              </ul>
            )}
            {platform === 'indeed' && (
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Keep formatting simple (Indeed strips some formatting)</li>
                <li>• Add company description</li>
                <li>• Enable "Easy Apply" for more applications</li>
                <li>• Set salary range for better visibility</li>
              </ul>
            )}
            {platform === 'generic' && (
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Works for email, Facebook, Instagram, etc.</li>
                <li>• Customize as needed for your platform</li>
                <li>• Add images or videos for social media</li>
                <li>• Include direct application link</li>
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
