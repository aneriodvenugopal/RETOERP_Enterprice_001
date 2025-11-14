import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Search, CheckCircle, XCircle, Clock, 
  CreditCard, Wallet, FileText, Users, Calendar, Building2,
  Trash2, Edit2, Eye
} from 'lucide-react';
import apiInstance from '../../services/api';
import { toast } from 'sonner';

const CustomerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tenantId, setTenantId] = useState('');
  
  // Dropdown data
  const [bookings, setBookings] = useState([]);
  const [paymentSchemes, setPaymentSchemes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    tenant_id: '',
    booking_ids: [],
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    amount: '',
    currency_id: 'INR',
    payment_method: 'manual',
    payment_mode: 'neft',
    transaction_id: '',
    reference_number: '',
    bank_name: '',
    cheque_date: '',
    payment_screenshot_url: '',
    allocation: {}, // {booking_id: amount}
    notes: ''
  });

  useEffect(() => {
    initializeComponent();
  }, []);

  useEffect(() => {
    if (tenantId) {
      fetchPayments();
    }
  }, [filterStatus, tenantId]);

  const initializeComponent = async () => {
    try {
      // Get current user and tenant info
      const userResponse = await apiInstance.get('/user/me');
      const user = userResponse.data;
      const currentTenantId = user.tenant_id || localStorage.getItem('tenant_id');
      
      if (!currentTenantId) {
        toast.error('Tenant information not found');
        return;
      }
      
      setTenantId(currentTenantId);
      setFormData(prev => ({ ...prev, tenant_id: currentTenantId }));
      
      // Fetch reference data in parallel
      await Promise.all([
        fetchPaymentSchemes(currentTenantId),
        fetchCurrencies(),
        fetchBookings(currentTenantId)
      ]);
      
    } catch (error) {
      console.error('Error initializing:', error);
      toast.error('Failed to initialize payment module');
    }
  };

  const fetchBookings = async (tid) => {
    try {
      const response = await apiInstance.get('/bookings', {
        params: { 
          tenant_id: tid,
          status: 'confirmed', // Only show confirmed bookings
          limit: 500
        }
      });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    }
  };

  const fetchPaymentSchemes = async (tid) => {
    try {
      const response = await apiInstance.get('/schemes', {
        params: { tenant_id: tid }
      });
      setPaymentSchemes(response.data.schemes || []);
    } catch (error) {
      console.error('Error fetching payment schemes:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await apiInstance.get('/currencies');
      setCurrencies(response.data.currencies || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
      // Set default currencies
      setCurrencies([
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' }
      ]);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { tenant_id: tenantId, limit: 100 };
      if (filterStatus !== 'all') params.status = filterStatus;
      
      const response = await apiInstance.get('/payments', { params });
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.booking_ids.length === 0) {
      toast.error('Please select at least one booking');
      return;
    }
    
    if (!formData.customer_id) {
      toast.error('Please select a customer/booking');
      return;
    }
    
    setLoading(true);

    try {
      let payload;
      
      if (formData.payment_method === 'razorpay') {
        // Create Razorpay order
        payload = {
          tenant_id: formData.tenant_id,
          booking_ids: formData.booking_ids,
          customer_id: formData.customer_id,
          amount: parseFloat(formData.amount),
          currency: formData.currency_id,
          notes: formData.notes
        };
        
        const orderResponse = await apiInstance.post('/razorpay/create-order', payload);
        
        if (orderResponse.data.success) {
          // Initialize Razorpay checkout
          const options = {
            key: orderResponse.data.key_id,
            amount: orderResponse.data.amount * 100, // Amount in paise
            currency: orderResponse.data.currency,
            name: 'RETOERP',
            description: 'Property Payment',
            order_id: orderResponse.data.order_id,
            handler: async function (response) {
              // Verify payment
              await verifyRazorpayPayment(response, orderResponse.data.payment_id);
            },
            prefill: {
              name: formData.customer_name,
              email: formData.customer_email,
              contact: formData.customer_phone
            },
            theme: {
              color: '#2563eb'
            }
          };
          
          const razorpay = new window.Razorpay(options);
          razorpay.open();
          setShowModal(false);
        }
      } else {
        // Manual payment entry
        payload = {
          tenant_id: formData.tenant_id,
          booking_ids: formData.booking_ids,
          customer_id: formData.customer_id,
          amount: parseFloat(formData.amount),
          currency_id: formData.currency_id,
          payment_method: formData.payment_method,
          payment_mode: formData.payment_mode,
          transaction_id: formData.transaction_id || null,
          reference_number: formData.reference_number || null,
          bank_name: formData.bank_name || null,
          cheque_date: formData.cheque_date || null,
          payment_screenshot_url: formData.payment_screenshot_url || null,
          allocation: formData.allocation,
          notes: formData.notes || null
        };
        
        const response = await apiInstance.post('/manual', payload);
        
        if (response.data.success) {
          toast.success(`Payment recorded successfully! Receipt: ${response.data.receipt_number}`);
          setShowModal(false);
          resetForm();
          fetchPayments();
        }
      }
      
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };
  
  const verifyRazorpayPayment = async (razorpayResponse, paymentId) => {
    try {
      const verifyPayload = {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature
      };
      
      const response = await apiInstance.post('/razorpay/verify', verifyPayload);
      
      if (response.data.success) {
        toast.success('Payment verified successfully! Commissions calculated automatically.');
        resetForm();
        fetchPayments();
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      toast.error('Payment verification failed. Please contact support.');
    }
  };

  const resetForm = () => {
    setFormData({
      tenant_id: tenantId,
      booking_ids: [],
      customer_id: '',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      amount: '',
      currency_id: 'INR',
      payment_method: 'manual',
      payment_mode: 'neft',
      transaction_id: '',
      reference_number: '',
      bank_name: '',
      cheque_date: '',
      payment_screenshot_url: '',
      allocation: {},
      notes: ''
    });
  };
  
  const handleBookingSelection = (bookingId) => {
    const selected = bookings.find(b => b.id === bookingId);
    if (!selected) return;
    
    // Update form data with booking info
    setFormData(prev => ({
      ...prev,
      booking_ids: [bookingId],
      customer_id: selected.customer_id,
      customer_name: selected.customer_name,
      customer_phone: selected.customer_phone,
      customer_email: selected.customer_email,
      amount: (selected.balance_amount || 0).toString(),
      allocation: { [bookingId]: selected.balance_amount || 0 }
    }));
  };
  
  const getPaymentModeIcon = (mode) => {
    const icons = {
      'razorpay': <CreditCard size={16} />,
      'upi': <Wallet size={16} />,
      'card': <CreditCard size={16} />,
      'netbanking': <Building2 size={16} />,
      'neft': <FileText size={16} />,
      'rtgs': <FileText size={16} />,
      'imps': <Wallet size={16} />,
      'cheque': <FileText size={16} />,
      'dd': <FileText size={16} />,
      'cash': <DollarSign size={16} />
    };
    return icons[mode?.toLowerCase()] || <FileText size={16} />;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
      completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
      failed: { color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {status}
      </span>
    );
  };

  const filteredPayments = payments.filter(payment =>
    payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customer_phone?.includes(searchTerm) ||
    payment.transaction_reference?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <DollarSign className="text-blue-600" size={36} />
                Customer Payments
              </h1>
              <p className="text-gray-600 mt-2">Record and manage customer payments</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus size={20} />
              Record Payment
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by customer name, phone, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'completed', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{payment.customer_name}</div>
                        <div className="text-sm text-gray-500">{payment.customer_phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          ₹{payment.amount?.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.payment_method}</div>
                        {payment.payment_mode && (
                          <div className="text-xs text-gray-500">{payment.payment_mode}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.transaction_reference || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.commission_calculated ? (
                          <span className="text-green-600 font-medium">✓ Calculated</span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Record Customer Payment</h2>
              <p className="text-gray-600 mt-1">Commission will be calculated automatically</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="10-digit mobile"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode *
                  </label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="IMPS">IMPS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  value={formData.transaction_reference}
                  onChange={(e) => setFormData({...formData, transaction_reference: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="UTR/Cheque/Reference number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPayments;
