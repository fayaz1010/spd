import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  DollarSign, 
  Phone, 
  Mail,
  ArrowRight,
  Star,
  Shield,
  Award,
  Home
} from 'lucide-react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SEO metadata generator
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const service = await getService(params.id);
  
  if (!service) {
    return {
      title: 'Service Not Found | Sun Direct Power',
    };
  }

  const seoData = getServiceSEO(service.specifications.serviceType, service.name);
  
  return {
    title: `${service.name} Perth | ${seoData.title}`,
    description: seoData.description,
    keywords: seoData.keywords,
    openGraph: {
      title: `${service.name} - Sun Direct Power Perth`,
      description: seoData.description,
      images: service.imageUrl ? [service.imageUrl] : [],
      type: 'website',
      locale: 'en_AU',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.name} - Sun Direct Power Perth`,
      description: seoData.description,
      images: service.imageUrl ? [service.imageUrl] : [],
    },
  };
}

// SEO content for different service types
function getServiceSEO(serviceType: string, serviceName: string) {
  const seoContent: Record<string, any> = {
    roof_gutter: {
      title: 'Professional Roof & Gutter Services',
      description: 'Expert roof and gutter cleaning, repairs, and maintenance services in Perth. Protect your home from water damage with our professional gutter cleaning and roof maintenance. Fully licensed and insured. Same-day service available.',
      keywords: 'gutter cleaning Perth, roof repairs Perth, gutter maintenance, downpipe cleaning, roof restoration Perth, gutter guard installation, emergency roof repairs',
      detailedDescription: `Professional roof and gutter services are essential for maintaining your Perth home's integrity and preventing costly water damage. Our experienced team provides comprehensive gutter cleaning, roof repairs, and preventative maintenance to keep your property protected year-round. We service all areas across Perth Metro, from Joondalup to Mandurah.`,
      whyImportant: [
        'Prevents water damage to foundations and walls',
        'Protects against roof leaks and structural damage',
        'Reduces risk of pest infestations in gutters',
        'Maintains property value and curb appeal',
        'Prevents overflow damage during Perth\'s winter storms',
      ],
      commonIssues: [
        'Blocked gutters causing overflow',
        'Damaged or rusted gutter sections',
        'Loose or missing roof tiles',
        'Sagging gutters from debris weight',
        'Downpipe blockages',
      ],
    },
    security: {
      title: 'Home Security Systems & CCTV Installation',
      description: 'Professional security system installation in Perth. CCTV cameras, alarm systems, and smart home security solutions. Protect your family and property with 24/7 monitoring. Free security assessment available.',
      keywords: 'CCTV installation Perth, security cameras Perth, alarm system installation, home security Perth, business security systems, smart security, video surveillance',
      detailedDescription: `Secure your Perth home or business with our professional security system installation services. We specialize in CCTV cameras, alarm systems, access control, and integrated smart security solutions. Our systems provide 24/7 protection with remote monitoring capabilities, giving you peace of mind whether you're home or away.`,
      whyImportant: [
        'Deters burglars and intruders effectively',
        'Provides evidence in case of incidents',
        'Enables remote monitoring from anywhere',
        'Reduces home insurance premiums',
        'Protects family and valuable assets',
      ],
      commonIssues: [
        'Inadequate coverage of entry points',
        'Poor quality night vision cameras',
        'Lack of remote access capabilities',
        'Outdated analog systems',
        'No backup power during outages',
      ],
    },
    electrical: {
      title: 'Licensed Electrician Services Perth',
      description: 'Certified electrical services in Perth. From switchboard upgrades to LED lighting installation, power points, and emergency repairs. Licensed, insured electricians available 24/7. Competitive rates and quality workmanship guaranteed.',
      keywords: 'electrician Perth, electrical services, switchboard upgrade, LED lighting installation, power points, emergency electrician, electrical repairs Perth',
      detailedDescription: `Our licensed electricians provide comprehensive electrical services across Perth Metro. From routine maintenance and upgrades to emergency repairs, we handle all residential and commercial electrical work. All work complies with Australian Standards and comes with full warranty protection.`,
      whyImportant: [
        'Ensures electrical safety and compliance',
        'Prevents electrical fires and hazards',
        'Improves energy efficiency',
        'Increases property value',
        'Provides reliable power supply',
      ],
      commonIssues: [
        'Overloaded circuits and switchboards',
        'Outdated wiring systems',
        'Insufficient power points',
        'Flickering lights and power surges',
        'Non-compliant electrical installations',
      ],
    },
    hvac: {
      title: 'Air Conditioning & HVAC Services Perth',
      description: 'Professional air conditioning installation, repairs, and maintenance in Perth. Split systems, ducted AC, and evaporative cooling. Beat the Perth heat with energy-efficient cooling solutions. Same-day service available.',
      keywords: 'air conditioning Perth, AC installation, ducted air conditioning, split system installation, AC repairs Perth, HVAC services, evaporative cooling',
      detailedDescription: `Stay comfortable year-round with our professional air conditioning and HVAC services in Perth. We install, repair, and maintain all types of cooling and heating systems including split systems, ducted air conditioning, and evaporative coolers. Our energy-efficient solutions help you beat Perth's extreme temperatures while keeping running costs low.`,
      whyImportant: [
        'Maintains comfortable indoor temperatures',
        'Improves air quality and health',
        'Increases energy efficiency',
        'Reduces electricity costs',
        'Essential for Perth\'s hot summers',
      ],
      commonIssues: [
        'Poor cooling performance',
        'High electricity bills',
        'Noisy operation',
        'Refrigerant leaks',
        'Inadequate system sizing',
      ],
    },
    general: {
      title: 'Professional Home Services Perth',
      description: 'Quality home maintenance and repair services in Perth. Professional tradespeople for all your home improvement needs. Reliable, licensed, and fully insured. Servicing all Perth Metro areas.',
      keywords: 'home services Perth, home maintenance, handyman Perth, home repairs, property maintenance, Perth tradespeople',
      detailedDescription: `Professional home services delivered by experienced tradespeople across Perth Metro. We provide reliable, high-quality maintenance and repair services to keep your property in top condition. All work is completed to Australian Standards with full insurance coverage.`,
      whyImportant: [
        'Maintains property value',
        'Prevents small issues becoming major problems',
        'Ensures safety and compliance',
        'Saves money on costly repairs',
        'Professional quality workmanship',
      ],
      commonIssues: [
        'Deferred maintenance causing damage',
        'DIY repairs done incorrectly',
        'Lack of regular servicing',
        'Non-compliant installations',
        'Safety hazards from neglect',
      ],
    },
  };

  return seoContent[serviceType] || seoContent.general;
}

