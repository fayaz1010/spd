
import Link from "next/link";
import Image from "next/image";
import { 
  Zap, 
  Shield, 
  Award, 
  TrendingDown, 
  Sun, 
  Battery,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  Clock,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductCarousel } from "@/components/ProductCarousel";
import { PackageTierSection } from "@/components/PackageTierSection";
import { HomeCalculator } from "@/components/HomeCalculator";
import FAQSection from "@/components/home/FAQSection";
import { ProcessFlow } from "@/components/ProcessFlow";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { GalleryCarousel } from "@/components/GalleryCarousel";
import { PartnersCarousel } from "@/components/PartnersCarousel";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getPartners() {
  try {
    const partners = await prisma.partner.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        website: true,
      },
    });
    return partners;
  } catch (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
}

async function getGalleryImages() {
  try {
    const images = await prisma.galleryImage.findMany({
      where: {
        isActive: true,
        featured: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      take: 10, // Show up to 10 featured images
      select: {
        id: true,
        title: true,
        imageUrl: true,
        location: true,
        systemSize: true,
      },
    });
    return images;
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return [];
  }
}

async function getTestimonials() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        status: 'APPROVED',
        showOnWebsite: true,
      },
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 3,
      select: {
        id: true,
        customerName: true,
        location: true,
        review: true,
        rating: true,
        title: true,
      },
    });
    return testimonials;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

async function getFAQs() {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
      },
    });
    return faqs;
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
}

async function getCaseStudies() {
  try {
    // Fetch all published case studies
    const allCaseStudies = await prisma.caseStudy.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        customerName: true,
        location: true,
        systemSize: true,
        panelCount: true,
        batterySize: true,
        description: true,
        featuredImage: true,
        category: true,
      },
    });

    // Randomly shuffle and take 3
    const shuffled = allCaseStudies.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return [];
  }
}

async function getFeaturedShopProducts() {
  try {
    const shopProducts = await prisma.shopProduct.findMany({
      where: { 
        featured: true,
        isActive: true,
      },
      include: {
        product: true,
      },
      orderBy: [
        { product: { sortOrder: 'asc' } },
        { product: { name: 'asc' } },
      ],
      take: 6,
    });
    
    return shopProducts.map(shopProduct => {
      const product = shopProduct.product;
      const specs = product.specifications as any;
      
      // Determine icon based on product type
      let iconName = specs?.iconName || 'package';
      if (!specs?.iconName) {
        switch (product.productType) {
          case 'PANEL':
            iconName = 'sun';
            break;
          case 'BATTERY':
            iconName = 'battery';
            break;
          case 'INVERTER':
            iconName = 'zap';
            break;
          case 'EV_CHARGER':
            iconName = 'car';
            break;
          default:
            iconName = 'package';
        }
      }
      
      return {
        addonId: shopProduct.id,
        name: product.name,
        description: product.description || '',
        cost: shopProduct.salePrice || shopProduct.retailPrice,
        iconName: iconName,
        category: product.productType.toLowerCase(),
        benefits: Array.isArray(specs?.benefits) ? specs.benefits as string[] : [],
        features: Array.isArray(product.features) ? product.features as string[] : [],
        manufacturer: product.manufacturer,
        tier: product.tier,
        onSale: !!shopProduct.salePrice,
      };
    });
  } catch (error) {
    console.error('Error fetching featured shop products:', error);
    return [];
  }
}

