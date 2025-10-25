
import { CalculatorFlow } from "@/components/calculator/calculator-flow";
import { Sun } from "lucide-react";
import Link from "next/link";

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Sun className="h-8 w-8 text-gold" />
              <span className="text-xl font-bold text-primary">Sun Direct Power</span>
            </Link>
            <div className="text-sm text-gray-600">
              Need help? Call <span className="font-semibold text-coral">08 6156 6747</span>
            </div>
          </div>
        </div>
      </header>

      <CalculatorFlow />
    </div>
  );
}
