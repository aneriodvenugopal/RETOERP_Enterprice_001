import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, FileText, Award, Download,
  Calendar, TrendingDown, AlertCircle
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // Analytics data states
  const [dashboardData, setDashboardData] = useState(null);
  const [leadAnalytics, setLeadAnalytics] = useState(null);
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [commissionAnalytics, setCommissionAnalytics] = useState(null);

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      const tenantId = user?.role !== 'super_admin' ? user?.tenant_id : null;
      
      // Load all analytics in parallel
      const [dashboard, leads, sales, payments, commissions] = await Promise.all([
        analyticsService.getDashboard(tenantId, dateRange.start, dateRange.end),
        analyticsService.getLeads(tenantId, null, dateRange.start, dateRange.end),
        analyticsService.getSales(tenantId, dateRange.start, dateRange.end),
        analyticsService.getPayments(tenantId, dateRange.start, dateRange.end),
        analyticsService.getCommissions(tenantId, null, dateRange.start, dateRange.end)
      ]);

      setDashboardData(dashboard);
      setLeadAnalytics(leads);
      setSalesAnalytics(sales);
      setPaymentAnalytics(payments);
      setCommissionAnalytics(commissions);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    loadAllAnalytics();
  };

  const exportToExcel = (data, filename) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and metrics</p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
          <Button onClick={handleDateRangeChange}>
            <Calendar className="w-4 h-4 mr-2" />
            Apply Filter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {dashboardData && (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.overview.total_leads}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.overview.converted_leads} converted
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.overview.conversion_rate}%</div>
                    <p className="text-xs text-muted-foreground">
                      Lead to customer
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{dashboardData.overview.total_revenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      From {dashboardData.overview.total_bookings} bookings
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{dashboardData.overview.pending_payments.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      ₹{dashboardData.overview.total_payments_collected.toLocaleString()} collected
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Property Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Status Distribution</CardTitle>
                  <CardDescription>Current inventory status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.property_stats}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {dashboardData.property_stats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6">
          {leadAnalytics && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Lead Analytics</h2>
                <Button
                  onClick={() => exportToExcel(leadAnalytics.leads_by_source, 'lead_analytics')}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leads by Source */}
                <Card>
                  <CardHeader>
                    <CardTitle>Leads by Source</CardTitle>
                    <CardDescription>Lead generation channels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={leadAnalytics.leads_by_source}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="source" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Leads by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Lead Pipeline</CardTitle>
                    <CardDescription>Leads by status stage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={leadAnalytics.leads_by_status}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Lead Quality Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Lead Quality</CardTitle>
                    <CardDescription>Distribution by quality rating</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={leadAnalytics.leads_by_quality}
                          dataKey="count"
                          nameKey="quality"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {leadAnalytics.leads_by_quality.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Staff</CardTitle>
                    <CardDescription>By lead count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leadAnalytics.top_staff.map((staff, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{staff.staff_name}</span>
                          <span className="text-blue-600 font-bold">{staff.lead_count} leads</span>
                        </div>
                      ))}
                      {leadAnalytics.top_staff.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Sales Tab - Continue in next message due to length */}
        <TabsContent value="sales" className="space-y-6">
          {salesAnalytics && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Sales Analytics</h2>
                <Button
                  onClick={() => exportToExcel(salesAnalytics.sales_by_project, 'sales_analytics')}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Sales by Project */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Project</CardTitle>
                    <CardDescription>Revenue contribution by project</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesAnalytics.sales_by_project}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="project_name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_sales" fill="#8884D8" name="Total Sales (₹)" />
                        <Bar dataKey="booking_count" fill="#82ca9d" name="Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Monthly Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Sales Trend</CardTitle>
                    <CardDescription>Sales performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={salesAnalytics.monthly_trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="total_sales" stroke="#8884d8" fill="#8884d8" name="Sales (₹)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Payment Plan Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Plan Preference</CardTitle>
                    <CardDescription>Customer payment choices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={salesAnalytics.payment_plan_distribution}
                          dataKey="count"
                          nameKey="plan"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {salesAnalytics.payment_plan_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          {paymentAnalytics && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Payment Analytics</h2>
                <Button
                  onClick={() => exportToExcel(paymentAnalytics.payments_by_mode, 'payment_analytics')}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </div>

              {/* Payment Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Expected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₹{paymentAnalytics.payment_status.total_expected.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Collected ({paymentAnalytics.payment_status.collection_rate}%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ₹{paymentAnalytics.payment_status.total_collected.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      ₹{paymentAnalytics.payment_status.pending.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Overdue Alert */}
              {paymentAnalytics.overdue.count > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-700 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Overdue Payments Alert
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-700">
                      <strong>{paymentAnalytics.overdue.count}</strong> payment(s) overdue with total amount of{' '}
                      <strong>₹{paymentAnalytics.overdue.amount.toLocaleString()}</strong>
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Payments by Mode */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Collection by payment mode</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={paymentAnalytics.payments_by_mode}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mode" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#0088FE" name="Amount (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          {commissionAnalytics && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Commission Analytics</h2>
                <Button
                  onClick={() => exportToExcel(commissionAnalytics.commissions_by_status, 'commission_analytics')}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Commission by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Commission Status</CardTitle>
                    <CardDescription>Breakdown by approval status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={commissionAnalytics.commissions_by_status}
                          dataKey="total"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {commissionAnalytics.commissions_by_status.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Earners */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Earners</CardTitle>
                    <CardDescription>Highest commission earners</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {commissionAnalytics.top_earners.map((earner, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium">{earner.staff_name}</span>
                          </div>
                          <span className="text-green-600 font-bold">₹{earner.total_commission.toLocaleString()}</span>
                        </div>
                      ))}
                      {commissionAnalytics.top_earners.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
