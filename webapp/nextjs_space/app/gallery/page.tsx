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
import { Sun, Image as ImageIcon, MapPin, Zap, Loader2, ArrowLeft, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const featuredImages = images.filter(img => img.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-2">
              <Sun className="h-10 w-10 text-gold" />
              <div>
                <h1 className="text-2xl font-bold text-primary">Sun Direct Power</h1>
                <p className="text-xs text-muted-foreground">Perth's Solar Experts</p>
              </div>
            </Link>
            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/#rebates" className="text-sm font-medium hover:text-coral transition-colors">
                Rebates
              </Link>
              <Link href="/extra-services" className="text-sm font-medium hover:text-coral transition-colors">
                Services
              </Link>
              <Link href="/blog" className="text-sm font-medium hover:text-coral transition-colors">
                Blog
              </Link>
              <Link href="/gallery" className="text-sm font-medium text-coral">
                Gallery
              </Link>
              <Link href="/shop" className="text-sm font-medium hover:text-coral transition-colors">
                Shop
              </Link>
              <Link href="/calculator-v2">
                <Button className="bg-coral hover:bg-coral-600">
                  Get Quote
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

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
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <>
              <DialogHeader>
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
              <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                  }}
                />
              </div>
              {selectedImage.description && (
                <p className="text-gray-700 mt-4">{selectedImage.description}</p>
              )}
              {selectedImage.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedImage.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sun className="h-8 w-8 text-gold" />
                <span className="text-xl font-bold">Sun Direct Power</span>
              </div>
              <p className="text-gray-400">Perth's trusted solar experts</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/" className="block text-gray-400 hover:text-white">Home</Link>
                <Link href="/calculator-v2" className="block text-gray-400 hover:text-white">Get Quote</Link>
                <Link href="/extra-services" className="block text-gray-400 hover:text-white">Services</Link>
                <Link href="/blog" className="block text-gray-400 hover:text-white">Blog</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <p>Perth, Western Australia</p>
                <p>Phone: (08) XXXX XXXX</p>
                <p>Email: info@sundirectpower.com.au</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Sun Direct Power. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
