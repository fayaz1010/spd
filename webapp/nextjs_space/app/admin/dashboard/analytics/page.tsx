
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  TrendingDown,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
}

interface PerformanceData {
  id: string;
  supplierId: string;
  supplier: Supplier;
  periodStart: string;
  periodEnd: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalOrderValue: number;
  totalCommission: number;
  avgOrderValue: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  avgLeadTimeDays: number | null;
  performanceScore: number | null;
}

interface CommissionData {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalOrderValue: number;
  totalCommission: number;
  orders: any[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [commissionData, setCommissionData] = useState<CommissionData[]>([]);
  const [commissionTotals, setCommissionTotals] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedSupplier, dateRange]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/admin/suppliers');
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch performance data
      const perfParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      if (selectedSupplier !== 'all') {
        perfParams.append('supplierId', selectedSupplier);
      }
      const perfRes = await fetch(`/api/admin/analytics/performance?${perfParams}`);
      const perfData = await perfRes.json();
      setPerformanceData(perfData.performances || []);

      // Fetch commission data
      const commParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      if (selectedSupplier !== 'all') {
        commParams.append('supplierId', selectedSupplier);
      }
      const commRes = await fetch(`/api/admin/analytics/commission?${commParams}`);
      const commData = await commRes.json();
      setCommissionData(commData.commissionData || []);
      setCommissionTotals(commData.totals || {});
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformance = async () => {
    if (selectedSupplier === 'all') {
      alert('Please select a specific supplier to calculate performance');
      return;
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const res = await fetch('/api/admin/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
        }),
      });

      if (res.ok) {
        alert('Performance metrics calculated successfully');
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error calculating performance:', error);
      alert('Failed to calculate performance');
    }
  };

  const getPerformanceColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-primary">Supplier Analytics</h1>
              <p className="text-xs text-gray-500">Performance metrics and commission tracking</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <Button onClick={calculatePerformance} disabled={selectedSupplier === 'all'}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Calculate Performance
          </Button>
        </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="180">Last 6 months</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="commission">Commission Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{commissionTotals.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Last {dateRange} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Order Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(commissionTotals.totalOrderValue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Revenue generated
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${(commissionTotals.totalCommission || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {commissionTotals.totalOrderValue > 0
                      ? `${((commissionTotals.totalCommission / commissionTotals.totalOrderValue) * 100).toFixed(1)}% margin`
                      : 'No data'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Commission/Order</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(commissionTotals.avgCommissionPerOrder || 0).toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per order average
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Suppliers by Commission */}
            <Card>
              <CardHeader>
                <CardTitle>Top Suppliers by Commission</CardTitle>
                <CardDescription>
                  Highest earning suppliers in the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commissionData.slice(0, 5).map((supplier, index) => (
                    <div key={supplier.supplierId} className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{index + 1}</span>
                          <span className="text-sm font-medium">{supplier.supplierName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {supplier.totalOrders} orders · ${supplier.totalOrderValue.toLocaleString()} value
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${supplier.totalCommission.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {((supplier.totalCommission / supplier.totalOrderValue) * 100).toFixed(1)}% margin
                        </div>
                      </div>
                    </div>
                  ))}
                  {commissionData.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No commission data available for this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance Metrics</CardTitle>
                <CardDescription>
                  Detailed performance analysis for each supplier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {performanceData.map((perf) => (
                    <Card key={perf.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{perf.supplier.name}</CardTitle>
                            <CardDescription>
                              {new Date(perf.periodStart).toLocaleDateString()} - {new Date(perf.periodEnd).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className={`text-3xl font-bold ${getPerformanceColor(perf.performanceScore)}`}>
                            {perf.performanceScore?.toFixed(0) || 'N/A'}
                            <span className="text-sm font-normal">/100</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Total Orders</div>
                            <div className="text-2xl font-bold">{perf.totalOrders}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                            <div className="text-2xl font-bold text-green-600">
                              {perf.completedOrders}
                              {perf.totalOrders > 0 && (
                                <span className="text-sm font-normal ml-1">
                                  ({((perf.completedOrders / perf.totalOrders) * 100).toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">On-Time</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {perf.onTimeDeliveries}
                              {(perf.onTimeDeliveries + perf.lateDeliveries) > 0 && (
                                <span className="text-sm font-normal ml-1">
                                  ({((perf.onTimeDeliveries / (perf.onTimeDeliveries + perf.lateDeliveries)) * 100).toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Avg Lead Time</div>
                            <div className="text-2xl font-bold">
                              {perf.avgLeadTimeDays?.toFixed(1) || 'N/A'}
                              {perf.avgLeadTimeDays && <span className="text-sm font-normal ml-1">days</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Order Value</div>
                            <div className="text-xl font-bold">${perf.totalOrderValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Commission Earned</div>
                            <div className="text-xl font-bold text-green-600">${perf.totalCommission.toLocaleString()}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {performanceData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No performance data available. Select a supplier and click "Calculate Performance" to generate metrics.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commission" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission Breakdown by Supplier</CardTitle>
                <CardDescription>
                  Detailed commission tracking for all suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commissionData.map((supplier) => (
                    <Card key={supplier.supplierId}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{supplier.supplierName}</CardTitle>
                            <CardDescription>{supplier.totalOrders} orders</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              ${supplier.totalCommission.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {((supplier.totalCommission / supplier.totalOrderValue) * 100).toFixed(1)}% margin
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Total Orders</div>
                            <div className="text-xl font-bold">{supplier.totalOrders}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Order Value</div>
                            <div className="text-xl font-bold">${supplier.totalOrderValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Avg Commission/Order</div>
                            <div className="text-xl font-bold">
                              ${(supplier.totalCommission / supplier.totalOrders).toFixed(0)}
                            </div>
                          </div>
                        </div>
                        
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                            View {supplier.orders.length} orders
                          </summary>
                          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                            {supplier.orders.map((order: any) => (
                              <div key={order.orderId} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                                <div>
                                  <span className="font-medium">{order.orderNumber}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                    order.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                  <span className="font-medium">${order.totalCost?.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </CardContent>
                    </Card>
                  ))}
                  {commissionData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No commission data available for this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      </main>
    </div>
  );
}
