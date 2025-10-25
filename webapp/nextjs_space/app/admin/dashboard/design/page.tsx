'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  FileText,
  Calculator,
  Map,
  Box,
  ArrowRight,
  Plus,
  Search
} from 'lucide-react';

interface Job {
  id: string;
  jobNumber: string;
  systemSize: number;
  status: string;
  lead: {
    name: string;
    address: string;
  };
  hasDesign: boolean;
}

export default function DesignToolsHub() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/jobs?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.lead.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Design Tools</h1>
              <p className="text-gray-600 mt-1">Professional solar system design suite</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Design Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Interactive SLD Designer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag-and-drop single line diagram designer with real-time calculations
            </p>
            <div className="flex items-center text-blue-600 text-sm font-medium">
              <span>Design SLD</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow opacity-50">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Calculator className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Voltage Rise Calculator</h3>
            <p className="text-sm text-gray-600 mb-4">
              Calculate voltage drop and ensure AS/NZS 3000:2018 compliance
            </p>
            <div className="flex items-center text-gray-400 text-sm font-medium">
              <span>Coming Soon</span>
            </div>
          </div>

          <Link href="#panel-designer" className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Map className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Panel Array Designer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Design panel layouts with Google Solar API & NearMap imagery
            </p>
            <div className="flex items-center text-purple-600 text-sm font-medium">
              <span>Design Panel Array</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow opacity-50">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Box className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">3D Shading Analysis</h3>
            <p className="text-sm text-gray-600 mb-4">
              Visualize shading impact and optimize panel placement
            </p>
            <div className="flex items-center text-gray-400 text-sm font-medium">
              <span>Coming Soon</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow opacity-50">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Blueprint Designer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Design systems on architectural plans for pre-construction quotes
            </p>
            <div className="flex items-center text-gray-400 text-sm font-medium">
              <span>Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Recent Jobs - Quick Access to Design Tools */}
        <div className="bg-white rounded-xl shadow-sm border" id="panel-designer">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Select Job for Design</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No jobs found</p>
              </div>
            ) : (
              filteredJobs.slice(0, 10).map((job) => (
                <div
                  key={job.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-blue-600">
                          {job.jobNumber}
                        </div>
                        {job.hasDesign && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Has Design
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 mt-1">
                        {job.lead.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {job.lead.address}
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {job.systemSize}kW
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {job.status}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/dashboard/design/sld/${job.id}`}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        SLD
                      </Link>
                      <Link
                        href={`/admin/design-tools/panel-designer/${job.id}`}
                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <Map className="w-3 h-3" />
                        Panels
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
