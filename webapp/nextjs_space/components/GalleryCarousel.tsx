'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  location: string | null;
  systemSize: string | null;
}

interface GalleryCarouselProps {
  images: GalleryImage[];
}

export function GalleryCarousel({ images }: GalleryCarouselProps) {
  const scrollLeft = () => {
    const container = document.getElementById('gallery-scroll');
    if (container) {
      // Get the first card to calculate its width
      const card = container.querySelector('.gallery-card') as HTMLElement;
      if (card) {
        const cardWidth = card.offsetWidth;
        const gap = 24; // 6 * 4px (gap-6)
        const scrollAmount = cardWidth + gap;
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('gallery-scroll');
    if (container) {
      // Get the first card to calculate its width
      const card = container.querySelector('.gallery-card') as HTMLElement;
      if (card) {
        const cardWidth = card.offsetWidth;
        const gap = 24; // 6 * 4px (gap-6)
        const scrollAmount = cardWidth + gap;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const gradients = [
    'from-coral via-purple-600 to-blue-600',
    'from-blue-600 via-purple-600 to-coral',
    'from-purple-600 via-coral to-blue-600',
  ];

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Award className="h-5 w-5" />
            <span>Our Work</span>
          </div>
          <h2 className="text-4xl font-bold text-primary mb-4">
            See Our Installations
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse our portfolio of completed solar projects across Perth
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
          <div 
            className="overflow-x-scroll scrollbar-hide snap-x snap-mandatory scroll-smooth" 
            id="gallery-scroll"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex gap-6 px-4 sm:px-6 lg:px-8 pb-4 min-w-max">
              {images.length > 0 ? (
                images.map((image, idx) => (
                  <div key={image.id} className="gallery-card flex-none w-[85vw] sm:w-[45vw] lg:w-[30vw] snap-center">
                    <div className="relative h-80 group cursor-pointer">
                      {/* Decorative Frame */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[idx % 3]} rounded-2xl p-1 shadow-2xl`}>
                        <div className="relative h-full w-full bg-white rounded-xl overflow-hidden">
                          <Image
                            src={image.imageUrl}
                            alt={image.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {/* Bottom gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                            <div className="text-white">
                              <h3 className="font-bold text-lg mb-1">{image.systemSize || image.title}</h3>
                              <p className="text-sm text-white/90">{image.location || 'Perth, WA'}</p>
                            </div>
                          </div>
                          {/* Company Logo Watermark */}
                          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                            <Image
                              src="/logos/sdp-logo-medium.png"
                              alt="Sun Direct Power"
                              width={80}
                              height={20}
                              className="h-5 w-auto"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Fallback if no gallery images
                <>
                  <div className="flex-none w-[calc(100%-2rem)] sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1rem)] snap-center">
                    <div className="relative h-80 group cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-br from-coral via-purple-600 to-blue-600 rounded-2xl p-1 shadow-2xl">
                        <div className="relative h-full w-full bg-white rounded-xl overflow-hidden">
                          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                            <p className="text-gray-500">No gallery images yet</p>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                            <Image
                              src="/logos/sdp-logo-medium.png"
                              alt="Sun Direct Power"
                              width={80}
                              height={20}
                              className="h-5 w-auto"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-none w-[calc(100%-2rem)] sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1rem)] snap-center">
                    <div className="relative h-80 group cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-coral rounded-2xl p-1 shadow-2xl">
                        <div className="relative h-full w-full bg-white rounded-xl overflow-hidden">
                          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                            <p className="text-gray-500">No gallery images yet</p>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                            <Image
                              src="/logos/sdp-logo-medium.png"
                              alt="Sun Direct Power"
                              width={80}
                              height={20}
                              className="h-5 w-auto"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-none w-[calc(100%-2rem)] sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1rem)] snap-center">
                    <div className="relative h-80 group cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-coral to-blue-600 rounded-2xl p-1 shadow-2xl">
                        <div className="relative h-full w-full bg-white rounded-xl overflow-hidden">
                          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                            <p className="text-gray-500">No gallery images yet</p>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                            <Image
                              src="/logos/sdp-logo-medium.png"
                              alt="Sun Direct Power"
                              width={80}
                              height={20}
                              className="h-5 w-auto"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scroll Buttons */}
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-xl rounded-full p-3 z-10 transition-all hover:scale-110"
            aria-label="Previous"
          >
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-xl rounded-full p-3 z-10 transition-all hover:scale-110"
            aria-label="Next"
          >
            <ArrowRight className="w-6 h-6 text-gray-800" />
          </button>
        </div>

        <div className="text-center mt-12">
          <Link href="/gallery">
            <Button size="lg" variant="outline" className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white text-lg px-8 py-6">
              View Full Gallery
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
