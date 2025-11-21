import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Home, CreditCard, Calendar, AlertCircle, DollarSign, Building, CheckCircle, LogOut, ArrowLeft } from 'lucide-react';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [paymentSchedules, setPaymentSchedules] = useState([]);
  const [resaleRequests, setResaleRequests] = useState([]);
  const [showResaleDialog, setShowResaleDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [resaleForm, setResaleForm] = useState({
    asking_price: '',
    reason: '',
    notes: ''
  });
  const [propertyResaleStatus, setPropertyResaleStatus] = useState({});

  // Helper function to safely format numbers
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return Number(value).toLocaleString();
  };

  useEffect(() => {
    loadDashboard();
    loadBookings();
    loadPayments();
    loadProperties();
    loadPaymentSchedules();
    loadResaleRequests();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await customerService.getDashboard();
      console.log('Dashboard data received:', data);
      console.log('Dashboard properties count:', data?.properties?.length || 0);
      console.log('Dashboard upcoming_payments count:', data?.upcoming_payments?.length || 0);
      
      // Check if data has the expected structure
      if (data && data.overview) {
        setDashboardData(data);
        
        // If properties are included in dashboard data, use them as initial state
        if (data.properties && data.properties.length > 0) {
          console.log('Setting properties from dashboard data:', data.properties.length);
          setProperties(data.properties);
        }
      } else {
        console.error('Invalid dashboard data structure:', data);
        // Set empty data structure to prevent errors
        setDashboardData({
          overview: {
            total_bookings: 0,
            active_bookings: 0,
            total_invested: 0,
            total_paid: 0,
            total_pending: 0,
            overdue_amount: 0,
            overdue_count: 0
          },
          properties: [],
          upcoming_payments: [],
          recent_payments: []
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      const errorMsg = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : error.message || 'Failed to load dashboard';
      toast.error(errorMsg);
      // Set empty data structure
      setDashboardData({
        overview: {
          total_bookings: 0,
          active_bookings: 0,
          total_invested: 0,
          total_paid: 0,
          total_pending: 0,
          overdue_amount: 0,
          overdue_count: 0
        },
        properties: [],
        upcoming_payments: [],
        recent_payments: []
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const data = await customerService.getBookings();
      console.log('Bookings data:', data);
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    }
  };

  const loadPayments = async () => {
    try {
      const data = await customerService.getPayments();
      console.log('Payments data:', data);
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    }
  };

  const loadProperties = async () => {
    try {
      const data = await customerService.getProperties();
      console.log('Properties API response:', data);
      console.log('Properties array length:', data?.properties?.length || 0);
      if (data?.properties && data.properties.length > 0) {
        console.log('First property sample:', data.properties[0]);
      }
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : 'Failed to load properties';
      toast.error(errorMsg);
      setProperties([]);
    }
  };

  const loadPaymentSchedules = async () => {
    try {
      const data = await customerService.getPaymentSchedules();
      console.log('Payment schedules API response:', data);
      console.log('Schedules array length:', data?.schedules?.length || 0);
      if (data?.schedules && data.schedules.length > 0) {
        console.log('First schedule sample:', data.schedules[0]);
      }
      setPaymentSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : 'Failed to load payment schedules';
      toast.error(errorMsg);
      setPaymentSchedules([]);
    }
  };

  const loadResaleRequests = async () => {
    try {
      const data = await customerService.getResaleRequests();
      setResaleRequests(data.requests || []);
      
      // Track which properties have resale requests
      const statusMap = {};
      (data.requests || []).forEach(request => {
        if (request.property_id) {
          statusMap[request.property_id] = {
            hasRequest: true,
            status: request.status,
            requestId: request.id
          };
        }
      });
      setPropertyResaleStatus(statusMap);
    } catch (error) {
      console.error('Error loading resale requests:', error);
    }
  };

  const handleResaleRequest = async () => {
    if (!selectedProperty || !resaleForm.asking_price) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!selectedProperty.booking_id) {
      toast.error('No booking record found for this property. Please contact support.');
      return;
    }

    console.log('Submitting resale request:', {
      property_id: selectedProperty.id,
      booking_id: selectedProperty.booking_id,
      asking_price: resaleForm.asking_price
    });

    try {
      await customerService.createResaleRequest({
        property_id: selectedProperty.id,
        booking_id: selectedProperty.booking_id,
        asking_price: parseFloat(resaleForm.asking_price),
        reason: resaleForm.reason,
        notes: resaleForm.notes
      });
      toast.success('Resale request submitted successfully!');
      setShowResaleDialog(false);
      setResaleForm({ asking_price: '', reason: '', notes: '' });
      setSelectedProperty(null);
      loadResaleRequests();
    } catch (error) {
      console.error('Error submitting resale request:', error);
      const errorMsg = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : error.message || 'Failed to submit resale request';
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-ocean-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ocean-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.role !== 'customer' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-ocean-primary hover:bg-ocean-primary/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-primary to-ocean-secondary flex items-center justify-center shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-ocean-primary to-ocean-secondary bg-clip-text text-transparent">RETOERP</h1>
                <p className="text-xs text-gray-500">Customer Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-ocean-primary capitalize">{typeof user?.role === 'string' ? user.role.replace('_', ' ') : 'Customer'}</p>
              </div>
              <Button 
                onClick={logout}
                className="bg-gradient-to-r from-ocean-primary to-ocean-secondary hover:from-ocean-primary-light hover:to-ocean-secondary-light text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 relative z-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-ocean-primary to-ocean-secondary bg-clip-text text-transparent">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">Manage your properties, bookings and payments</p>
      </div>

      {/* Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="glass-card hover-lift cursor-pointer transition-all hover:shadow-xl hover:scale-105" 
            onClick={() => {
              setActiveTab('bookings');
              setFilterStatus('active');
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                  <p className="text-3xl font-bold mt-2 text-ocean-primary">
                    {dashboardData.overview.active_bookings}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Total: {dashboardData.overview.total_bookings}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-ocean-primary to-ocean-secondary shadow-lg">
                  <Building className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-card hover-lift cursor-pointer transition-all hover:shadow-xl hover:scale-105"
            onClick={() => {
              console.log('Total Invested card clicked - navigating to properties tab');
              console.log('Properties data:', properties);
              setActiveTab('properties');
              setFilterStatus('all');
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invested</p>
                  <p className="text-3xl font-bold mt-2 text-ocean-secondary">
                    ₹{formatCurrency(dashboardData.overview.total_invested)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Portfolio Value</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-ocean-secondary to-ocean-accent shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-card hover-lift cursor-pointer transition-all hover:shadow-xl hover:scale-105"
            onClick={() => {
              console.log('Pending Payment card clicked - navigating to schedules tab (pending filter)');
              console.log('Payment Schedules data:', paymentSchedules);
              console.log('Dashboard pending amount:', dashboardData.overview.total_pending);
              setActiveTab('schedules');
              setFilterStatus('pending');
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                  <p className="text-3xl font-bold mt-2 text-yellow-600">
                    ₹{formatCurrency(dashboardData.overview.total_pending)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Paid: ₹{formatCurrency(dashboardData.overview.total_paid)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-card hover-lift cursor-pointer transition-all hover:shadow-xl hover:scale-105"
            onClick={() => {
              console.log('Overdue Amount card clicked - navigating to schedules tab');
              console.log('Payment Schedules data:', paymentSchedules);
              console.log('Dashboard overdue count:', dashboardData.overview.overdue_count);
              console.log('Dashboard overdue amount:', dashboardData.overview.overdue_amount);
              setActiveTab('schedules');
              setFilterStatus('overdue');
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                  <p className="text-3xl font-bold mt-2 text-red-600">
                    {dashboardData.overview.overdue_count}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {dashboardData.overview.overdue_count > 0 
                      ? `₹${formatCurrency(dashboardData.overview.overdue_amount)}` 
                      : 'No overdue'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass-tabs p-1 h-auto">
          <TabsTrigger value="overview" className="glass-tab">Overview</TabsTrigger>
          <TabsTrigger value="bookings" className="glass-tab">My Bookings</TabsTrigger>
          <TabsTrigger value="payments" className="glass-tab">Payments</TabsTrigger>
          <TabsTrigger value="properties" className="glass-tab">My Properties</TabsTrigger>
          <TabsTrigger value="schedules" className="glass-tab">Payment Schedule</TabsTrigger>
          <TabsTrigger value="resale" className="glass-tab">Resale Requests</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Upcoming Payments */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ocean-primary">
                <Calendar className="h-5 w-5" />
                Upcoming Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.upcoming_payments?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.upcoming_payments.map((schedule, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">₹{formatCurrency(schedule.amount)}</p>
                        <p className="text-sm text-gray-600">Due: {schedule.due_date}</p>
                      </div>
                      <Badge>{schedule.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming payments</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-ocean-primary">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.recent_payments?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recent_payments.map((payment, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">₹{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600">{payment.payment_date}</p>
                      </div>
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No payment history</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-ocean-primary">
                  My Bookings ({bookings.filter(b => filterStatus === 'all' || (filterStatus === 'active' && b.status !== 'cancelled')).length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </Button>
                  <Button 
                    variant={filterStatus === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('active')}
                  >
                    Active
                  </Button>
                  <Button 
                    variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('cancelled')}
                  >
                    Cancelled
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings
                  .filter(b => {
                    if (filterStatus === 'all') return true;
                    if (filterStatus === 'active') return b.status !== 'cancelled';
                    return b.status === filterStatus;
                  })
                  .map((booking) => (
                  <Card 
                    key={booking.id} 
                    className="border cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowBookingDetail(true);
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Property</p>
                          <p className="font-semibold">{booking.property?.property_number || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{booking.project?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="font-semibold">₹{formatCurrency(booking.total_amount)}</p>
                          <p className="text-sm text-gray-600">Paid: ₹{formatCurrency(booking.paid_amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge>{booking.status}</Badge>
                          <p className="text-sm text-gray-600 mt-1">{booking.booking_date}</p>
                        </div>
                      </div>
                      {booking.payment_schedules?.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Payment Schedule ({booking.payment_schedules.length} installments)</p>
                          <div className="flex gap-2 flex-wrap">
                            {booking.payment_schedules.slice(0, 3).map((schedule, idx) => (
                              <Badge key={idx} variant={schedule.status === 'paid' ? 'success' : 'secondary'}>
                                ₹{formatCurrency(schedule.amount)} - {schedule.due_date}
                              </Badge>
                            ))}
                            {booking.payment_schedules.length > 3 && (
                              <Badge variant="outline">+{booking.payment_schedules.length - 3} more</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {bookings.filter(b => {
                  if (filterStatus === 'all') return true;
                  if (filterStatus === 'active') return b.status !== 'cancelled';
                  return b.status === filterStatus;
                }).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No {filterStatus !== 'all' ? filterStatus : ''} bookings found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-ocean-primary">
                  Payment History ({payments.filter(p => filterStatus === 'all' || (filterStatus === 'pending' && p.status !== 'Success')).length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </Button>
                  <Button 
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={filterStatus === 'success' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('success')}
                  >
                    Success
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Property</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Mode</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments
                      .filter(p => {
                        if (filterStatus === 'all') return true;
                        if (filterStatus === 'pending') return p.status !== 'Success';
                        if (filterStatus === 'success') return p.status === 'Success';
                        return true;
                      })
                      .map((payment) => (
                      <tr key={payment.id} className="border-t">
                        <td className="px-4 py-3 text-sm">{payment.payment_date}</td>
                        <td className="px-4 py-3 font-medium">₹{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3 text-sm">{payment.property_number || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{payment.mode_id || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={payment.status === 'Success' ? 'success' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{payment.receipt_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.filter(p => {
                  if (filterStatus === 'all') return true;
                  if (filterStatus === 'pending') return p.status !== 'Success';
                  if (filterStatus === 'success') return p.status === 'Success';
                  return true;
                }).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No {filterStatus !== 'all' ? filterStatus : ''} payment history</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-ocean-primary">My Properties ({properties.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <Card key={property.id} className="border">
                    <CardContent className="pt-6">
                      <div className="mb-4">
                        <div className="bg-gray-200 h-32 rounded flex items-center justify-center">
                          <Home className="h-12 w-12 text-gray-400" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg">{property.property_number}</h3>
                      <p className="text-sm text-gray-600">{property.project?.name || 'N/A'}</p>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm"><span className="text-gray-600">Area:</span> {property.area} {property.unit}</p>
                        <p className="text-sm"><span className="text-gray-600">Price:</span> ₹{formatCurrency(property.price)}</p>
                        <p className="text-sm"><span className="text-gray-600">Payment:</span> {property.payment_status}</p>
                      </div>
                      {!property.booking_id ? (
                        <Button 
                          className="w-full mt-4 bg-gray-100 text-gray-500 border-gray-300" 
                          variant="outline"
                          disabled
                        >
                          No Booking Record
                        </Button>
                      ) : propertyResaleStatus[property.id]?.hasRequest ? (
                        <Button 
                          className="w-full mt-4 bg-green-100 text-green-700 hover:bg-green-200 border-green-300" 
                          variant="outline"
                          disabled
                        >
                          ✓ Request Submitted ({propertyResaleStatus[property.id]?.status})
                        </Button>
                      ) : (
                        <Button 
                          className="w-full mt-4" 
                          variant="outline"
                          onClick={() => {
                            console.log('Property selected for resale:', property);
                            console.log('Booking ID:', property.booking_id);
                            setSelectedProperty(property);
                            setShowResaleDialog(true);
                          }}
                        >
                          Request Resale
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {properties.length === 0 && (
                  <p className="text-gray-500 text-center py-8 col-span-3">No properties found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Schedule Tab */}
        <TabsContent value="schedules">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-ocean-primary">
                  Payment Schedule ({paymentSchedules.filter(s => filterStatus === 'all' || s.status === filterStatus).length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </Button>
                  <Button 
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('overdue')}
                  >
                    Overdue
                  </Button>
                  <Button 
                    variant={filterStatus === 'paid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('paid')}
                  >
                    Paid
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentSchedules
                  .filter(s => filterStatus === 'all' || s.status === filterStatus)
                  .map((schedule) => (
                  <div key={schedule.id} className="flex justify-between items-center p-4 border rounded">
                    <div className="flex-1">
                      <p className="font-medium">₹{schedule.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{schedule.property_number || 'Property'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{schedule.due_date}</p>
                      <Badge className="mt-1" variant={schedule.status === 'paid' ? 'success' : schedule.status === 'pending' ? 'secondary' : 'destructive'}>
                        {schedule.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {paymentSchedules.filter(s => filterStatus === 'all' || s.status === filterStatus).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No {filterStatus !== 'all' ? filterStatus : ''} payment schedules</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resale Requests Tab */}
        <TabsContent value="resale">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-ocean-primary">Resale Requests ({resaleRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resaleRequests.map((request) => (
                  <Card key={request.id} className="border">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Property</p>
                          <p className="font-semibold">{request.property?.property_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Asking Price</p>
                          <p className="font-semibold">₹{formatCurrency(request.asking_price)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge>{request.status}</Badge>
                        </div>
                      </div>
                      {request.reason && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">Reason:</p>
                          <p className="text-sm">{request.reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {resaleRequests.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No resale requests</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resale Request Dialog */}
      <Dialog open={showResaleDialog} onOpenChange={setShowResaleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Property Resale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Property</label>
              <Input value={selectedProperty?.property_number || ''} disabled />
            </div>
            <div>
              <label className="text-sm font-medium">Asking Price *</label>
              <Input
                type="number"
                value={resaleForm.asking_price}
                onChange={(e) => setResaleForm({ ...resaleForm, asking_price: e.target.value })}
                placeholder="Enter asking price"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Input
                value={resaleForm.reason}
                onChange={(e) => setResaleForm({ ...resaleForm, reason: e.target.value })}
                placeholder="Reason for resale"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Additional Notes (Optional)</label>
              <textarea
                value={resaleForm.notes}
                onChange={(e) => setResaleForm({ ...resaleForm, notes: e.target.value })}
                placeholder="Any additional information"
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>
            <Button 
              onClick={handleResaleRequest} 
              className="w-full bg-gradient-to-r from-ocean-primary to-ocean-secondary hover:from-ocean-primary-light hover:to-ocean-secondary-light text-white"
            >
              Submit Resale Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Dialog */}
      <Dialog open={showBookingDetail} onOpenChange={setShowBookingDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-ocean-primary">
              Booking Details
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Property & Project Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-ocean-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-ocean-primary">Property Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Number:</span>
                      <span className="font-semibold">{selectedBooking.property?.property_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project:</span>
                      <span className="font-semibold">{selectedBooking.project?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold">{selectedBooking.property?.property_type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Area:</span>
                      <span className="font-semibold">{selectedBooking.property?.area || 'N/A'} sq.ft</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-ocean-secondary/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-ocean-secondary">Booking Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="font-semibold">{selectedBooking.id?.slice(0, 8) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking Date:</span>
                      <span className="font-semibold">{selectedBooking.booking_date || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="capitalize">{selectedBooking.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Information */}
              <Card className="border-2 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">₹{formatCurrency(selectedBooking.total_amount)}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Amount Paid</p>
                      <p className="text-2xl font-bold text-green-600">₹{formatCurrency(selectedBooking.paid_amount)}</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Balance Due</p>
                      <p className="text-2xl font-bold text-yellow-600">₹{formatCurrency(selectedBooking.total_amount - selectedBooking.paid_amount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Schedule */}
              {selectedBooking.payment_schedules && selectedBooking.payment_schedules.length > 0 && (
                <Card className="border-2 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-600">
                      Payment Schedule ({selectedBooking.payment_schedules.length} Installments)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedBooking.payment_schedules.map((schedule, idx) => (
                        <div 
                          key={idx} 
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            schedule.status === 'paid' 
                              ? 'bg-green-50 border border-green-200' 
                              : schedule.status === 'overdue' 
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">Installment #{idx + 1}</p>
                            <p className="text-sm text-gray-600">Due: {schedule.due_date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₹{formatCurrency(schedule.amount)}</p>
                            <Badge variant={schedule.status === 'paid' ? 'success' : schedule.status === 'overdue' ? 'destructive' : 'secondary'}>
                              {schedule.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowBookingDetail(false)}
                >
                  Close
                </Button>
                <Button 
                  className="bg-gradient-to-r from-ocean-primary to-ocean-secondary text-white"
                  onClick={() => {
                    setShowBookingDetail(false);
                    setActiveTab('schedules');
                  }}
                >
                  View Payment Schedule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default CustomerDashboard;
