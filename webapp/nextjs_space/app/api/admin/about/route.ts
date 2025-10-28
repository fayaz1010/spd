import { NextRequest, NextResponse } from 'next/server';

// Mock data - In production, this would come from database
const mockData = {
  settings: {
    heroTitle: 'Powering a Sustainable Future',
    heroSubtitle: 'Western Australia\'s trusted partner in renewable energy, delivering innovative solar solutions for homes, businesses, and communities.',
    heroImage: '',
    companyOverview: 'Sun Direct Power is a leading residential and commercial solar installation company headquartered in Western Australia. With a legacy of excellence in the renewable energy sector, we specialize in providing comprehensive solar solutions for residential, commercial, and industrial clients.',
    missionStatement: 'At Sun Direct Power, our mission is to drive the global transition to clean, renewable energy by empowering individuals, businesses, and communities with reliable solar solutions.',
    internationalExpansion: 'Sun Direct Power is currently expanding its operations internationally, with a particular focus on the Maldives.',
  },
  services: [
    {
      id: '1',
      icon: 'Home',
      title: 'Residential Solar Installation',
      description: 'Tailored solar solutions for homeowners, providing affordable, reliable access to clean energy with seamless installation and ongoing support.',
      sortOrder: 1,
    },
    {
      id: '2',
      icon: 'Building2',
      title: 'Commercial Solar Projects',
      description: 'Turnkey solar PV and battery storage solutions for businesses, optimizing energy efficiency and reducing operating costs.',
      sortOrder: 2,
    },
    {
      id: '3',
      icon: 'Zap',
      title: 'Utility Scale Projects',
      description: 'Large-scale renewable energy projects in partnership with leading Australian engineering companies like Energy Projects Australia (EPA).',
      sortOrder: 3,
    },
    {
      id: '4',
      icon: 'Battery',
      title: 'Battery Storage Solutions',
      description: 'Cutting-edge battery systems to store excess energy, ensuring uninterrupted power supply and greater energy independence.',
      sortOrder: 4,
    },
    {
      id: '5',
      icon: 'TrendingUp',
      title: 'Energy Management Systems',
      description: 'Advanced technology and data analytics to optimize energy consumption, streamline operations, and minimize waste.',
      sortOrder: 5,
    },
    {
      id: '6',
      icon: 'Camera',
      title: 'Security & Surveillance Systems',
      description: 'Professional CCTV installation, smart locks, and comprehensive home security solutions to protect your property 24/7.',
      sortOrder: 6,
    },
    {
      id: '7',
      icon: 'Shield',
      title: 'Smart Home Automation',
      description: 'Integrated smart home systems including intelligent lighting, climate control, and automated security for modern living.',
      sortOrder: 7,
    },
    {
      id: '8',
      icon: 'Wind',
      title: 'HVAC Services',
      description: 'Expert installation and maintenance of air conditioning systems, including split systems and ducted solutions for year-round comfort.',
      sortOrder: 8,
    },
    {
      id: '9',
      icon: 'Wrench',
      title: 'Roof & Gutter Services',
      description: 'Professional roof maintenance, gutter cleaning, painting, and repairs to protect your home and maximize solar panel efficiency.',
      sortOrder: 9,
    },
  ],
  projects: [
    {
      id: '1',
      name: 'Armadale Emergency Care Facility',
      location: 'Armadale, Western Australia',
      size: '500kW',
      type: 'Commercial PV System',
      scope: 'Engineering, design, regulatory approval, installation, and commissioning',
      sortOrder: 1,
    },
    {
      id: '2',
      name: 'Al\'Ameen College',
      location: 'Langford, Australia',
      size: '149.33kW',
      type: 'Educational PV System',
      scope: 'Engineering, design, regulatory approval, installation, and commissioning',
      sortOrder: 2,
    },
    {
      id: '3',
      name: 'Cockburn Islamic Centre',
      location: 'Cockburn Central, Australia',
      size: '149.3kW',
      type: 'Community PV System',
      scope: 'Engineering, design, regulatory approvals, installation, and commissioning',
      sortOrder: 3,
    },
    {
      id: '4',
      name: 'TP Residence',
      location: 'Southern River, Australia',
      size: '40.3kW PV + 30kW ESS',
      type: 'Residential PV & Battery',
      scope: 'Engineering design, regulatory approvals, installation, and commissioning',
      sortOrder: 4,
    },
    {
      id: '5',
      name: 'Al\'Ameen Mosque',
      location: 'Malaga, Australia',
      size: '40.3kW',
      type: 'Community PV System',
      scope: 'Engineering, design, regulatory approvals, installation, and commissioning',
      sortOrder: 5,
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      ...mockData,
    });
  } catch (error: any) {
    console.error('Error fetching about data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