async function getService(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id,
        productType: 'ADDON',
      },
      include: {
        SupplierProduct: {
          where: { isActive: true },
          take: 1,
        },
        installationReqs: {
          include: {
            laborType: true,
          },
          take: 1,
        },
      },
    });

    if (!product) return null;

    const specs = product.specifications as any;
    
    // Only return if it's a service (has serviceType)
    if (!specs?.serviceType) return null;

    // Get pricing from specifications (for services) or SupplierProduct (for products)
    const supplier = product.SupplierProduct[0];
    const installation = product.installationReqs[0];
    
    const retailPrice = specs?.retailPrice || supplier?.retailPrice || 0;
    const installationCost = specs?.installationCost || (installation 
      ? (installation.quantityMultiplier || 0) * (installation.laborType?.baseRate || 0)
      : 0);
    const totalCost = specs?.totalCost || (retailPrice + installationCost);

    return {
      id: product.id,
      name: product.name,
      manufacturer: product.manufacturer,
      description: product.description || '',
      imageUrl: product.imageUrl,
      specifications: {
        serviceType: specs?.serviceType || 'general',
        benefits: specs?.benefits || [],
        iconName: specs?.iconName || 'Wrench',
        duration: specs?.duration || 'Varies',
        serviceArea: specs?.serviceArea || 'Perth Metro',
      },
      isRecommended: product.isRecommended || false,
      retailPrice: retailPrice,
      installationCost: installationCost,
      totalCost: totalCost,
    };
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  roof_gutter: 'Roof & Gutter',
  security: 'Security',
  electrical: 'Electrical',
  hvac: 'HVAC',
  general: 'General',
};

