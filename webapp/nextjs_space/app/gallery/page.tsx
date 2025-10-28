'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sun, Image as ImageIcon, MapPin, Zap, Loader2, ArrowLeft, ArrowRight, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string;
  tags: string[];
  location: string | null;
  systemSize: string | null;
  featured: boolean;
}

const categories = [
  { value: 'all', label: 'All Projects' },
  { value: 'installation', label: 'Installation' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'battery', label: 'Battery Systems' },
  { value: 'rooftop', label: 'Rooftop Solar' },
  { value: 'ground', label: 'Ground Mount' },
  { value: 'team', label: 'Team at Work' },
  { value: 'before-after', label: 'Before & After' },
];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredImages(images);
    } else {
      setFilteredImages(images.filter(img => img.category === selectedCategory));
    }
  }, [selectedCategory, images]);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/gallery');
      const data = await response.json();
      setImages(data.images || []);
      setFilteredImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
    setDialogOpen(true);
  };

  const handlePrevImage = () => {
    if (!selectedImage) return;
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
    if (currentIndex > 0) {
      setSelectedImage(filteredImages[currentIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (!selectedImage) return;
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
    if (currentIndex < filteredImages.length - 1) {
      setSelectedImage(filteredImages[currentIndex + 1]);
    }
  };

  const featuredImages = images.filter(img => img.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm font-semibold">Our Work</span>
            </div>
            <h1 className="text-5xl font-bold mb-4">Project Gallery</h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Explore our completed solar installations across Perth. From residential rooftops to commercial systems, see the quality of our work.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Projects */}
      {featuredImages.length > 0 && (
        <div className="bg-white py-12 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredImages.slice(0, 3).map((image) => (
                <Card
                  key={image.id}
                  className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => handleImageClick(image)}
                >
                  <div className="relative h-64 bg-gray-200">
                    <Image
                      src={image.imageUrl}
                      alt={image.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gold text-white">Featured</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{image.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {image.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{image.location}</span>
                        </div>
                      )}
                      {image.systemSize && (
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          <span>{image.systemSize}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Projects</h2>
            <p className="text-gray-600">{filteredImages.length} projects</p>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
          </div>
        ) : filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <Card
                key={image.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={() => handleImageClick(image)}
              >
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={image.imageUrl}
                    alt={image.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-1">{image.title}</h3>
                  <div className="flex flex-col gap-1 text-xs text-gray-600">
                    {image.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{image.location}</span>
                      </div>
                    )}
                    {image.systemSize && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>{image.systemSize}</span>
                      </div>
                    )}
                  </div>
                  {image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {image.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-gray-600">Try selecting a different category</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-emerald text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Solar Journey?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of Perth families enjoying clean energy and massive savings
          </p>
          <Link href="/calculator-v2">
            <Button size="lg" className="bg-coral hover:bg-coral-600 text-white text-lg px-8 py-6">
              Get Your Free Quote
            </Button>
          </Link>
        </div>
      </div>

      {/* Image Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl p-0">
          {selectedImage && (
            <>
              <DialogHeader className="px-6 pt-6">
                <DialogTitle className="text-2xl">{selectedImage.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-4 mt-2">
                    {selectedImage.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedImage.location}</span>
                      </div>
                    )}
                    {selectedImage.systemSize && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span>{selectedImage.systemSize}</span>
                      </div>
                    )}
                    <Badge variant="outline">{selectedImage.category}</Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              {/* Image with Frame and Navigation */}
              <div className="relative px-6 pb-6">
                {/* Gradient Frame */}
                <div className="relative bg-gradient-to-br from-coral via-purple-600 to-blue-600 rounded-2xl p-1 shadow-2xl">
                  <div className="relative bg-white rounded-xl overflow-hidden">
                    <div className="relative w-full h-[60vh]">
                      <Image
                        src={selectedImage.imageUrl}
                        alt={selectedImage.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                      {/* Company Logo Watermark */}
                      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                        <Image
                          src="/logos/sdp-logo-medium.png"
                          alt="Sun Direct Power"
                          width={100}
                          height={25}
                          className="h-6 w-auto"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={handlePrevImage}
                  disabled={filteredImages.findIndex(img => img.id === selectedImage.id) === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-xl rounded-full p-3 z-10 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button
                  onClick={handleNextImage}
                  disabled={filteredImages.findIndex(img => img.id === selectedImage.id) === filteredImages.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-xl rounded-full p-3 z-10 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              </div>

              {/* Description and Tags */}
              <div className="px-6 pb-6">
                {selectedImage.description && (
                  <p className="text-gray-700 mb-4">{selectedImage.description}</p>
                )}
                {selectedImage.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedImage.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <Footer />
    </div>
  );
}
