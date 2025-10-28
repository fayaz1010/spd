import Image from 'next/image';
import Link from 'next/link';
import { Button as UIButton } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { 
  Zap, 
  Target, 
  Award, 
  Globe, 
  Battery, 
  Building2, 
  Home, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  MapPin,
  Users,
  Leaf,
  Sun,
  Camera,
  Shield,
  Wind,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'About Us - Sun Direct Power | Leading Solar Solutions in Western Australia',
  description: 'Learn about Sun Direct Power, Western Australia\'s trusted solar installation company. Our mission, services, and commitment to sustainable energy solutions.',
};

export default function AboutPage() {
  const services = [
    {
      icon: Home,
      title: 'Residential Solar Installation',
      description: 'Tailored solar solutions for homeowners, providing affordable, reliable access to clean energy with seamless installation and ongoing support.',
    },
    {
      icon: Building2,
      title: 'Commercial Solar Projects',
      description: 'Turnkey solar PV and battery storage solutions for businesses, optimizing energy efficiency and reducing operating costs.',
    },
    {
      icon: Zap,
      title: 'Utility Scale Projects',
      description: 'Large-scale renewable energy projects in partnership with leading Australian engineering companies like Energy Projects Australia (EPA).',
    },
    {
      icon: Battery,
      title: 'Battery Storage Solutions',
      description: 'Cutting-edge battery systems to store excess energy, ensuring uninterrupted power supply and greater energy independence.',
    },
    {
      icon: TrendingUp,
      title: 'Energy Management Systems',
      description: 'Advanced technology and data analytics to optimize energy consumption, streamline operations, and minimize waste.',
    },
    {
      icon: Camera,
      title: 'Security & Surveillance Systems',
      description: 'Professional CCTV installation, smart locks, and comprehensive home security solutions to protect your property 24/7.',
    },
    {
      icon: Shield,
      title: 'Smart Home Automation',
      description: 'Integrated smart home systems including intelligent lighting, climate control, and automated security for modern living.',
    },
    {
      icon: Wind,
      title: 'HVAC Services',
      description: 'Expert installation and maintenance of air conditioning systems, including split systems and ducted solutions for year-round comfort.',
    },
    {
      icon: Wrench,
      title: 'Roof & Gutter Services',
      description: 'Professional roof maintenance, gutter cleaning, painting, and repairs to protect your home and maximize solar panel efficiency.',
    },
  ];

  const projects = [
    {
      name: 'Armadale Emergency Care Facility',
      location: 'Armadale, Western Australia',
      size: '500kW',
      type: 'Commercial PV System',
      scope: 'Engineering, design, regulatory approval, installation, and commissioning',
    },
    {
      name: 'Al\'Ameen College',
      location: 'Langford, Australia',
      size: '149.33kW',
      type: 'Educational PV System',
      scope: 'Engineering, design, regulatory approval, installation, and commissioning',
    },
    {
      name: 'Cockburn Islamic Centre',
      location: 'Cockburn Central, Australia',
      size: '149.3kW',
      type: 'Community PV System',
      scope: 'Engineering, design, regulatory approvals, installation, and commissioning',
    },
    {
      name: 'TP Residence',
      location: 'Southern River, Australia',
      size: '40.3kW PV + 30kW ESS',
      type: 'Residential PV & Battery',
      scope: 'Engineering design, regulatory approvals, installation, and commissioning',
    },
    {
      name: 'Al\'Ameen Mosque',
      location: 'Malaga, Australia',
      size: '40.3kW',
      type: 'Community PV System',
      scope: 'Engineering, design, regulatory approvals, installation, and commissioning',
    },
  ];

  const values = [
    {
      icon: Leaf,
      title: 'Environmental Stewardship',
      description: 'Committed to reducing carbon footprints and promoting sustainable energy practices.',
    },
    {
      icon: Award,
      title: 'Excellence & Quality',
      description: 'Delivering high-quality installations with industry-leading standards and warranties.',
    },
    {
      icon: Users,
      title: 'Customer-Centric',
      description: 'Prioritizing customer satisfaction with personalized solutions and ongoing support.',
    },
    {
      icon: Globe,
      title: 'Innovation',
      description: 'Leveraging cutting-edge technology to provide the most efficient solar solutions.',
    },
  ];

  const certificates = [
    {
      name: 'Clean Energy Council Accreditation',
      description: 'Certified solar installers and designers',
      image: '/certificates/cec.png',
    },
    {
      name: 'Electrical License',
      description: 'Licensed electrical contractors in WA',
      image: '/certificates/electrical.png',
    },
    {
      name: 'ISO 9001 Certified',
      description: 'Quality management systems',
      image: '/certificates/iso.png',
    },
  ];

  const team = [
    {
      name: 'John Smith',
      role: 'Managing Director',
      image: '/team/john.jpg',
      bio: 'Over 15 years of experience in renewable energy',
    },
    {
      name: 'Sarah Johnson',
      role: 'Operations Manager',
      image: '/team/sarah.jpg',
      bio: 'Expert in project management and customer relations',
    },
    {
      name: 'Michael Chen',
      role: 'Lead Electrician',
      image: '/team/michael.jpg',
      bio: 'CEC accredited with 500+ installations',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation activePage="about" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
              <p className="text-sm font-semibold text-blue-200">Leading Solar Solutions Since 2010</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Powering a Sustainable Future
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Western Australia's trusted partner in renewable energy, delivering innovative solar solutions for homes, businesses, and communities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/calculator-v2">
                <Button size="lg" className="bg-coral hover:bg-coral/90 text-white">
                  Get Your Free Quote
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white/20 hover:text-white">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-blue-100 rounded-full p-3 mb-4">
                <Sun className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Who We Are
              </h2>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                Sun Direct Power is a leading residential and commercial solar installation company headquartered in Western Australia. With a legacy of excellence in the renewable energy sector, we specialize in providing comprehensive solar solutions for residential, commercial, and industrial clients.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Our commitment to sustainability, innovation, and customer satisfaction has established us as a trusted name in the industry, with a track record of delivering high-quality, reliable solar installations that empower our clients to take control of their energy future.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-3xl font-bold text-coral mb-1">500+</p>
                  <p className="text-sm text-gray-600">Installations</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-3xl font-bold text-coral mb-1">10MW+</p>
                  <p className="text-sm text-gray-600">Total Capacity</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                  <Sun className="w-48 h-48 text-coral" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full p-4 mb-6">
            <Target className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl leading-relaxed text-blue-50">
            At Sun Direct Power, our mission is to drive the global transition to clean, renewable energy by empowering individuals, businesses, and communities with reliable solar solutions. With a focus on environmental stewardship and energy independence, we strive to make solar energy accessible, affordable, and sustainable for everyone. Through innovation, integrity, and collaboration, we aim to create a brighter, more sustainable future for generations to come.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="border-2 hover:border-coral transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="inline-block bg-blue-100 rounded-full p-4 mb-4">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services & Capabilities</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive solar solutions tailored to your needs
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-br from-coral to-orange-600 rounded-lg p-3 w-fit mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{service.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* International Expansion */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-purple-100 rounded-full p-3 mb-4">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                International Expansion
              </h2>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                Sun Direct Power is currently expanding its operations internationally, with a particular focus on the Maldives. We have established an office in the Maldives to facilitate our presence in the region and cater to the growing demand for renewable energy solutions.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We are proud to collaborate with multiple commercial clients in the Maldives to install utility-scale solar PV and battery storage projects, contributing to the region's sustainable development goals and fostering a greener future.
              </p>
              <div className="flex items-center gap-3 text-purple-600">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">Offices in Western Australia & Maldives</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Global Presence</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-coral flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Western Australia</p>
                      <p className="text-sm text-gray-600">Head Office - Balcatta, WA</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-coral flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Maldives</p>
                      <p className="text-sm text-gray-600">Regional Office - Male', Maldives</p>
                    </div>
                  </div>
                </div>
                <Link href="/contact">
                  <Button className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700">
                    View Full Contact Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Past & Current Projects</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Delivering excellence across residential, commercial, and utility-scale installations
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-coral text-white text-xs font-bold px-3 py-1 rounded-full">
                      {project.size}
                    </span>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                  <div className="flex items-center gap-2 text-blue-200 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{project.location}</span>
                  </div>
                  <p className="text-sm text-blue-100 mb-3">{project.type}</p>
                  <p className="text-xs text-blue-200 leading-relaxed">{project.scope}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certificates Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Certifications & Accreditations</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fully licensed and accredited to deliver the highest quality solar installations
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {certificates.map((cert, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Award className="w-16 h-16 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{cert.name}</h3>
                  <p className="text-gray-600">{cert.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experienced professionals dedicated to delivering exceptional solar solutions
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-coral font-semibold mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-coral to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Go Solar?
          </h2>
          <p className="text-xl mb-8 text-orange-50">
            Join hundreds of satisfied customers who have made the switch to clean, renewable energy with Sun Direct Power.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/calculator-v2">
              <Button size="lg" className="bg-white text-coral hover:bg-gray-100">
                Get Your Free Quote
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white/20 hover:text-white">
                Contact Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