export default async function ServicePage({ params }: { params: { id: string } }) {
  const service = await getService(params.id);

  if (!service) {
    notFound();
  }

  const seoData = getServiceSEO(service.specifications.serviceType, service.name);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">☀</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Sun Direct Power</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/extra-services">
                <Button variant="ghost">All Services</Button>
              </Link>
              <Link href="/calculator-v2">
                <Button className="bg-coral hover:bg-coral-600">
                  Get Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-primary to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              {service.isRecommended && (
                <Badge className="bg-yellow-400 text-yellow-900 mb-4">
                  <Star className="w-4 h-4 mr-1" />
                  Recommended Service
                </Badge>
              )}
              <h1 className="text-5xl font-bold mb-6">{service.name}</h1>
              <p className="text-xl text-blue-100 mb-8">{service.description}</p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <Clock className="w-5 h-5" />
                  <span>{service.specifications.duration}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <MapPin className="w-5 h-5" />
                  <span>{service.specifications.serviceArea}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <Badge variant="outline" className="border-white text-white">
                    {SERVICE_TYPE_LABELS[service.specifications.serviceType]}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-4">
                <Link href={`/extra-services?book=${service.id}`}>
                  <Button size="lg" className="bg-coral hover:bg-coral-600 text-white">
                    Book Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="tel:1300000000">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                    <Phone className="mr-2 w-5 h-5" />
                    Call Us
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image */}
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              {service.imageUrl ? (
                <Image
                  src={service.imageUrl}
                  alt={service.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Home className="w-32 h-32 text-white/30" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-coral to-orange-500 rounded-2xl p-8 text-white">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-sm text-white/80 mb-2">Service Price</div>
                <div className="text-4xl font-bold">${service.retailPrice.toFixed(2)}</div>
              </div>
              {service.installationCost > 0 && (
                <div>
                  <div className="text-sm text-white/80 mb-2">Installation</div>
                  <div className="text-4xl font-bold">${service.installationCost.toFixed(2)}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-white/80 mb-2">Total Cost</div>
                <div className="text-4xl font-bold">${service.totalCost.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {service.specifications.benefits.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Service Benefits</h2>
              <p className="text-xl text-gray-600">Why choose this service</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.specifications.benefits.map((benefit: string, index: number) => (
                <Card key={index} className="border-2 hover:border-primary transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{benefit}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEO Content - About the Service */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            About {service.name} in Perth
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              {seoData.detailedDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Why This Service is Important */}
      {seoData.whyImportant && seoData.whyImportant.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why {service.name} Matters
              </h2>
              <p className="text-xl text-gray-600">
                Protect your Perth property with professional service
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seoData.whyImportant.map((reason: string, index: number) => (
                <Card key={index} className="border-2 hover:border-primary transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{reason}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Common Issues We Solve */}
      {seoData.commonIssues && seoData.commonIssues.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Common Problems We Fix
              </h2>
              <p className="text-xl text-gray-600">
                Expert solutions for Perth homeowners
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {seoData.commonIssues.map((issue: string, index: number) => (
                <div key={index} className="flex gap-4 items-start bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold">!</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">{issue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Sun Direct Power</h2>
            <p className="text-xl text-gray-600">Perth's trusted solar and service experts</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Fully Insured</h3>
                <p className="text-gray-600">Comprehensive insurance coverage for your peace of mind</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Certified Professionals</h3>
                <p className="text-gray-600">CEC accredited and fully licensed technicians</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">5-Star Service</h3>
                <p className="text-gray-600">Rated excellent by hundreds of Perth customers</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Book your {service.name} today and experience professional service
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/calculator-v2">
              <Button size="lg" className="bg-coral hover:bg-coral-600 text-white text-lg px-8">
                Book Service Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="tel:1300000000">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-lg px-8">
                <Phone className="mr-2 w-5 h-5" />
                1300 000 000
              </Button>
            </Link>
          </div>
          <p className="text-blue-100 mt-6 text-sm">
            Or email us at <a href="mailto:info@sundirectpower.com.au" className="underline">info@sundirectpower.com.au</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Sun Direct Power</h3>
              <p className="text-gray-400">Perth's trusted solar and service experts</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/extra-services" className="hover:text-white">All Services</Link></li>
                <li><Link href="/calculator-v2" className="hover:text-white">Solar Quotes</Link></li>
                <li><Link href="/shop" className="hover:text-white">Shop</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/gallery" className="hover:text-white">Gallery</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>1300 000 000</li>
                <li>info@sundirectpower.com.au</li>
                <li>Perth, Western Australia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Sun Direct Power. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
