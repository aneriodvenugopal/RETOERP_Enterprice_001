import api from './api';

export const authService = {
  // Send OTP to phone
  sendOTP: async (phone) => {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
  },

  // Verify OTP and login
  verifyOTP: async (phone, otp) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Get all roles
  getRoles: async () => {
    const response = await api.get('/auth/roles');
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
};

export const currencyService = {
  // Get all currencies
  getAll: async () => {
    const response = await api.get('/currencies/');
    return response.data;
  },

  // Convert currency
  convert: async (amount, from, to) => {
    const response = await api.get('/currencies/convert', {
      params: { amount, from_currency: from, to_currency: to },
    });
    return response.data;
  },
};

export const categoryService = {
  // Get categories
  getAll: async (type, tenantId, projectId) => {
    const response = await api.get('/categories/', {
      params: { type, tenant_id: tenantId, project_id: projectId },
    });
    return response.data;
  },

  // Create category
  create: async (categoryData) => {
    const response = await api.post('/categories/', categoryData);
    return response.data;
  },
};

export const tenantService = {
  // Get all tenants
  getAll: async () => {
    const response = await api.get('/tenants/');
    return response.data;
  },

  // Get tenant by ID
  getById: async (id) => {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  // Create tenant
  create: async (tenantData) => {
    const response = await api.post('/tenants/', tenantData);
    return response.data;
  },

  // Get packages
  getPackages: async () => {
    const response = await api.get('/tenants/packages/');
    return response.data;
  },
};

export const projectService = {
  // Get all projects
  getAll: async (tenantId, status) => {
    const response = await api.get('/projects/', {
      params: { tenant_id: tenantId, status },
    });
    return response.data;
  },

  // Get project by ID
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Get project stats
  getStats: async (id) => {
    const response = await api.get(`/projects/${id}/stats`);
    return response.data;
  },

  // Create project
  create: async (projectData) => {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },

  // Update project
  update: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project
  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};

export const propertyService = {
  // Get all properties
  getAll: async (projectId, statusId, propertyTypeId) => {
    const response = await api.get('/properties/', {
      params: {
        project_id: projectId,
        status_id: statusId,
        property_type_id: propertyTypeId,
      },
    });
    return response.data;
  },

  // Get property by ID
  getById: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  // Create property
  create: async (propertyData) => {
    const response = await api.post('/properties/', propertyData);
    return response.data;
  },

  // Update property
  update: async (id, propertyData) => {
    const response = await api.put(`/properties/${id}`, propertyData);
    return response.data;
  },

  // Block property
  block: async (propertyId, userId, durationHours = 24) => {
    const response = await api.post('/properties/block', {
      property_id: propertyId,
      user_id: userId,
      duration_hours: durationHours,
    });
    return response.data;
  },

  // Book property
  book: async (propertyId, customerId) => {
    const response = await api.post('/properties/book', {
      property_id: propertyId,
      customer_id: customerId,
    });
    return response.data;
  },

  // Delete property
  delete: async (id) => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },
};

export const leadService = {
  // Get all leads
  getAll: async (params = {}) => {
    const response = await api.get('/leads/', { params });
    return response.data;
  },

  // Get lead by ID
  getById: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  // Get lead details (with relations)
  getDetails: async (id) => {
    const response = await api.get(`/leads/${id}/details`);
    return response.data;
  },

  // Create lead
  create: async (leadData) => {
    const response = await api.post('/leads/', leadData);
    return response.data;
  },

  // Update lead
  update: async (id, leadData) => {
    const response = await api.put(`/leads/${id}`, leadData);
    return response.data;
  },

  // Delete lead
  delete: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },

  // Get lead follow-ups
  getFollowups: async (leadId) => {
    const response = await api.get(`/leads/${leadId}/followups`);
    return response.data;
  },

  // Create follow-up
  createFollowup: async (followupData) => {
    const response = await api.post('/leads/followups', followupData);
    return response.data;
  },

  // Convert lead to customer
  convert: async (leadId, customerData) => {
    const response = await api.post('/leads/convert', {
      lead_id: leadId,
      ...customerData,
    });
    return response.data;
  },

  // Get lead stats
  getStats: async (tenantId, projectId) => {
    const response = await api.get('/leads/stats/summary', {
      params: { tenant_id: tenantId, project_id: projectId },
    });
    return response.data;
  },
};

