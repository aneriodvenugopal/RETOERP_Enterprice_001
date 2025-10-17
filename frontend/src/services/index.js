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
