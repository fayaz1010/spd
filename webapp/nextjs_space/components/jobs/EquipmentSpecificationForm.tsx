/**
 * Equipment Specification Form
 * Phase 6: Comprehensive form for capturing all equipment details for WP-compliant SLD
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface EquipmentSpecificationFormProps {
  jobId: string;
  initialData?: any;
  onSave?: (data: any) => void;
}

export function EquipmentSpecificationForm({ jobId, initialData, onSave }: EquipmentSpecificationFormProps) {
  const [formData, setFormData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/equipment-spec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        onSave?.(formData);
      }
    } catch (error) {
      console.error('Error saving equipment spec:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoPopulate = async () => {
    // Auto-populate from selected products
    setAutoPopulated(true);
    // Implementation would fetch from product database
  };

  return (
    <div className="space-y-6">
      {/* Auto-populate button */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Equipment specifications can be auto-populated from selected products. 
          <Button variant="link" onClick={handleAutoPopulate} className="ml-2">
            Auto-populate from products
          </Button>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="panels" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="panels">Solar Panels</TabsTrigger>
          <TabsTrigger value="inverter">Inverter</TabsTrigger>
          <TabsTrigger value="battery">Battery</TabsTrigger>
          <TabsTrigger value="cables">Cables</TabsTrigger>
          <TabsTrigger value="protection">Protection</TabsTrigger>
        </TabsList>

        {/* SOLAR PANELS TAB */}
        <TabsContent value="panels">
          <Card>
            <CardHeader>
              <CardTitle>Solar Panel Specifications</CardTitle>
              <CardDescription>Required for CEC compliance and Western Power approval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="panelManufacturer">Manufacturer *</Label>
                  <Input
                    id="panelManufacturer"
                    value={formData.panelManufacturer || ''}
                    onChange={(e) => updateField('panelManufacturer', e.target.value)}
                    placeholder="e.g., Trina Solar"
                  />
                </div>
                <div>
                  <Label htmlFor="panelModel">Model *</Label>
                  <Input
                    id="panelModel"
                    value={formData.panelModel || ''}
                    onChange={(e) => updateField('panelModel', e.target.value)}
                    placeholder="e.g., Vertex S TSM-440DE09.08"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="panelCecApproval">CEC Approval Number *</Label>
                <Input
                  id="panelCecApproval"
                  value={formData.panelCecApproval || ''}
                  onChange={(e) => updateField('panelCecApproval', e.target.value)}
                  placeholder="e.g., CEC-PV-12345"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Find on CEC approved products list
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="panelWattage">Wattage (W) *</Label>
                  <Input
                    id="panelWattage"
                    type="number"
                    value={formData.panelWattage || ''}
                    onChange={(e) => updateField('panelWattage', parseInt(e.target.value))}
                    placeholder="440"
                  />
                </div>
                <div>
                  <Label htmlFor="panelVoc">Open Circuit Voltage (Voc) *</Label>
                  <Input
                    id="panelVoc"
                    type="number"
                    step="0.1"
                    value={formData.panelVoc || ''}
                    onChange={(e) => updateField('panelVoc', parseFloat(e.target.value))}
                    placeholder="49.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="panelIsc">Short Circuit Current (Isc) *</Label>
                  <Input
                    id="panelIsc"
                    type="number"
                    step="0.1"
                    value={formData.panelIsc || ''}
                    onChange={(e) => updateField('panelIsc', parseFloat(e.target.value))}
                    placeholder="11.5"
                  />
                </div>
                <div>
                  <Label htmlFor="panelVmp">Max Power Voltage (Vmp)</Label>
                  <Input
                    id="panelVmp"
                    type="number"
                    step="0.1"
                    value={formData.panelVmp || ''}
                    onChange={(e) => updateField('panelVmp', parseFloat(e.target.value))}
                    placeholder="41.2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVERTER TAB */}
        <TabsContent value="inverter">
          <Card>
            <CardHeader>
              <CardTitle>Inverter Specifications</CardTitle>
              <CardDescription>AS/NZS 4777.2:2020 compliant inverter details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inverterManufacturer">Manufacturer *</Label>
                  <Input
                    id="inverterManufacturer"
                    value={formData.inverterManufacturer || ''}
                    onChange={(e) => updateField('inverterManufacturer', e.target.value)}
                    placeholder="e.g., Fronius"
                  />
                </div>
                <div>
                  <Label htmlFor="inverterModel">Model *</Label>
                  <Input
                    id="inverterModel"
                    value={formData.inverterModel || ''}
                    onChange={(e) => updateField('inverterModel', e.target.value)}
                    placeholder="e.g., Primo GEN24 10.0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="inverterCecApproval">CEC Approval Number *</Label>
                <Input
                  id="inverterCecApproval"
                  value={formData.inverterCecApproval || ''}
                  onChange={(e) => updateField('inverterCecApproval', e.target.value)}
                  placeholder="e.g., CEC-INV-12345"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="inverterCapacity">Capacity (kW) *</Label>
                  <Input
                    id="inverterCapacity"
                    type="number"
                    step="0.1"
                    value={formData.inverterCapacity || ''}
                    onChange={(e) => updateField('inverterCapacity', parseFloat(e.target.value))}
                    placeholder="10.0"
                  />
                </div>
                <div>
                  <Label htmlFor="inverterEfficiency">Efficiency (%)</Label>
                  <Input
                    id="inverterEfficiency"
                    type="number"
                    step="0.1"
                    value={formData.inverterEfficiency || ''}
                    onChange={(e) => updateField('inverterEfficiency', parseFloat(e.target.value))}
                    placeholder="97.5"
                  />
                </div>
                <div>
                  <Label htmlFor="inverterMaxDcInput">Max DC Input (V)</Label>
                  <Input
                    id="inverterMaxDcInput"
                    type="number"
                    value={formData.inverterMaxDcInput || ''}
                    onChange={(e) => updateField('inverterMaxDcInput', parseFloat(e.target.value))}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="inverterPhases">Phase Configuration *</Label>
                <Select
                  value={formData.inverterPhases?.toString() || '1'}
                  onValueChange={(value) => updateField('inverterPhases', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Single Phase (230V)</SelectItem>
                    <SelectItem value="3">Three Phase (400V)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BATTERY TAB */}
        <TabsContent value="battery">
          <Card>
            <CardHeader>
              <CardTitle>Battery Storage Specifications</CardTitle>
              <CardDescription>Required if battery system is installed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>WA Requirement:</strong> VPP enrollment is mandatory for all battery systems
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="batteryManufacturer">Manufacturer</Label>
                  <Input
                    id="batteryManufacturer"
                    value={formData.batteryManufacturer || ''}
                    onChange={(e) => updateField('batteryManufacturer', e.target.value)}
                    placeholder="e.g., Tesla"
                  />
                </div>
                <div>
                  <Label htmlFor="batteryModel">Model</Label>
                  <Input
                    id="batteryModel"
                    value={formData.batteryModel || ''}
                    onChange={(e) => updateField('batteryModel', e.target.value)}
                    placeholder="e.g., Powerwall 2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="batteryCecApproval">CEC Approval Number</Label>
                <Input
                  id="batteryCecApproval"
                  value={formData.batteryCecApproval || ''}
                  onChange={(e) => updateField('batteryCecApproval', e.target.value)}
                  placeholder="e.g., CEC-BAT-12345"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="batteryCapacity">Capacity (kWh)</Label>
                  <Input
                    id="batteryCapacity"
                    type="number"
                    step="0.1"
                    value={formData.batteryCapacity || ''}
                    onChange={(e) => updateField('batteryCapacity', parseFloat(e.target.value))}
                    placeholder="13.5"
                  />
                </div>
                <div>
                  <Label htmlFor="batteryVoltage">Voltage (V)</Label>
                  <Input
                    id="batteryVoltage"
                    type="number"
                    step="0.1"
                    value={formData.batteryVoltage || ''}
                    onChange={(e) => updateField('batteryVoltage', parseFloat(e.target.value))}
                    placeholder="51.2"
                  />
                </div>
                <div>
                  <Label htmlFor="batteryChemistry">Chemistry</Label>
                  <Select
                    value={formData.batteryChemistry || 'LFP'}
                    onValueChange={(value) => updateField('batteryChemistry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LFP">LFP (Lithium Iron Phosphate)</SelectItem>
                      <SelectItem value="NMC">NMC (Lithium Nickel Manganese Cobalt)</SelectItem>
                      <SelectItem value="LTO">LTO (Lithium Titanate)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="batteryBmsModel">BMS Model</Label>
                <Input
                  id="batteryBmsModel"
                  value={formData.batteryBmsModel || ''}
                  onChange={(e) => updateField('batteryBmsModel', e.target.value)}
                  placeholder="Battery Management System model"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CABLES TAB */}
        <TabsContent value="cables">
          <Card>
            <CardHeader>
              <CardTitle>Cable Specifications</CardTitle>
              <CardDescription>AS/NZS 3000:2018 compliant cable sizing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* DC Cables */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">DC Cables</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dcCableSize">Size *</Label>
                    <Select
                      value={formData.dcCableSize || '6mm²'}
                      onValueChange={(value) => updateField('dcCableSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4mm²">4mm²</SelectItem>
                        <SelectItem value="6mm²">6mm²</SelectItem>
                        <SelectItem value="10mm²">10mm²</SelectItem>
                        <SelectItem value="16mm²">16mm²</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dcCableInsulation">Insulation *</Label>
                    <Select
                      value={formData.dcCableInsulation || 'V-90'}
                      onValueChange={(value) => updateField('dcCableInsulation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="V-90">V-90</SelectItem>
                        <SelectItem value="XLPE">XLPE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dcCableLength">Length (m)</Label>
                    <Input
                      id="dcCableLength"
                      type="number"
                      value={formData.dcCableLength || ''}
                      onChange={(e) => updateField('dcCableLength', parseFloat(e.target.value))}
                      placeholder="20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dcCableInstallMethod">Installation Method</Label>
                    <Select
                      value={formData.dcCableInstallMethod || 'Conduit'}
                      onValueChange={(value) => updateField('dcCableInstallMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Conduit">Conduit</SelectItem>
                        <SelectItem value="Cable tray">Cable Tray</SelectItem>
                        <SelectItem value="Clipped direct">Clipped Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dcConduitSize">Conduit Size</Label>
                    <Select
                      value={formData.dcConduitSize || '25mm'}
                      onValueChange={(value) => updateField('dcConduitSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20mm">20mm</SelectItem>
                        <SelectItem value="25mm">25mm</SelectItem>
                        <SelectItem value="32mm">32mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* AC Cables */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">AC Cables</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="acCableSize">Size *</Label>
                    <Select
                      value={formData.acCableSize || '6mm²'}
                      onValueChange={(value) => updateField('acCableSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4mm²">4mm²</SelectItem>
                        <SelectItem value="6mm²">6mm²</SelectItem>
                        <SelectItem value="10mm²">10mm²</SelectItem>
                        <SelectItem value="16mm²">16mm²</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="acCableType">Type *</Label>
                    <Select
                      value={formData.acCableType || 'TPS'}
                      onValueChange={(value) => updateField('acCableType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TPS">TPS (Twin & Earth)</SelectItem>
                        <SelectItem value="Singles in conduit">Singles in Conduit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="acCableLength">Length (m)</Label>
                    <Input
                      id="acCableLength"
                      type="number"
                      value={formData.acCableLength || ''}
                      onChange={(e) => updateField('acCableLength', parseFloat(e.target.value))}
                      placeholder="15"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROTECTION TAB */}
        <TabsContent value="protection">
          <Card>
            <CardHeader>
              <CardTitle>Protection Devices</CardTitle>
              <CardDescription>Circuit breakers, RCDs, and isolators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* DC Protection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">DC Protection</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dcBreakerRating">Breaker Rating</Label>
                    <Input
                      id="dcBreakerRating"
                      value={formData.dcBreakerRating || ''}
                      onChange={(e) => updateField('dcBreakerRating', e.target.value)}
                      placeholder="32A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dcBreakerVoltage">Voltage Rating</Label>
                    <Input
                      id="dcBreakerVoltage"
                      value={formData.dcBreakerVoltage || '1000V DC'}
                      onChange={(e) => updateField('dcBreakerVoltage', e.target.value)}
                      placeholder="1000V DC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dcBreakerBreakingCapacity">Breaking Capacity</Label>
                    <Input
                      id="dcBreakerBreakingCapacity"
                      value={formData.dcBreakerBreakingCapacity || ''}
                      onChange={(e) => updateField('dcBreakerBreakingCapacity', e.target.value)}
                      placeholder="10kA"
                    />
                  </div>
                </div>
              </div>

              {/* AC Protection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">AC Protection</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="acBreakerRating">Breaker Rating</Label>
                    <Input
                      id="acBreakerRating"
                      value={formData.acBreakerRating || ''}
                      onChange={(e) => updateField('acBreakerRating', e.target.value)}
                      placeholder="40A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="acBreakerPoles">Poles</Label>
                    <Select
                      value={formData.acBreakerPoles?.toString() || '2'}
                      onValueChange={(value) => updateField('acBreakerPoles', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1-Pole</SelectItem>
                        <SelectItem value="2">2-Pole</SelectItem>
                        <SelectItem value="3">3-Pole</SelectItem>
                        <SelectItem value="4">4-Pole</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="acBreakerType">Type</Label>
                    <Input
                      id="acBreakerType"
                      value={formData.acBreakerType || ''}
                      onChange={(e) => updateField('acBreakerType', e.target.value)}
                      placeholder="MCB C40"
                    />
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Type B RCD Required:</strong> AS/NZS 3000 requires Type B RCD for inverter installations
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rcdRating">RCD Rating *</Label>
                    <Select
                      value={formData.rcdRating || '30mA'}
                      onValueChange={(value) => updateField('rcdRating', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30mA">30mA</SelectItem>
                        <SelectItem value="300mA">300mA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rcdType">RCD Type *</Label>
                    <Select
                      value={formData.rcdType || 'Type B'}
                      onValueChange={(value) => updateField('rcdType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Type A">Type A</SelectItem>
                        <SelectItem value="Type B">Type B (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rcdPoles">RCD Poles</Label>
                    <Select
                      value={formData.rcdPoles?.toString() || '2'}
                      onValueChange={(value) => updateField('rcdPoles', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2-Pole</SelectItem>
                        <SelectItem value="4">4-Pole</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Surge Protection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="surgeProtection"
                    checked={formData.surgeProtection || false}
                    onCheckedChange={(checked) => updateField('surgeProtection', checked)}
                  />
                  <Label htmlFor="surgeProtection">Surge Protection Installed</Label>
                </div>

                {formData.surgeProtection && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="surgeProtectionType">Type</Label>
                      <Select
                        value={formData.surgeProtectionType || 'Type 2'}
                        onValueChange={(value) => updateField('surgeProtectionType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Type 1">Type 1</SelectItem>
                          <SelectItem value="Type 2">Type 2</SelectItem>
                          <SelectItem value="Type 1+2">Type 1+2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="surgeProtectionRating">Rating</Label>
                      <Input
                        id="surgeProtectionRating"
                        value={formData.surgeProtectionRating || ''}
                        onChange={(e) => updateField('surgeProtectionRating', e.target.value)}
                        placeholder="40kA"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Equipment Specifications'}
        </Button>
      </div>

      {autoPopulated && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Equipment specifications auto-populated from product database. Please review and verify all details.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