export const bookingService = {
  // Get all bookings
  getAll: async (params = {}) => {
    const response = await api.get('/bookings/', { params });
    return response.data;
  },

  // Get booking by ID
  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  // Get booking details (with payments & schedules)
  getDetails: async (id) => {
    const response = await api.get(`/bookings/${id}/details`);
    return response.data;
  },

  // Create booking
  create: async (bookingData) => {
    const response = await api.post('/bookings/', bookingData);
    return response.data;
  },

  // Get payments for booking
  getPayments: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}/payments`);
    return response.data;
  },

  // Create payment
  createPayment: async (bookingId, paymentData) => {
    const response = await api.post(`/bookings/${bookingId}/payments`, paymentData);
    return response.data;
  },

  // Get payment schedules
  getSchedules: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}/schedules`);
    return response.data;
  },
};

export const commissionService = {
  // Get all commissions
  getAll: async (params = {}) => {
    const response = await api.get('/commissions/', { params });
    return response.data;
  },

  // Get commission by ID
  getById: async (id) => {
    const response = await api.get(`/commissions/${id}`);
    return response.data;
  },

  // Create commission
  create: async (commissionData) => {
    const response = await api.post('/commissions/', commissionData);
    return response.data;
  },

  // Approve commission
  approve: async (id) => {
    const response = await api.post(`/commissions/${id}/approve`);
    return response.data;
  },

  // Payout commission
  payout: async (id, payoutData) => {
    const response = await api.post(`/commissions/${id}/payout`, payoutData);
    return response.data;
  },

  // Get commission stats
  getStats: async (tenantId, projectId, staffId) => {
    const response = await api.get('/commissions/stats/summary', {
      params: { tenant_id: tenantId, project_id: projectId, staff_id: staffId },
    });
    return response.data;
  },

  // Commission Rules
  getRules: async (tenantId, projectId) => {
    const response = await api.get('/commissions/rules', {
      params: { tenant_id: tenantId, project_id: projectId },
    });
    return response.data;
  },

  createRule: async (ruleData) => {
    const response = await api.post('/commissions/rules', ruleData);
    return response.data;
  },
};

