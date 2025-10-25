'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface StaffDocument {
  id: string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  issueDate: string | null;
  expiryDate: string | null;
  documentNumber: string | null;
  issuingAuthority: string | null;
  status: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  isConfidential: boolean;
  notes: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

export default function StaffDocumentsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    documentType: 'RESUME',
    documentName: '',
    documentNumber: '',
    issuingAuthority: '',
    issueDate: '',
    expiryDate: '',
    isConfidential: false,
    notes: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, [params.id]);

  async function fetchDocuments() {
    try {
      const [staffRes, docsRes] = await Promise.all([
        fetch(`/api/admin/staff/${params.id}`),
        fetch(`/api/admin/staff/${params.id}/documents`)
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff);
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadDocument() {
    try {
      const response = await fetch(`/api/admin/staff/${params.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          uploadedBy: 'Admin', // Would get from session
          fileUrl: '/uploads/placeholder.pdf', // Would handle file upload
          fileName: formData.documentName + '.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf'
        })
      });

      if (response.ok) {
        alert('✓ Document uploaded successfully!');
        setShowUploadModal(false);
        fetchDocuments();
      } else {
        alert('Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRING_SOON': return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      DRIVERS_LICENSE: '🪪',
      PASSPORT: '🛂',
      RESUME: '📄',
      CONTRACT: '📝',
      CEC_CERTIFICATE: '🏆',
      ELECTRICAL_LICENSE: '⚡',
      WHITE_CARD: '🦺',
      WORKING_AT_HEIGHTS: '🪜',
      FIRST_AID_CERT: '🏥',
      TAX_FILE_DECLARATION: '💰',
      BANK_DETAILS: '🏦',
      TRAINING_CERTIFICATE: '📜',
      PERFORMANCE_REVIEW: '⭐',
      POLICE_CHECK: '👮',
      REFERENCE: '✉️'
    };
    return icons[type] || '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredDocuments = filterType === 'all' 
    ? documents 
    : documents.filter(doc => doc.documentType === filterType);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/admin/dashboard/staff/${params.id}`)}
          className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
        >
          ← Back to Profile
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Document Management</h1>
        {staff && (
          <p className="text-gray-600">{staff.name} - {staff.role}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Documents</div>
          <div className="text-3xl font-bold text-blue-600">{documents.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Active</div>
          <div className="text-3xl font-bold text-green-600">
            {documents.filter(d => d.status === 'ACTIVE').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Expiring Soon</div>
          <div className="text-3xl font-bold text-yellow-600">
            {documents.filter(d => d.status === 'EXPIRING_SOON').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Expired</div>
          <div className="text-3xl font-bold text-red-600">
            {documents.filter(d => d.status === 'EXPIRED').length}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Document
          </button>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Documents</option>
            <option value="RESUME">Resume</option>
            <option value="CONTRACT">Contract</option>
            <option value="CEC_CERTIFICATE">CEC Certificate</option>
            <option value="ELECTRICAL_LICENSE">Electrical License</option>
            <option value="WHITE_CARD">White Card</option>
            <option value="WORKING_AT_HEIGHTS">Working at Heights</option>
            <option value="FIRST_AID_CERT">First Aid</option>
            <option value="TRAINING_CERTIFICATE">Training Certificate</option>
            <option value="PERFORMANCE_REVIEW">Performance Review</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-3 bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">No documents found</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Upload first document →
            </button>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{getTypeIcon(doc.documentType)}</div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(doc.status)}`}>
                  {doc.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mb-3">
                <div className="font-bold text-gray-800 mb-1">{doc.documentName}</div>
                <div className="text-xs text-gray-600">
                  {doc.documentType.replace(/_/g, ' ')}
                </div>
              </div>

              {doc.documentNumber && (
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Number:</strong> {doc.documentNumber}
                </div>
              )}

              {doc.issuingAuthority && (
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Issued by:</strong> {doc.issuingAuthority}
                </div>
              )}

              {doc.issueDate && (
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Issued:</strong> {format(new Date(doc.issueDate), 'dd MMM yyyy')}
                </div>
              )}

              {doc.expiryDate && (
                <div className={`text-sm mb-2 ${
                  new Date(doc.expiryDate) < new Date() 
                    ? 'text-red-600 font-semibold' 
                    : new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    ? 'text-yellow-600 font-semibold'
                    : 'text-gray-600'
                }`}>
                  <strong>Expires:</strong> {format(new Date(doc.expiryDate), 'dd MMM yyyy')}
                </div>
              )}

              {doc.verifiedBy && (
                <div className="flex items-center gap-1 text-sm text-green-600 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verified
                </div>
              )}

              {doc.isConfidential && (
                <div className="flex items-center gap-1 text-sm text-red-600 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Confidential
                </div>
              )}

              <div className="text-xs text-gray-500 mb-3">
                {formatFileSize(doc.fileSize)} • {doc.fileName}
              </div>

              <div className="flex gap-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 text-center"
                >
                  View
                </a>
                <button className="px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>

              {doc.notes && (
                <div className="text-xs text-gray-600 mt-3 pt-3 border-t">
                  {doc.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Upload Document</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <optgroup label="Identity">
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="PROOF_OF_AGE">Proof of Age</option>
                  </optgroup>
                  <optgroup label="Employment">
                    <option value="RESUME">Resume</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="JOB_DESCRIPTION">Job Description</option>
                    <option value="OFFER_LETTER">Offer Letter</option>
                  </optgroup>
                  <optgroup label="Compliance">
                    <option value="CEC_CERTIFICATE">CEC Certificate</option>
                    <option value="ELECTRICAL_LICENSE">Electrical License</option>
                    <option value="WHITE_CARD">White Card</option>
                    <option value="WORKING_AT_HEIGHTS">Working at Heights</option>
                    <option value="FIRST_AID_CERT">First Aid Certificate</option>
                  </optgroup>
                  <optgroup label="Financial">
                    <option value="TAX_FILE_DECLARATION">Tax File Declaration</option>
                    <option value="SUPERANNUATION_FORM">Superannuation Form</option>
                    <option value="BANK_DETAILS">Bank Details</option>
                  </optgroup>
                  <optgroup label="Training">
                    <option value="TRAINING_CERTIFICATE">Training Certificate</option>
                    <option value="CPD_RECORD">CPD Record</option>
                  </optgroup>
                  <optgroup label="Performance">
                    <option value="PERFORMANCE_REVIEW">Performance Review</option>
                    <option value="WARNING_LETTER">Warning Letter</option>
                    <option value="COMMENDATION">Commendation</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="POLICE_CHECK">Police Check</option>
                    <option value="REFERENCE">Reference</option>
                    <option value="OTHER">Other</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  value={formData.documentName}
                  onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                  placeholder="e.g., CEC Accreditation Certificate"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Upload
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                  <input type="file" className="hidden" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    placeholder="e.g., A123456"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuing Authority (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.issuingAuthority}
                    onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                    placeholder="e.g., Clean Energy Council"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isConfidential}
                    onChange={(e) => setFormData({ ...formData, isConfidential: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as Confidential</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional information..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
