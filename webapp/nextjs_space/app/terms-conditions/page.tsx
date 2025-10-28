import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions - Sun Direct Power',
  description: 'Terms and Conditions for Sun Direct Power solar installation services.',
};

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <FileText className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Terms & Conditions</h1>
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
            
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using Sun Direct Power's website and services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>

            <h2>2. Services</h2>
            <p>
              Sun Direct Power provides solar panel installation, battery storage solutions, and related renewable energy services in Western Australia and the Maldives.
            </p>

            <h3>2.1 Quotations</h3>
            <ul>
              <li>All quotations are valid for 30 days unless otherwise stated</li>
              <li>Prices are subject to change based on site conditions discovered during installation</li>
              <li>Quotations are based on information provided by the customer</li>
            </ul>

            <h3>2.2 Installation Services</h3>
            <ul>
              <li>Installation will be performed by CEC-accredited installers</li>
              <li>Installation dates are subject to weather conditions and regulatory approvals</li>
              <li>Customer must provide safe access to the installation site</li>
            </ul>

            <h2>3. Payment Terms</h2>
            <h3>3.1 Deposits</h3>
            <p>
              A deposit of 30% is required to secure your installation booking. The deposit is non-refundable once materials have been ordered.
            </p>

            <h3>3.2 Final Payment</h3>
            <p>
              Final payment is due upon completion of installation and before system commissioning, unless alternative payment arrangements have been agreed in writing.
            </p>

            <h3>3.3 Late Payments</h3>
            <p>
              Late payments may incur interest charges at a rate of 2% per month or the maximum allowed by law, whichever is less.
            </p>

            <h2>4. Warranties</h2>
            <h3>4.1 Product Warranties</h3>
            <p>
              Solar panels, inverters, and batteries come with manufacturer warranties as specified in your quotation. Warranty periods typically range from 10-25 years for panels and 5-10 years for inverters.
            </p>

            <h3>4.2 Installation Warranty</h3>
            <p>
              We provide a workmanship warranty for our installation services. The warranty period and terms will be specified in your installation agreement.
            </p>

            <h2>5. Customer Obligations</h2>
            <p>The customer agrees to:</p>
            <ul>
              <li>Provide accurate information about their property and electrical system</li>
              <li>Obtain necessary approvals from body corporate or landlords</li>
              <li>Ensure safe access to the installation site</li>
              <li>Maintain the system according to manufacturer guidelines</li>
              <li>Notify us immediately of any system faults or issues</li>
            </ul>

            <h2>6. Cancellations and Refunds</h2>
            <h3>6.1 Customer Cancellation</h3>
            <p>
              Customers may cancel their order with the following conditions:
            </p>
            <ul>
              <li>Before materials ordered: Full refund minus $250 administration fee</li>
              <li>After materials ordered: Deposit is non-refundable</li>
              <li>After installation commenced: No refund available</li>
            </ul>

            <h3>6.2 Our Right to Cancel</h3>
            <p>
              We reserve the right to cancel an installation if:
            </p>
            <ul>
              <li>Site conditions are unsafe or unsuitable</li>
              <li>Required regulatory approvals are denied</li>
              <li>Customer breaches these terms</li>
            </ul>

            <h2>7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Sun Direct Power's liability is limited to:
            </p>
            <ul>
              <li>The cost of the services provided</li>
              <li>Re-performing the services</li>
              <li>Refunding the amount paid for the services</li>
            </ul>
            <p>
              We are not liable for indirect, consequential, or incidental damages including loss of profits or revenue.
            </p>

            <h2>8. Force Majeure</h2>
            <p>
              We are not liable for delays or failures in performance resulting from circumstances beyond our reasonable control, including natural disasters, government actions, or supply chain disruptions.
            </p>

            <h2>9. Intellectual Property</h2>
            <p>
              All content on our website, including text, graphics, logos, and software, is the property of Sun Direct Power and protected by copyright laws.
            </p>

            <h2>10. Dispute Resolution</h2>
            <p>
              Any disputes arising from these terms will be governed by the laws of Western Australia. We encourage customers to contact us first to resolve any issues before pursuing legal action.
            </p>

            <h2>11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to our website.
            </p>

            <h2>12. Contact Information</h2>
            <p>
              For questions about these Terms and Conditions:
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
