'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface ComplianceScore {
  overall: number;
  breakdown: {
    cecAccreditation: number;
    electricalLicense: number;
    safetyCertifications: number;
    specializedTraining: number;
  };
  status: 'compliant' | 'at_risk' | 'non_compliant';
  issues: string[];
}

export default function StaffCertificationsPage() {
  const params = useParams();
  const router = useRouter();
  const [certifications, setCertifications] = useState<any>(null);
  const [complianceScore, setComplianceScore] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchCertifications();
  }, [params.id]);

  async function fetchCertifications() {
    try {
      const res = await fetch(`/api/admin/staff/${params.id}/certifications`);
      const data = await res.json();
      
      if (data.success) {
        setCertifications(data.certifications);
        setComplianceScore(data.complianceScore);
        setFormData(data.certifications || {});
      }
    } catch (error) {
      console.error('Error fetching certifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveCertifications() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/staff/${params.id}/certifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchCertifications();
        setEditing(false);
        alert('Certifications saved successfully!');
      } else {
        alert('Failed to save certifications');
      }
    } catch (error) {
      console.error('Error saving certifications:', error);
      alert('Failed to save certifications');
    } finally {
      setSaving(false);
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-600';
      case 'at_risk': return 'bg-yellow-600';
      case 'non_compliant': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2"
          >
            ← Back to Staff
          </button>
          <h1 className="text-3xl font-bold">Staff Certifications & Compliance</h1>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData(certifications || {});
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveCertifications}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Certifications
            </button>
          )}
        </div>
      </div>

      {/* Compliance Score Card */}
      {complianceScore && (
        <div className="mb-6 p-6 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Compliance Score</h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-6xl font-bold">{complianceScore.overall}%</div>
            <div>
              <div className={`px-4 py-2 rounded-lg text-white font-semibold ${getStatusColor(complianceScore.status)}`}>
                {complianceScore.status.toUpperCase().replace('_', ' ')}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {complianceScore.status === 'compliant' && '✓ All certifications valid'}
                {complianceScore.status === 'at_risk' && '⚠ Some certifications expiring soon'}
                {complianceScore.status === 'non_compliant' && '✗ Critical certifications missing/expired'}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">{complianceScore.breakdown.cecAccreditation}/30</div>
              <div className="text-sm text-gray-600">CEC Accreditation</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">{complianceScore.breakdown.electricalLicense}/30</div>
              <div className="text-sm text-gray-600">Electrical License</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">{complianceScore.breakdown.safetyCertifications}/20</div>
              <div className="text-sm text-gray-600">Safety Certs</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">{complianceScore.breakdown.specializedTraining}/20</div>
              <div className="text-sm text-gray-600">Specialized Training</div>
            </div>
          </div>
          
          {complianceScore.issues.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold mb-2 text-red-800">Issues Requiring Attention:</h3>
              <ul className="list-disc list-inside space-y-1">
                {complianceScore.issues.map((issue: string, i: number) => (
                  <li key={i} className="text-red-700">{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CEC Accreditation Section */}
      <div className="mb-6 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">CEC Accreditation</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Accreditation Number</label>
            {editing ? (
              <input
                type="text"
                value={formData.cecAccreditationNumber || ''}
                onChange={(e) => updateField('cecAccreditationNumber', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., A1234567"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                {formData.cecAccreditationNumber || '-'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Accreditation Type</label>
            {editing ? (
              <select
                value={formData.cecAccreditationType || ''}
                onChange={(e) => updateField('cecAccreditationType', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select...</option>
                <option value="DESIGN_INSTALL_GRID">Design & Install (Grid-Connect)</option>
                <option value="DESIGN_INSTALL_STANDALONE">Design & Install (Stand-Alone)</option>
                <option value="BATTERY_STORAGE">Battery Storage</option>
                <option value="DESIGN_ONLY">Design Only</option>
                <option value="INSTALL_ONLY">Install Only</option>
              </select>
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                {formData.cecAccreditationType?.replace(/_/g, ' ') || '-'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Issue Date</label>
            {editing ? (
              <input
                type="date"
                value={formData.cecIssueDate ? format(new Date(formData.cecIssueDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => updateField('cecIssueDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                {formData.cecIssueDate ? format(new Date(formData.cecIssueDate), 'dd MMM yyyy') : '-'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expiry Date</label>
            {editing ? (
              <input
                type="date"
                value={formData.cecExpiryDate ? format(new Date(formData.cecExpiryDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => updateField('cecExpiryDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                {formData.cecExpiryDate ? format(new Date(formData.cecExpiryDate), 'dd MMM yyyy') : '-'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Electrical License Section */}
      <div className="mb-6 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Electrical License</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">License Number</label>
            {editing ? (
              <input
                type="text"
                value={formData.electricalLicenseNumber || ''}
                onChange={(e) => updateField('electricalLicenseNumber', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., EC123456"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                {formData.electricalLicenseNumber || '-'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            {editing ? (
              <select
                value={formData.electricalLicenseState || ''}
                onChange={(e) => updateField('electricalLicenseState', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select...</option>
                <option value="WA">Western Australia</option>
                <option value="VIC">Victoria</option>
                <option value="NSW">New South Wales</option>
                <option value="QLD">Queensland</option>
                <option value="SA">South Australia</option>
                <option value="TAS">Tasmania</option>
                <option value="NT">Northern Territory</option>
                <option value="ACT">Australian Capital Territory</option>
              </select>
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                {formData.electricalLicenseState || '-'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">License Class</label>
            {editing ? (
              <input
                type="text"
                value={formData.electricalLicenseClass || ''}
                onChange={(e) => updateField('electricalLicenseClass', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., A Grade, Restricted"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                {formData.electricalLicenseClass || '-'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expiry Date</label>
            {editing ? (
              <input
                type="date"
                value={formData.licenseExpiryDate ? format(new Date(formData.licenseExpiryDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => updateField('licenseExpiryDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                {formData.licenseExpiryDate ? format(new Date(formData.licenseExpiryDate), 'dd MMM yyyy') : '-'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Certifications Section */}
      <div className="mb-6 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Safety Certifications</h2>
        
        {/* White Card */}
        <div className="mb-4 pb-4 border-b">
          <h3 className="font-medium mb-3">White Card (Construction Induction)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Card Number</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.whiteCardNumber || ''}
                  onChange={(e) => updateField('whiteCardNumber', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.whiteCardNumber || '-'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Issue Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.whiteCardIssueDate ? format(new Date(formData.whiteCardIssueDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => updateField('whiteCardIssueDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.whiteCardIssueDate ? format(new Date(formData.whiteCardIssueDate), 'dd MMM yyyy') : '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Working at Heights */}
        <div className="mb-4 pb-4 border-b">
          <h3 className="font-medium mb-3">Working at Heights</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Certified</label>
              {editing ? (
                <input
                  type="checkbox"
                  checked={formData.workingAtHeights || false}
                  onChange={(e) => updateField('workingAtHeights', e.target.checked)}
                  className="w-5 h-5"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.workingAtHeights ? '✓ Yes' : '✗ No'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Issue Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.workingAtHeightsIssue ? format(new Date(formData.workingAtHeightsIssue), 'yyyy-MM-dd') : ''}
                  onChange={(e) => updateField('workingAtHeightsIssue', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.workingAtHeightsIssue ? format(new Date(formData.workingAtHeightsIssue), 'dd MMM yyyy') : '-'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.workingAtHeightsExpiry ? format(new Date(formData.workingAtHeightsExpiry), 'yyyy-MM-dd') : ''}
                  onChange={(e) => updateField('workingAtHeightsExpiry', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.workingAtHeightsExpiry ? format(new Date(formData.workingAtHeightsExpiry), 'dd MMM yyyy') : '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* First Aid */}
        <div>
          <h3 className="font-medium mb-3">First Aid</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Certified</label>
              {editing ? (
                <input
                  type="checkbox"
                  checked={formData.firstAidCert || false}
                  onChange={(e) => updateField('firstAidCert', e.target.checked)}
                  className="w-5 h-5"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.firstAidCert ? '✓ Yes' : '✗ No'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.firstAidLevel || ''}
                  onChange={(e) => updateField('firstAidLevel', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Level 2"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.firstAidLevel || '-'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.firstAidExpiry ? format(new Date(formData.firstAidExpiry), 'yyyy-MM-dd') : ''}
                  onChange={(e) => updateField('firstAidExpiry', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.firstAidExpiry ? format(new Date(formData.firstAidExpiry), 'dd MMM yyyy') : '-'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Specialized Training Section */}
      <div className="mb-6 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Specialized Training</h2>
        
        {/* Battery Installation */}
        <div className="mb-4 pb-4 border-b">
          <h3 className="font-medium mb-3">Battery Installation</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Certified</label>
              {editing ? (
                <input
                  type="checkbox"
                  checked={formData.batteryInstallCert || false}
                  onChange={(e) => updateField('batteryInstallCert', e.target.checked)}
                  className="w-5 h-5"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.batteryInstallCert ? '✓ Yes' : '✗ No'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.batteryInstallProvider || ''}
                  onChange={(e) => updateField('batteryInstallProvider', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.batteryInstallProvider || '-'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.batteryInstallExpiry ? format(new Date(formData.batteryInstallExpiry), 'yyyy-MM-dd') : ''}
                  onChange={(e) => updateField('batteryInstallExpiry', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.batteryInstallExpiry ? format(new Date(formData.batteryInstallExpiry), 'dd MMM yyyy') : '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EV Charger Installation */}
        <div className="mb-4 pb-4 border-b">
          <h3 className="font-medium mb-3">EV Charger Installation</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Certified</label>
              {editing ? (
                <input
                  type="checkbox"
                  checked={formData.evChargerCert || false}
                  onChange={(e) => updateField('evChargerCert', e.target.checked)}
                  className="w-5 h-5"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.evChargerCert ? '✓ Yes' : '✗ No'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.evChargerProvider || ''}
                  onChange={(e) => updateField('evChargerProvider', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.evChargerProvider || '-'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.evChargerExpiry ? format(new Date(formData.evChargerExpiry), 'yyyy-MM-dd') : ''}
                  onChange={(e) => updateField('evChargerExpiry', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.evChargerExpiry ? format(new Date(formData.evChargerExpiry), 'dd MMM yyyy') : '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Solar Design */}
        <div>
          <h3 className="font-medium mb-3">Solar Design</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Certified</label>
              {editing ? (
                <input
                  type="checkbox"
                  checked={formData.solarDesignCert || false}
                  onChange={(e) => updateField('solarDesignCert', e.target.checked)}
                  className="w-5 h-5"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.solarDesignCert ? '✓ Yes' : '✗ No'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.solarDesignProvider || ''}
                  onChange={(e) => updateField('solarDesignProvider', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.solarDesignProvider || '-'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.solarDesignExpiry ? format(new Date(formData.solarDesignExpiry), 'yyyy-MM-dd') : ''}
                  onChange={(e) => updateField('solarDesignExpiry', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formData.solarDesignExpiry ? format(new Date(formData.solarDesignExpiry), 'dd MMM yyyy') : '-'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
