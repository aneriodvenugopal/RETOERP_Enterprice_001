import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, propertyService, categoryService } from '../services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Building2, Grid, List, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [propertyStatuses, setPropertyStatuses] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [formData, setFormData] = useState({
    project_id: projectId,
    property_number: '',
    property_type_id: '',
    area: '',
    price: '',
    status_id: '',
    facing: '',
    block: '',
    floor: '',
  });

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const [projectData, statsData, propertiesData] = await Promise.all([
        projectService.getById(projectId),
        projectService.getStats(projectId),
        propertyService.getAll(projectId),
      ]);
      setProject(projectData);
      setStats(statsData);
      setProperties(propertiesData);
      
      // Fetch categories
      const [types, statuses, curr] = await Promise.all([
        categoryService.getAll('property_type', projectData.tenant_id, projectId),
        categoryService.getAll('property_status', projectData.tenant_id, projectId),
        categoryService.getAll('', projectData.tenant_id),
      ]);
      setPropertyTypes(types);
      setPropertyStatuses(statuses);
      
      // Set default values
      if (types.length > 0) {
        setFormData(prev => ({ ...prev, property_type_id: types[0].id }));
      }
      if (statuses.length > 0) {
        const availableStatus = statuses.find(s => s.slug === 'available');
        setFormData(prev => ({ 
          ...prev, 
          status_id: availableStatus?.id || statuses[0].id,
          currency_id: projectData.currency_id,
          tenant_id: projectData.tenant_id
        }));
      }
    } catch (error) {
      toast.error('Failed to load project data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await propertyService.create({
        ...formData,
        area: parseFloat(formData.area),
        price: parseFloat(formData.price),
        floor: formData.floor ? parseInt(formData.floor) : null,
      });
      toast.success('Property created successfully!');
      setShowCreateDialog(false);
      fetchProjectData();
      // Reset form
      setFormData(prev => ({
        ...prev,
        property_number: '',
        area: '',
        price: '',
        facing: '',
        block: '',
        floor: '',
      }));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusSlug) => {
    const colors = {
      available: 'bg-green-500',
      blocked: 'bg-orange-500',
      booked: 'bg-blue-500',
      sold: 'bg-gray-500',
      resale: 'bg-purple-500',
    };
    return colors[statusSlug] || 'bg-gray-500';
  };

  const getStatusBadge = (statusId) => {
    const status = propertyStatuses.find(s => s.id === statusId);
    return status ? (
      <Badge className={getStatusColor(status.slug)}>
        {status.name}
      </Badge>
    ) : null;
  };

  if (loading && !project) {
    return <div className="p-8">Loading project...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold">{project?.name}</h2>
            <p className="text-gray-500">{project?.city}, {project?.state}</p>
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Number *</label>
                  <Input
                    value={formData.property_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, property_number: e.target.value }))}
                    placeholder="Plot 101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Type *</label>
                  <Select
                    value={formData.property_type_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, property_type_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Area (sq ft) *</label>
                  <Input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="1200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price *</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="5000000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Facing</label>
                  <Select
                    value={formData.facing}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, facing: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="North">North</SelectItem>
                      <SelectItem value="South">South</SelectItem>
                      <SelectItem value="East">East</SelectItem>
                      <SelectItem value="West">West</SelectItem>
                      <SelectItem value="North-East">North-East</SelectItem>
                      <SelectItem value="North-West">North-West</SelectItem>
                      <SelectItem value="South-East">South-East</SelectItem>
                      <SelectItem value="South-West">South-West</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Block</label>
                  <Input
                    value={formData.block}
                    onChange={(e) => setFormData(prev => ({ ...prev, block: e.target.value }))}
                    placeholder="A"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Floor</label>
                  <Input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Property'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Properties" value={stats?.total_properties || 0} color="blue" />
        <StatCard title="Available" value={stats?.available || 0} color="green" />
        <StatCard title="Sold" value={stats?.sold || 0} color="gray" />
        <StatCard title="Blocked" value={stats?.blocked || 0} color="orange" />
      </div>

      {/* Properties */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Properties</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
              <p className="text-gray-500 mb-4">Add properties to this project</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
              {properties.map((property) => (
                viewMode === 'grid' ? (
                  <Card key={property.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{property.property_number}</h4>
                        {getStatusBadge(property.status_id)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Area: {property.area} sq ft</div>
                        <div>Price: ₹{(property.price / 100000).toFixed(2)}L</div>
                        {property.facing && <div>Facing: {property.facing}</div>}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="font-semibold">{property.property_number}</div>
                      <div className="text-sm text-gray-600">{property.area} sq ft</div>
                      <div className="text-sm">₹{(property.price / 100000).toFixed(2)}L</div>
                      {property.facing && <div className="text-sm text-gray-600">{property.facing}</div>}
                    </div>
                    {getStatusBadge(property.status_id)}
                  </div>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    gray: 'bg-gray-500',
    orange: 'bg-orange-500',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`w-2 h-12 rounded ${colorClasses[color]}`}></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDetail;
