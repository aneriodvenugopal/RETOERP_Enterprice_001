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