export const analyticsService = {
  // Get dashboard analytics
  getDashboard: async (tenantId, startDate, endDate) => {
    const response = await api.get('/analytics/dashboard', {
      params: {
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },

  // Get lead analytics
  getLeads: async (tenantId, projectId, startDate, endDate) => {
    const response = await api.get('/analytics/leads', {
      params: {
        tenant_id: tenantId,
        project_id: projectId,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },

  // Get sales analytics
  getSales: async (tenantId, startDate, endDate) => {
    const response = await api.get('/analytics/sales', {
      params: {
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },

  // Get payment analytics
  getPayments: async (tenantId, startDate, endDate) => {
    const response = await api.get('/analytics/payments', {
      params: {
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },

  // Get commission analytics
  getCommissions: async (tenantId, staffId, startDate, endDate) => {
    const response = await api.get('/analytics/commissions', {
      params: {
        tenant_id: tenantId,
        staff_id: staffId,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
};

export const userService = {
  // Get all users
  getAll: async (params = {}) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },

  // Get user by ID
  getById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Create user
  create: async (userData) => {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  // Update user
  update: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Deactivate user
  deactivate: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Activate user
  activate: async (userId) => {
    const response = await api.post(`/users/${userId}/activate`);
    return response.data;
  },

  // Get user performance
  getPerformance: async (userId) => {
    const response = await api.get(`/users/${userId}/performance`);
    return response.data;
  },

  // Get user stats
  getStats: async (tenantId) => {
    const response = await api.get('/users/stats/overview', {
      params: { tenant_id: tenantId },
    });
    return response.data;
  },
};

export const customerService = {
  // Get customer dashboard
  getDashboard: async () => {
    const response = await api.get('/customer/dashboard');
    return response.data;
  },

  // Get customer bookings
  getBookings: async () => {
    const response = await api.get('/customer/bookings');
    return response.data;
  },

  // Get booking detail
  getBookingDetail: async (bookingId) => {
    const response = await api.get(`/customer/bookings/${bookingId}`);
    return response.data;
  },

  // Get customer payments
  getPayments: async () => {
    const response = await api.get('/customer/payments');
    return response.data;
  },

  // Get payment schedules
  getPaymentSchedules: async (status = null) => {
    const response = await api.get('/customer/payment-schedules', {
      params: { status },
    });
    return response.data;
  },

  // Get customer properties
  getProperties: async () => {
    const response = await api.get('/customer/properties');
    return response.data;
  },

  // Create resale request
  createResaleRequest: async (resaleData) => {
    const response = await api.post('/customer/resale-request', resaleData);
    return response.data;
  },

  // Get resale requests
  getResaleRequests: async () => {
    const response = await api.get('/customer/resale-requests');
    return response.data;
  },
};


// Layout Service
export const layoutService = {
  // Create or update project layout
  createLayout: async (projectId, layoutData) => {
    const response = await api.post(`/layouts/projects/${projectId}/layout`, layoutData);
    return response.data;
  },

  // Get project layout (authenticated)
  getLayout: async (projectId) => {
    const response = await api.get(`/layouts/projects/${projectId}/layout`);
    return response.data;
  },

  // Get public project layout (no auth)
  getPublicLayout: async (projectId) => {
    const response = await api.get(`/layouts/public/projects/${projectId}/layout`);
    return response.data;
  },

  // Update plot status
  updatePlotStatus: async (projectId, plotId, statusData) => {
    const response = await api.patch(`/layouts/projects/${projectId}/layout/plots/${plotId}`, statusData);
    return response.data;
  },

  // Delete layout
  deleteLayout: async (projectId) => {
    const response = await api.delete(`/layouts/projects/${projectId}/layout`);
    return response.data;
  },

  // Get layout summary
  getLayoutSummary: async (projectId) => {
    const response = await api.get(`/layouts/projects/${projectId}/layout/summary`);
    return response.data;
  },
  
  // === NEW LAYOUT LIBRARY FUNCTIONS ===
  
  // Upload SVG file
  uploadSVG: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/layouts/upload-svg', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Create master layout
  createMasterLayout: async (layoutData) => {
    const response = await api.post('/layouts', layoutData);
    return response.data;
  },

  // Get all master layouts
  getMasterLayouts: async (layoutType = null, includeTemplates = true) => {
    const params = { include_templates: includeTemplates };
    if (layoutType) params.layout_type = layoutType;
    const response = await api.get('/layouts', { params });
    return response.data;
  },

  // Get single master layout
  getMasterLayout: async (layoutId) => {
    const response = await api.get(`/layouts/${layoutId}`);
    return response.data;
  },

  // Update master layout
  updateMasterLayout: async (layoutId, layoutData) => {
    const response = await api.put(`/layouts/${layoutId}`, layoutData);
    return response.data;
  },

  // Delete master layout
  deleteMasterLayout: async (layoutId) => {
    const response = await api.delete(`/layouts/${layoutId}`);
    return response.data;
  },

  // Assign layout to project
  assignLayoutToProject: async (projectId, layoutId, customPlots = null) => {
    const response = await api.post(`/layouts/projects/${projectId}/assign`, {
      layout_id: layoutId,
      custom_plots: customPlots,
    });
    return response.data;
  },

  // Get layout stats
  getLayoutStats: async () => {
    const response = await api.get('/layouts/stats');
    return response.data;
  },
};