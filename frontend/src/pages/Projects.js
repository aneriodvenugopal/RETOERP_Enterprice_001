import React, { useState, useEffect } from 'react';
import { projectService, categoryService, currencyService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    tenant_id: user?.tenant_id || '',
    name: '',
    description: '',
    project_type: '',
    location: '',
    city: '',
    state: '',
    country: 'India',
    currency_id: '',
    price_per_unit: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchCurrencies();
    fetchPropertyTypes();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const data = await currencyService.getAll();
      setCurrencies(data);
      if (data.length > 0) {
        const inr = data.find(c => c.code === 'INR');
        setFormData(prev => ({ ...prev, currency_id: inr?.id || data[0].id }));
      }
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  };

  const fetchPropertyTypes = async () => {
    try {
      const data = await categoryService.getAll('property_type', user?.tenant_id);
      setPropertyTypes(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, project_type: data[0].slug }));
      }
    } catch (error) {
      console.error('Failed to load property types:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await projectService.create(formData);
      toast.success('Project created successfully!');
      setShowCreateDialog(false);
      fetchProjects();
      // Reset form
      setFormData({
        tenant_id: user?.tenant_id || '',
        name: '',
        description: '',
        project_type: propertyTypes[0]?.slug || '',
        location: '',
        city: '',
        state: '',
        country: 'India',
        currency_id: currencies.find(c => c.code === 'INR')?.id || currencies[0]?.id,
        price_per_unit: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading && projects.length === 0) {
    return <div className="p-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Projects</h2>
          <p className="text-gray-500">Manage your real estate projects</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Green Valley Residency"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Type *</label>
                  <Select
                    value={formData.project_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, project_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.id} value={type.slug}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the project"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location *</label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Near City Mall"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">City *</label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Hyderabad"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">State *</label>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Telangana"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <Select
                    value={formData.currency_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.id} value={curr.id}>
                          {curr.code} ({curr.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Base Price per Unit</label>
                <Input
                  name="price_per_unit"
                  type="number"
                  value={formData.price_per_unit}
                  onChange={handleInputChange}
                  placeholder="5000000"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">Create your first project to get started</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span>{project.name}</span>
                  <span className="text-xs font-normal px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {project.project_type}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {project.city}, {project.state}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="w-4 h-4 mr-2" />
                  {project.total_units} Units
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Available</div>
                    <div className="text-lg font-semibold text-green-600">{project.available_units}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Sold</div>
                    <div className="text-lg font-semibold text-blue-600">{project.sold_units}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Blocked</div>
                    <div className="text-lg font-semibold text-orange-600">{project.blocked_units}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
