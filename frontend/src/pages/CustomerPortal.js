import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import {
  Home, CreditCard, Calendar, FileText, Download, LogOut,
  Building2, MapPin, Phone, Mail, Wallet, AlertCircle,
  CheckCircle, Clock, ArrowRight, Loader2, Shield, Eye, EyeOff,
  ChevronRight, User, IndianRupee, FileDown, History
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Session management
const getSession = () => {
  try {
    const session = localStorage.getItem('customerPortalSession');
    if (!session) return null;
    const parsed = JSON.parse(session);
    if (new Date(parsed.expires_at) < new Date()) {
      localStorage.removeItem('customerPortalSession');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const saveSession = (session) => {
  localStorage.setItem('customerPortalSession', JSON.stringify(session));
};

const clearSession = () => {
  localStorage.removeItem('customerPortalSession');
};

// Format currency
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// Login Component
const LoginForm = ({ onLoginSuccess }) => {
  const [step, setStep] = useState('phone'); // phone, otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState(null);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone.trim() || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/customer-portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send OTP');
      }

      toast.success('OTP sent to your phone');
      setStep('otp');
      
      // In mock mode, show OTP
      if (data.mock_mode && data.mock_otp) {
        setMockOtp(data.mock_otp);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/customer-portal/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid OTP');
      }

      // Save session
      saveSession({
        session_id: data.session_id,
        customer: data.customer,
        expires_at: data.expires_at
      });

      toast.success(`Welcome, ${data.customer.name}!`);
      onLoginSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">Customer Portal</CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              Access your property details, payments & documents
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your registered phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-11 h-12 text-lg"
                    maxLength={10}
                    data-testid="phone-input"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Enter the phone number registered with your property booking
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={loading}
                data-testid="send-otp-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send OTP <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-sm text-slate-600">
                  OTP sent to <span className="font-medium">******{phone.slice(-4)}</span>
                </p>
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); setMockOtp(null); }}
                  className="text-blue-600 text-sm hover:underline mt-1"
                >
                  Change number
                </button>
              </div>

              {mockOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-700 font-medium">MOCK MODE - Your OTP</p>
                  <p className="text-2xl font-bold text-amber-900 tracking-widest">{mockOtp}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium text-slate-700">
                  Enter OTP
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  data-testid="otp-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={loading}
                data-testid="verify-otp-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" /> Verify & Login
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleSendOTP}
                className="w-full text-sm text-slate-500 hover:text-blue-600"
                disabled={loading}
              >
                Didn't receive OTP? Resend
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ session, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [downloadingDoc, setDownloadingDoc] = useState(null);

  const headers = {
    'X-Portal-Session': session.session_id,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadDashboard(),
      loadProperties(),
      loadPayments(),
      loadDocuments(),
      loadPaymentSchedule()
    ]);
    setLoading(false);
  };

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customer-portal/dashboard`, { headers });
      if (!res.ok) throw new Error('Failed to load dashboard');
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Dashboard error:', error);
    }
  };

  const loadProperties = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customer-portal/properties`, { headers });
      if (!res.ok) throw new Error('Failed to load properties');
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Properties error:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customer-portal/payments`, { headers });
      if (!res.ok) throw new Error('Failed to load payments');
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Payments error:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customer-portal/documents`, { headers });
      if (!res.ok) throw new Error('Failed to load documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Documents error:', error);
    }
  };

  const loadPaymentSchedule = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customer-portal/payment-schedule`, { headers });
      if (!res.ok) throw new Error('Failed to load payment schedule');
      const data = await res.json();
      setPaymentSchedule(data.schedules || []);
    } catch (error) {
      console.error('Payment schedule error:', error);
    }
  };

  const handleDownload = async (doc) => {
    setDownloadingDoc(doc.download_url);
    try {
      const res = await fetch(`${API_URL}${doc.download_url}`, {
        headers: { 'X-Portal-Session': session.session_id }
      });
      
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Document downloaded');
    } catch (error) {
      toast.error('Failed to download document');
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/customer-portal/logout`, {
        method: 'POST',
        headers
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    clearSession();
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const overview = dashboardData?.overview || {};
  const customer = dashboardData?.customer || session.customer;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="customer-portal-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">Customer Portal</h1>
                <p className="text-xs text-slate-500">Welcome, {customer?.name}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs">Properties</p>
                  <p className="text-2xl font-bold">{overview.total_properties || 0}</p>
                </div>
                <Home className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs">Total Paid</p>
                  <p className="text-xl font-bold">{formatCurrency(overview.total_paid)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs">Pending</p>
                  <p className="text-xl font-bold">{formatCurrency(overview.total_pending)}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className={`text-white border-0 ${overview.overdue_count > 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-xs">Overdue</p>
                  <p className="text-xl font-bold">{formatCurrency(overview.overdue_amount)}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50">
              <Home className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="properties" className="data-[state=active]:bg-blue-50">
              <Building2 className="w-4 h-4 mr-2" /> Properties ({properties.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-blue-50">
              <CreditCard className="w-4 h-4 mr-2" /> Payments
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-blue-50">
              <FileText className="w-4 h-4 mr-2" /> Documents
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upcoming Payments */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Upcoming Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.upcoming_payments?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.upcoming_payments.slice(0, 5).map((payment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm text-slate-900">
                              {payment.installment_name || `EMI ${payment.installment_number}`}
                            </p>
                            <p className="text-xs text-slate-500">Due: {formatDate(payment.due_date)}</p>
                          </div>
                          <Badge variant="outline" className="font-semibold">
                            {formatCurrency(payment.remaining_amount || payment.due_amount)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-6">No upcoming payments</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-600" />
                    Recent Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.recent_payments?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recent_payments.slice(0, 5).map((payment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm text-slate-900">
                              {payment.description || 'Payment'}
                            </p>
                            <p className="text-xs text-slate-500">{formatDate(payment.payment_date)}</p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700">
                            {formatCurrency(payment.amount)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-6">No recent payments</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('properties')}
                  >
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="text-xs">View Properties</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('payments')}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">Payment History</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('documents')}
                  >
                    <FileDown className="w-5 h-5 text-purple-600" />
                    <span className="text-xs">Download Documents</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={loadAllData}
                  >
                    <Loader2 className="w-5 h-5 text-slate-600" />
                    <span className="text-xs">Refresh Data</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <div className="space-y-4">
              {properties.length > 0 ? (
                properties.map((property) => (
                  <Card key={property.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Property Image Placeholder */}
                        <div className="md:w-48 h-32 md:h-auto bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <Building2 className="w-12 h-12 text-blue-300" />
                        </div>
                        
                        {/* Property Details */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-lg text-slate-900">
                                Plot {property.property_number}
                              </h3>
                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {property.project?.name || 'N/A'} • Block {property.block || '-'}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                              {property.area} sq.ft
                            </Badge>
                          </div>
                          
                          {/* Payment Progress */}
                          {property.booking && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Payment Progress</span>
                                <span className="font-medium">
                                  {formatCurrency(property.booking.paid_amount)} / {formatCurrency(property.booking.total_amount)}
                                </span>
                              </div>
                              <Progress 
                                value={(property.booking.paid_amount / property.booking.total_amount) * 100} 
                                className="h-2"
                              />
                              <div className="flex justify-between text-xs text-slate-500">
                                <span>Paid: {formatCurrency(property.booking.paid_amount)}</span>
                                <span>Pending: {formatCurrency(property.booking.pending_amount)}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 flex gap-2">
                            <Badge variant="outline">{property.facing || 'N/A'} Facing</Badge>
                            <Badge variant="outline">{formatCurrency(property.price)}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No properties found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="space-y-6">
              {/* Payment Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Payment Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentSchedule.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium text-slate-600">Installment</th>
                            <th className="text-left py-2 font-medium text-slate-600">Property</th>
                            <th className="text-left py-2 font-medium text-slate-600">Due Date</th>
                            <th className="text-right py-2 font-medium text-slate-600">Amount</th>
                            <th className="text-center py-2 font-medium text-slate-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentSchedule.map((schedule, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="py-3">{schedule.installment_name || `EMI ${schedule.installment_number}`}</td>
                              <td className="py-3">{schedule.property_number || '-'}</td>
                              <td className="py-3">{formatDate(schedule.due_date)}</td>
                              <td className="py-3 text-right font-medium">
                                {formatCurrency(schedule.remaining_amount || schedule.due_amount)}
                              </td>
                              <td className="py-3 text-center">
                                <Badge className={
                                  schedule.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                  schedule.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                  'bg-amber-100 text-amber-700'
                                }>
                                  {schedule.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-6">No payment schedule found</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-600" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((payment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-slate-900">
                                {payment.description || 'Payment Received'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDate(payment.payment_date)} • {payment.payment_mode || 'Cash'}
                                {payment.property_number && ` • Plot ${payment.property_number}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-slate-500">#{payment.receipt_number || payment.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-6">No payment history</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Available Documents
                </CardTitle>
                <CardDescription>
                  Download your property documents, receipts, and certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            doc.type === 'payment_receipt' ? 'bg-emerald-100' :
                            doc.type === 'booking_confirmation' ? 'bg-blue-100' :
                            doc.type === 'allotment_letter' ? 'bg-purple-100' :
                            'bg-amber-100'
                          }`}>
                            <FileText className={`w-5 h-5 ${
                              doc.type === 'payment_receipt' ? 'text-emerald-600' :
                              doc.type === 'booking_confirmation' ? 'text-blue-600' :
                              doc.type === 'allotment_letter' ? 'text-purple-600' :
                              'text-amber-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{doc.title}</p>
                            <p className="text-xs text-slate-500">{doc.description}</p>
                            {doc.property_number && (
                              <p className="text-xs text-blue-600">Plot {doc.property_number}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingDoc === doc.download_url}
                          data-testid={`download-${doc.type}`}
                        >
                          {downloadingDoc === doc.download_url ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No documents available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Main Component
const CustomerPortal = () => {
  const [session, setSession] = useState(getSession());

  const handleLoginSuccess = () => {
    setSession(getSession());
  };

  const handleLogout = () => {
    setSession(null);
  };

  if (!session) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard session={session} onLogout={handleLogout} />;
};

export default CustomerPortal;
