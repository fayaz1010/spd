'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  website: string | null;
}

interface PartnersCarouselProps {
  partners: Partner[];
}

export function PartnersCarousel({ partners }: PartnersCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || partners.length === 0) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame

    const scroll = () => {
      if (!scrollContainer) return;
      
      scrollPosition += scrollSpeed;
      
      // Reset scroll when we've scrolled through all items
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      requestAnimationFrame(scroll);
    };

    const animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, [partners]);

  if (partners.length === 0) return null;

  // Duplicate partners for infinite scroll effect
  const duplicatedPartners = [...partners, ...partners];

  return (
    <section className="py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Partners</h2>
          <p className="text-gray-600">Trusted by leading brands in the solar industry</p>
        </div>

        <div 
          ref={scrollRef}
          className="overflow-hidden"
          style={{ scrollBehavior: 'auto' }}
        >
          <div className="flex gap-12 items-center" style={{ width: 'max-content' }}>
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="flex-shrink-0 transition-all duration-300 hover:scale-110"
              >
                {partner.website ? (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Image
                      src={partner.logoUrl}
                      alt={partner.name}
                      width={180}
                      height={90}
                      className="h-20 w-44 object-contain"
                    />
                  </a>
                ) : (
                  <Image
                    src={partner.logoUrl}
                    alt={partner.name}
                    width={180}
                    height={90}
                    className="h-20 w-44 object-contain"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
