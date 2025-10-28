import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  MessageSquare,
  Globe,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const metadata = {
  title: 'Contact Us - Sun Direct Power | Get in Touch',
  description: 'Contact Sun Direct Power for solar installation inquiries. Offices in Western Australia and Maldives. Call us at 08 6246 5606 or email admin@sundirectpower.com.au',
};

export default function ContactPage() {
  const offices = [
    {
      name: 'Head Office - Western Australia',
      address: '1 Whipper Street, Balcatta',
      city: 'WA 6112, Western Australia',
      phone: '08 6246 5606',
      mobile: '+61 0413 823 725',
      email: 'admin@sundirectpower.com.au',
      hours: 'Monday - Friday: 8:00 AM - 5:00 PM',
      icon: MapPin,
      color: 'blue',
    },
    {
      name: 'Maldives Office',
      company: 'Hoya Maldives',
      address: '1st Floor, G. Safoora Manzil',
      street: 'Bodurasgefaanu Magu',
      city: 'Male\', Maldives',
      phone: '+960 330041',
      mobile: '+960 9137773',
      hours: 'Monday - Saturday: 9:00 AM - 6:00 PM',
      icon: Globe,
      color: 'purple',
    },
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Speak with our solar experts',
      value: '08 6246 5606',
      action: 'tel:0862465606',
      color: 'blue',
    },
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Get a response within 24 hours',
      value: 'admin@sundirectpower.com.au',
      action: 'mailto:admin@sundirectpower.com.au',
      color: 'coral',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with us in real-time',
      value: 'Start Chat',
      action: '#',
      color: 'green',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation activePage="contact" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
              <p className="text-sm font-semibold text-blue-200">We're Here to Help</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Get in Touch
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Have questions about solar? Our team of experts is ready to help you make the switch to clean energy.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Contact Methods */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <a
                  key={method.title}
                  href={method.action}
                  className="block"
                >
                  <Card className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full">
                    <CardContent className="p-6 text-center">
                      <div className={`inline-block bg-${method.color}-100 rounded-full p-4 mb-4`}>
                        <Icon className={`w-8 h-8 text-${method.color}-600`} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{method.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                      <p className="text-coral font-semibold">{method.value}</p>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Offices</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Visit us at our locations in Western Australia and the Maldives
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {offices.map((office) => {
              const Icon = office.icon;
              return (
                <Card key={office.name} className="border-2 hover:border-coral transition-colors">
                  <CardContent className="p-8">
                    <div className={`inline-block bg-${office.color}-100 rounded-full p-3 mb-4`}>
                      <Icon className={`w-8 h-8 text-${office.color}-600`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{office.name}</h3>
                    {office.company && (
                      <p className="text-lg font-semibold text-gray-700 mb-2">{office.company}</p>
                    )}
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-gray-700">{office.address}</p>
                          {office.street && <p className="text-gray-700">{office.street}</p>}
                          <p className="text-gray-700">{office.city}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-gray-700">Tel: {office.phone}</p>
                          <p className="text-gray-700">Mobile: {office.mobile}</p>
                        </div>
                      </div>

                      {office.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <a href={`mailto:${office.email}`} className="text-coral hover:underline">
                            {office.email}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <p className="text-gray-700">{office.hours}</p>
                      </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700">
                      Get Directions
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Send Us a Message</h2>
            <p className="text-xl text-gray-600">
              Fill out the form below and we'll get back to you within 24 hours
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0412 345 678"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Solar installation inquiry"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    rows={6}
                    placeholder="Tell us about your solar needs..."
                    required
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Website Link */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <Globe className="w-5 h-5" />
            <span>Visit our website:</span>
            <a 
              href="https://www.sundirectpower.com.au" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-coral hover:underline font-semibold"
            >
              www.sundirectpower.com.au
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Solar Journey?
          </h2>
          <p className="text-xl mb-8 text-blue-50">
            Get a free, no-obligation quote in minutes with our online calculator.
          </p>
          <Link href="/calculator-v2">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Get Your Free Quote
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
