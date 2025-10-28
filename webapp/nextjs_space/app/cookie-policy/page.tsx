import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Cookie } from 'lucide-react';

export const metadata = {
  title: 'Cookie Policy - Sun Direct Power',
  description: 'Learn about how Sun Direct Power uses cookies and similar technologies on our website.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Cookie className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Cookie Policy</h1>
          </div>
          <p className="text-xl text-blue-100">
            Last updated: October 27, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
            </p>

            <h2>2. Types of Cookies We Use</h2>
            
            <h3>2.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas. The website cannot function properly without these cookies.
            </p>
            <ul>
              <li>Session management</li>
              <li>Security features</li>
              <li>Load balancing</li>
            </ul>

            <h3>2.2 Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
            </p>
            <ul>
              <li>Google Analytics</li>
              <li>Page view tracking</li>
              <li>User behavior analysis</li>
            </ul>

            <h3>2.3 Functional Cookies</h3>
            <p>
              These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
            </p>
            <ul>
              <li>Language preferences</li>
              <li>Region selection</li>
              <li>Customized content</li>
            </ul>

            <h3>2.4 Marketing Cookies</h3>
            <p>
              These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad.
            </p>
            <ul>
              <li>Facebook Pixel</li>
              <li>Google Ads</li>
              <li>Retargeting campaigns</li>
            </ul>

            <h2>3. Third-Party Cookies</h2>
            <p>
              We may use third-party services that set cookies on your device. These include:
            </p>
            <ul>
              <li><strong>Google Analytics:</strong> For website analytics</li>
              <li><strong>Facebook:</strong> For social media integration and advertising</li>
              <li><strong>YouTube:</strong> For embedded video content</li>
              <li><strong>Payment Processors:</strong> For secure payment processing</li>
            </ul>

            <h2>4. How Long Do Cookies Last?</h2>
            <p>
              Cookies can be either "session" cookies or "persistent" cookies:
            </p>
            <ul>
              <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until you delete them</li>
            </ul>

            <h2>5. Managing Your Cookie Preferences</h2>
            <p>
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by:
            </p>
            <ul>
              <li>Using the cookie consent banner when you first visit our website</li>
              <li>Adjusting your browser settings to refuse cookies</li>
              <li>Deleting cookies that have already been set</li>
              <li>Using browser plugins to manage cookies</li>
            </ul>

            <h3>5.1 Browser Settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. Here's how to manage cookies in popular browsers:
            </p>
            <ul>
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
            </ul>

            <h2>6. Impact of Disabling Cookies</h2>
            <p>
              If you choose to disable cookies, some features of our website may not function properly. This may include:
            </p>
            <ul>
              <li>Difficulty logging into your account</li>
              <li>Loss of personalized settings</li>
              <li>Inability to use certain features</li>
              <li>Less relevant content and advertising</li>
            </ul>

            <h2>7. Cookie Consent</h2>
            <p>
              When you first visit our website, you will see a cookie consent banner. You can choose to:
            </p>
            <ul>
              <li><strong>Accept All:</strong> Allow all cookies including analytics and marketing</li>
              <li><strong>Reject Non-Essential:</strong> Only allow essential cookies</li>
              <li><strong>Customize:</strong> Choose which types of cookies to allow</li>
            </ul>

            <h2>8. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> admin@sundirectpower.com.au</li>
              <li><strong>Phone:</strong> 08 6246 5606</li>
              <li><strong>Address:</strong> 1 Whipper Street, Balcatta, WA 6112</li>
            </ul>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
