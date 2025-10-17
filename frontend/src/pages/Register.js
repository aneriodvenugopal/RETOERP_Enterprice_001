import React, { useState, useEffect } from 'react';
import { authService, tenantService } from '../services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    name: '',
    role_id: '',
    tenant_id: ''
  });
  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
    fetchTenants();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/auth/roles');
      setRoles(response.data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const fetchTenants = async () => {
    try {
      const data = await tenantService.getAll();
      setTenants(data || []);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      // Not critical, tenant selection might not be needed for super admin
    }
  };

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setFormData({ ...formData, role_id: roleId });
    
    // Find role to check if it's super admin
    const role = roles.find(r => r.id === roleId);
    if (role && role.slug === 'super_admin') {
      // Super admin doesn't need tenant
      setFormData({ ...formData, role_id: roleId, tenant_id: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number
      if (!/^[0-9]{10}$/.test(formData.phone)) {
        toast.error('Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }

      // Find selected role
      const role = roles.find(r => r.id === formData.role_id);
      
      // Validate tenant for non-super admin roles
      if (role && role.slug !== 'super_admin' && !formData.tenant_id) {
        toast.error('Please select a tenant organization');
        setLoading(false);
        return;
      }

      // Prepare registration data
      const registrationData = {
        phone: formData.phone,
        name: formData.name,
        email: formData.email || null,
        role_id: formData.role_id,
        tenant_id: role && role.slug === 'super_admin' ? null : formData.tenant_id
      };

      await authService.register(registrationData);
      toast.success('Registration successful! Please login with OTP.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = () => {
    const role = roles.find(r => r.id === formData.role_id);
    return role && role.slug === 'super_admin';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">RETOERP</CardTitle>
          <CardDescription className="text-center">
            Create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number *</label>
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                maxLength={10}
                pattern="[0-9]{10}"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email (Optional)</label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role *</label>
              <select
                value={formData.role_id}
                onChange={(e) => handleRoleChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {!isSuperAdmin() && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization (Tenant) *</label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  required={!isSuperAdmin()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Organization</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Login here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
