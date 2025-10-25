'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { DollarSign, Zap, Leaf, TreePine, ArrowRight } from 'lucide-react';

interface CarouselSlide {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  icon: React.ElementType;
  image: string;
  stats: {
    value: string;
    label: string;
  }[];
  gradient: string;
}

const slides: CarouselSlide[] = [
  {
    title: 'Massive Rebates Available',
    subtitle: 'Over $20,000 in Government Incentives',
    description: 'Take advantage of Federal SRES and State battery rebates. Reduce your upfront solar investment costs by up to 70% with combined rebates.',
    ctaText: 'Calculate My Rebates',
    ctaLink: '/calculator-v2',
    icon: DollarSign,
    image: '/rebate carousel.png',
    stats: [
      { value: '$400-600', label: 'Per kW SRES' },
      { value: '30% Off', label: 'Battery Rebate' },
      { value: '$20,000+', label: 'Total Savings' },
    ],
    gradient: 'from-gold/20 to-coral/20',
  },
  {
    title: 'Near-Zero Power Bills',
    subtitle: 'Cut Your Electricity Costs by 95%',
    description: 'Join thousands of Perth families enjoying near-zero electricity bills. Our premium solar systems with battery storage ensure maximum savings year-round.',
    ctaText: 'See My Savings',
    ctaLink: '/calculator-v2',
    icon: Zap,
    image: '/0 bill carousel.png',
    stats: [
      { value: '95%', label: 'Bill Reduction' },
      { value: '$3,000+', label: 'Annual Savings' },
      { value: '3-5 Years', label: 'Payback Period' },
    ],
    gradient: 'from-primary/20 to-emerald/20',
  },
  {
    title: 'Reduce Your Carbon Footprint',
    subtitle: 'Make a Real Environmental Impact',
    description: 'Every solar system installed prevents tons of CO₂ emissions annually. Help combat climate change while saving money on your energy bills.',
    ctaText: 'Calculate My Impact',
    ctaLink: '/calculator-v2',
    icon: Leaf,
    image: '/images/carbon carousel.jpg',
    stats: [
      { value: '4-6 Tons', label: 'CO₂ Saved/Year' },
      { value: '100+ Tons', label: 'Over 25 Years' },
      { value: 'Clean', label: 'Renewable Energy' },
    ],
    gradient: 'from-emerald/20 to-primary/20',
  },
  {
    title: 'Plant Trees with Every Install',
    subtitle: 'Equivalent to Planting 100+ Trees',
    description: 'Your solar system has the same environmental benefit as planting over 100 trees. Create a sustainable future for Perth and generations to come.',
    ctaText: 'Start Your Journey',
    ctaLink: '/calculator-v2',
    icon: TreePine,
    image: '/green carousel.png',
    stats: [
      { value: '100+', label: 'Tree Equivalent' },
      { value: '25 Years', label: 'System Warranty' },
      { value: '5,000+', label: 'Happy Customers' },
    ],
    gradient: 'from-emerald/20 to-gold/20',
  },
];

export function HeroCarousel() {
  const [api, setApi] = React.useState<any>();
  
  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: 5000, stopOnInteraction: false }),
    []
  );

  React.useEffect(() => {
    if (!api) return;
    
    // Start autoplay when component mounts
    autoplayPlugin.play();
  }, [api, autoplayPlugin]);

  return (
    <section className="relative overflow-hidden bg-gradient-primary">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <Carousel
        setApi={setApi}
        plugins={[autoplayPlugin]}
        className="w-full"
        opts={{
          align: 'start',
          loop: true,
        }}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <div className="relative py-24 sm:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <div className="animate-slide-in-left z-10">
                      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <slide.icon className="h-5 w-5 text-gold" />
                        <span>{slide.subtitle}</span>
                      </div>

                      <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
                        {slide.title}
                      </h1>

                      <p className="text-xl text-white/90 mb-8 leading-relaxed">
                        {slide.description}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4 mb-12">
                        <Link href={slide.ctaLink}>
                          <Button
                            size="lg"
                            className="bg-coral hover:bg-coral-600 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all group"
                          >
                            {slide.ctaText}
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-6">
                        {slide.stats.map((stat, idx) => (
                          <div key={idx} className="text-center">
                            <p className="text-3xl font-bold text-gold mb-1">
                              {stat.value}
                            </p>
                            <p className="text-sm text-white/80">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="relative animate-slide-in-right hidden lg:block">
                      <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl">
                        <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} z-10`} />
                        <Image
                          src={slide.image}
                          alt={slide.title}
                          fill
                          className="object-cover"
                          priority={index === 0}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Buttons */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-20">
          <CarouselPrevious className="static translate-x-0 translate-y-0 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white" />
          <CarouselNext className="static translate-x-0 translate-y-0 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white" />
        </div>
      </Carousel>
    </section>
  );
}
