'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Eye,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  ExternalLink,
  Music,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface SocialLinks {
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  pinterest: string;
}

export default function ManageSocialLinksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [links, setLinks] = useState<SocialLinks>({
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    pinterest: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/social');
      const data = await response.json();
      
      if (data.success && data.links) {
        // Ensure all fields exist, even if not in database
        setLinks({
          facebook: data.links.facebook || '',
          instagram: data.links.instagram || '',
          linkedin: data.links.linkedin || '',
          youtube: data.links.youtube || '',
          tiktok: data.links.tiktok || '',
          pinterest: data.links.pinterest || '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load social links');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(links),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Social media links saved successfully!');
      } else {
        toast.error('Failed to save social links');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/dashboard/website')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website Management
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social Media Links</h1>
              <p className="text-gray-600 mt-1">Manage your social media profiles displayed in the footer</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('/', '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Footer
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-coral hover:bg-coral/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Social Links Cards */}
        <div className="space-y-4">
          {/* Facebook */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-full p-2">
                  <Facebook className="w-5 h-5 text-blue-600" />
                </div>
                Facebook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={links.facebook}
                  onChange={(e) => setLinks({ ...links, facebook: e.target.value })}
                  placeholder="https://facebook.com/sundirectpower"
                  className="flex-1"
                />
                {links.facebook && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(links.facebook, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instagram */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-pink-100 rounded-full p-2">
                  <Instagram className="w-5 h-5 text-pink-600" />
                </div>
                Instagram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={links.instagram}
                  onChange={(e) => setLinks({ ...links, instagram: e.target.value })}
                  placeholder="https://instagram.com/sundirectpower"
                  className="flex-1"
                />
                {links.instagram && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(links.instagram, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-full p-2">
                  <Linkedin className="w-5 h-5 text-blue-700" />
                </div>
                LinkedIn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={links.linkedin}
                  onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/sundirectpower"
                  className="flex-1"
                />
                {links.linkedin && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(links.linkedin, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* YouTube */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-red-100 rounded-full p-2">
                  <Youtube className="w-5 h-5 text-red-600" />
                </div>
                YouTube
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={links.youtube}
                  onChange={(e) => setLinks({ ...links, youtube: e.target.value })}
                  placeholder="https://youtube.com/@sundirectpower"
                  className="flex-1"
                />
                {links.youtube && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(links.youtube, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* TikTok */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-gray-100 rounded-full p-2">
                  <Music className="w-5 h-5 text-gray-900" />
                </div>
                TikTok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={links.tiktok}
                  onChange={(e) => setLinks({ ...links, tiktok: e.target.value })}
                  placeholder="https://tiktok.com/@sundirectpower"
                  className="flex-1"
                />
                {links.tiktok && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(links.tiktok, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pinterest */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-red-50 rounded-full p-2">
                  <ImageIcon className="w-5 h-5 text-red-700" />
                </div>
                Pinterest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={links.pinterest}
                  onChange={(e) => setLinks({ ...links, pinterest: e.target.value })}
                  placeholder="https://pinterest.com/sundirectpower"
                  className="flex-1"
                />
                {links.pinterest && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(links.pinterest, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> These social media links will appear in the footer of all pages on your website. 
              Make sure to include the full URL (e.g., https://facebook.com/yourpage).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