export default async function HomePage() {
  const addons = await getFeaturedShopProducts();
  const testimonials = await getTestimonials();
  const faqs = await getFAQs();
  const galleryImages = await getGalleryImages();
  const caseStudies = await getCaseStudies();
  const partners = await getPartners();
  
  // Fallback testimonials if none in database
  const defaultTestimonials = [
    {
      customerName: "Sarah & Mike Thompson",
      location: "Joondalup, WA",
      review: "Our power bill went from $800/quarter to just $40! The team was professional and the installation took just one day. Couldn't be happier with our 10kW system.",
      rating: 5,
      title: null
    },
    {
      customerName: "David Chen",
      location: "Canning Vale, WA",
      review: "The battery storage was a game-changer. We now charge our EV overnight using stored solar energy. Haven't paid for petrol in 6 months!",
      rating: 5,
      title: null
    },
    {
      customerName: "Rebecca Foster",
      location: "Mandurah, WA",
      review: "Sun Direct Power made the whole process easy. They handled all the rebate paperwork and the system paid for itself in just 3 years. Best investment we've made!",
      rating: 5,
      title: null
    }
  ];
  
  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <Navigation activePage="home" />

      {/* Hero Carousel Section */}
      <HeroCarousel />

      {/* Rebates Section */}
      <section id="rebates" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Massive Rebates Available Now
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Take advantage of Federal and WA State rebates to slash your solar investment costs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="premium-card bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl shadow-lg border-2 border-primary-100">
              <div className="bg-primary rounded-full h-16 w-16 flex items-center justify-center mb-6">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">Federal SRES</h3>
              <p className="text-4xl font-bold text-coral mb-4">$400-600</p>
              <p className="text-gray-600 mb-2">Per kW installed</p>
              <p className="text-sm text-gray-500">Reduces upfront solar installation costs</p>
            </div>

            <div className="premium-card bg-gradient-to-br from-gold-50 to-white p-8 rounded-2xl shadow-lg border-2 border-gold-200 transform scale-105">
              <div className="absolute -top-3 -right-3 bg-coral text-white px-4 py-1 rounded-full text-sm font-bold">
                BIGGEST
              </div>
              <div className="bg-gradient-gold rounded-full h-16 w-16 flex items-center justify-center mb-6">
                <Battery className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">Combined Rebates</h3>
              <p className="text-4xl font-bold text-coral mb-4">$20,000+</p>
              <p className="text-gray-600 mb-2">Federal + State combined</p>
              <p className="text-sm text-gray-500">For battery + solar systems</p>
            </div>

            <div className="premium-card bg-gradient-to-br from-emerald-50 to-white p-8 rounded-2xl shadow-lg border-2 border-emerald-100">
              <div className="bg-gradient-emerald rounded-full h-16 w-16 flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">Federal Battery</h3>
              <p className="text-4xl font-bold text-coral mb-4">30% Off</p>
              <p className="text-gray-600 mb-2">Battery system cost</p>
              <p className="text-sm text-gray-500">Cheaper Home Batteries Program</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/calculator-v2">
              <Button size="lg" className="bg-coral hover:bg-coral-600 text-white text-lg px-10 py-6">
                Calculate My Savings Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Package Tiers - Poster Style */}
      <PackageTierSection posterStyle={true} />

      {/* Interactive Calculator */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <HomeCalculator />
      </section>

      {/* Trust Indicators */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center animate-fade-in">
              <div className="bg-white rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">25-Year Warranty</h3>
              <p className="text-gray-600 text-sm">Premium Tier 1 panels with industry-leading protection</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="bg-white rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Award className="h-10 w-10 text-gold" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">CEC Certified</h3>
              <p className="text-gray-600 text-sm">Clean Energy Council approved installers</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingDown className="h-10 w-10 text-emerald" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Lowest Prices</h3>
              <p className="text-gray-600 text-sm">Best value solar systems in Perth guaranteed</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="bg-white rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="h-10 w-10 text-coral" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">5,000+ Installs</h3>
              <p className="text-gray-600 text-sm">Trusted by Perth families for over a decade</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your custom solar quote in just 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Enter Details', desc: 'Tell us about your property and energy usage', icon: Users },
              { num: '02', title: 'AI Analysis', desc: 'Our system analyzes your roof using satellite imagery', icon: Sun },
              { num: '03', title: 'See Savings', desc: 'Get instant quote with rebates and 25-year savings', icon: TrendingDown },
              { num: '04', title: 'Get Installed', desc: 'Book installation within 2-4 weeks', icon: CheckCircle },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-coral to-gold" />
                )}
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="bg-gradient-coral rounded-2xl h-24 w-24 flex items-center justify-center mx-auto shadow-xl">
                      <step.icon className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-lg">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/calculator-v2">
              <Button size="lg" className="bg-primary hover:bg-primary-800 text-white text-lg px-10 py-6">
                Start Calculating Savings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Carousel */}
      <ProductCarousel 
        products={addons}
        title="Enhance Your Solar System"
        subtitle="Premium add-ons to maximize your solar investment"
      />

      {/* Gallery Section */}
      <GalleryCarousel images={galleryImages} />

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              What Perth Families Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of happy customers saving on their power bills
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {displayTestimonials.map((testimonial, idx) => (
              <div key={idx} className="premium-card bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-gold text-xl">★</span>
                  ))}
                </div>
                {testimonial.title && (
                  <h3 className="font-semibold text-primary mb-2">{testimonial.title}</h3>
                )}
                <p className="text-gray-700 mb-6 italic">"{testimonial.review}"</p>
                <div className="border-t pt-4">
                  <p className="font-bold text-primary">{testimonial.customerName}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      {caseStudies.length > 0 && (
        <section id="case-studies" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-primary mb-4">
                Success Stories
              </h2>
              <p className="text-xl text-gray-600">
                Real installations, real results from Perth families and businesses
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {caseStudies.map((study) => (
                <div key={study.id} className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
                  {study.featuredImage && (
                    <div className="relative h-48 bg-gray-200">
                      <Image
                        src={study.featuredImage}
                        alt={study.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {study.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">{study.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      {study.location}
                    </div>
                    <p className="text-gray-700 mb-4 line-clamp-3">{study.description}</p>
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-500 text-xs">System Size</p>
                        <p className="font-bold text-primary">{study.systemSize}kW</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-500 text-xs">Panels</p>
                        <p className="font-bold text-primary">{study.panelCount}</p>
                      </div>
                    </div>
                    {study.batterySize && (
                      <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-semibold mb-4">
                        <Battery className="w-4 h-4 inline mr-1" />
                        {study.batterySize}kWh Battery Storage
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs Section */}
      <FAQSection initialFAQs={faqs} />

      {/* Process Flow Section */}
      <ProcessFlow />

      {/* Extra Services Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">
              More Than Just Solar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional home services to keep your property in top condition
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Roof & Gutter</h3>
              <p className="text-sm text-gray-600">Cleaning, painting, repairs</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Security</h3>
              <p className="text-sm text-gray-600">CCTV, smart locks, alarms</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Electrical</h3>
              <p className="text-sm text-gray-600">Inspections, upgrades, LED</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="bg-cyan-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">HVAC</h3>
              <p className="text-sm text-gray-600">Air con service & install</p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/extra-services">
              <Button size="lg" className="bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700 text-white">
                View All Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Start Saving?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            See your personalized savings in 60 seconds. No payment required.
          </p>
          <Link href="/calculator-v2">
            <Button size="lg" className="bg-coral hover:bg-coral-600 text-white text-xl px-12 py-8 shadow-2xl hover:shadow-coral/50 transition-all">
              See Your Savings Now
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
          <p className="text-white/70 mt-6 text-sm">
            ✓ No obligations  ✓ Free consultation  ✓ 24hr response time
          </p>
        </div>
      </section>

      {/* Partners Carousel */}
      <PartnersCarousel partners={partners} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
