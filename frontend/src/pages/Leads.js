import React, { useState, useEffect } from 'react';
import { leadService, categoryService, projectService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Phone, Mail, MapPin, Calendar, TrendingUp, Star, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import PageInfoModal from '../components/PageInfoModal';
import ClickableStatCard from '../components/ClickableStatCard';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetails, setLeadDetails] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // all, active, converted
  
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    tenant_id: user?.tenant_id || '',
    name: '',
    phone: '',
    email: '',
    source_id: '',
    status_id: '',
    project_id: '',
    budget_min: '',
    budget_max: '',
    notes: '',
    rating: 3,
  });

  const [followupData, setFollowupData] = useState({
    followup_type: 'call',
    notes: '',
    outcome: '',
    next_followup_date: '',
  });

  useEffect(() => {
    fetchLeads();
    fetchStats();
    fetchCategories();
    fetchProjects();
  }, []);

  // Filter leads when filter changes
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredLeads(leads);
    } else if (activeFilter === 'active') {
      setFilteredLeads(leads.filter(l => !l.is_converted));
    } else if (activeFilter === 'converted') {
      setFilteredLeads(leads.filter(l => l.is_converted));
    }
  }, [leads, activeFilter]);

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  const fetchLeads = async () => {
    try {
      const data = await leadService.getAll();
      setLeads(data);
    } catch (error) {
      toast.error('Failed to load leads');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await leadService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const [statuses, sources, types] = await Promise.all([
        categoryService.getAll('lead_status', user?.tenant_id),
        categoryService.getAll('lead_source', user?.tenant_id),
        categoryService.getAll('property_type', user?.tenant_id),
      ]);
      setLeadStatuses(statuses);
      setLeadSources(sources);
      setPropertyTypes(types);
      
      if (statuses.length > 0) {
        const newStatus = statuses.find(s => s.slug === 'new');
        setFormData(prev => ({ ...prev, status_id: newStatus?.id || statuses[0].id }));
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await leadService.create({
        ...formData,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      });
      toast.success('Lead created successfully!');
      setShowCreateDialog(false);
      fetchLeads();
      fetchStats();
      // Reset form
      setFormData(prev => ({
        ...prev,
        name: '',
        phone: '',
        email: '',
        project_id: '',
        budget_min: '',
        budget_max: '',
        notes: '',
        rating: 3,
      }));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  const handleViewLeadDetails = async (lead) => {
    setSelectedLead(lead);
    setShowDetailsDialog(true);
    try {
      const details = await leadService.getDetails(lead.id);
      setLeadDetails(details);
    } catch (error) {
      toast.error('Failed to load lead details');
      console.error(error);
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      await leadService.createFollowup({
        lead_id: selectedLead.id,
        followed_by: user.id,
        ...followupData,
        next_followup_date: followupData.next_followup_date || null,
      });
      toast.success('Follow-up added successfully!');
      setFollowupData({
        followup_type: 'call',
        notes: '',
        outcome: '',
        next_followup_date: '',
      });
      // Refresh lead details
      const details = await leadService.getDetails(selectedLead.id);
      setLeadDetails(details);
      fetchLeads();
    } catch (error) {
      toast.error('Failed to add follow-up');
      console.error(error);
    }
  };

  const getStatusColor = (statusId) => {
    const status = leadStatuses.find(s => s.id === statusId);
    const colors = {
      new: 'bg-blue-500',
      contacted: 'bg-yellow-500',
      interested: 'bg-green-500',
      'site-visit-scheduled': 'bg-purple-500',
      negotiation: 'bg-orange-500',
      converted: 'bg-gray-700',
      lost: 'bg-red-500',
    };
    return status ? colors[status.slug] || 'bg-gray-500' : 'bg-gray-500';
  };

  const getStatusBadge = (statusId) => {
    const status = leadStatuses.find(s => s.id === statusId);
    return status ? (
      <Badge className={getStatusColor(statusId)}>
        {status.name}
      </Badge>
    ) : null;
  };

  if (loading && leads.length === 0) {
    return <div className="p-8">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Leads</h2>
          <p className="text-gray-500">Manage your leads and follow-ups</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source</label>
                  <Select
                    value={formData.source_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, source_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interested Project</label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget Min</label>
                  <Input
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                    placeholder="5000000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget Max</label>
                  <Input
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                    placeholder="8000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lead Quality Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={formData.rating >= rating ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, rating }))}
                    >
                      <Star className={`w-4 h-4 ${formData.rating >= rating ? 'fill-current' : ''}`} />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Lead'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats - Clickable Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ClickableStatCard 
            title="Total Leads" 
            value={stats.total_leads} 
            icon={Users} 
            color="blue"
            onClick={() => handleFilterClick('all')}
            subtitle="Click to view all"
            className={activeFilter === 'all' ? 'ring-2 ring-blue-500' : ''}
          />
          <ClickableStatCard 
            title="Active Leads" 
            value={stats.active_leads} 
            icon={TrendingUp} 
            color="green"
            onClick={() => handleFilterClick('active')}
            subtitle="Click to filter"
            className={activeFilter === 'active' ? 'ring-2 ring-green-500' : ''}
          />
          <ClickableStatCard 
            title="Converted" 
            value={stats.converted_leads} 
            icon={Star} 
            color="purple"
            onClick={() => handleFilterClick('converted')}
            subtitle="Click to filter"
            className={activeFilter === 'converted' ? 'ring-2 ring-purple-500' : ''}
          />
          <ClickableStatCard 
            title="Conversion Rate" 
            value={`${stats.conversion_rate.toFixed(1)}%`} 
            icon={TrendingUp} 
            color="orange"
            subtitle="Overall performance"
          />
        </div>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {activeFilter === 'all' ? 'All Leads' : activeFilter === 'active' ? 'Active Leads' : 'Converted Leads'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'})
            </span>
          </CardTitle>
          {activeFilter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setActiveFilter('all')}>
              Clear Filter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {leads.length === 0 ? 'No leads yet' : 'No leads match filter'}
              </h3>
              <p className="text-gray-500 mb-4">
                {leads.length === 0 ? 'Start capturing leads to grow your business' : 'Try changing the filter above'}
              </p>
              {leads.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lead
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all duration-200 group"
                  onClick={() => handleViewLeadDetails(lead)}
                  data-testid={`lead-item-${lead.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                      {lead.name?.charAt(0)?.toUpperCase() || 'L'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {lead.name}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <a 
                          href={`tel:${lead.phone}`} 
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                        </a>
                        {lead.email && (
                          <a 
                            href={`mailto:${lead.email}`} 
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="w-3 h-3" />
                            {lead.email}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {lead.rating && (
                      <div className="flex gap-0.5">
                        {Array.from({ length: lead.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}
                    {getStatusBadge(lead.status_id)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLead?.name}</DialogTitle>
          </DialogHeader>
          {leadDetails && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="followups">
                  Follow-ups ({leadDetails.followups?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="add-followup">Add Follow-up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <div>{leadDetails.lead.phone}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div>{leadDetails.lead.email || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div>{leadDetails.status?.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Project Interest</label>
                    <div>{leadDetails.project?.name || 'N/A'}</div>
                  </div>
                  {leadDetails.lead.budget_min && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Budget Range</label>
                      <div>
                        ₹{(leadDetails.lead.budget_min / 100000).toFixed(1)}L - 
                        ₹{(leadDetails.lead.budget_max / 100000).toFixed(1)}L
                      </div>
                    </div>
                  )}
                  {leadDetails.assigned_user && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned To</label>
                      <div>{leadDetails.assigned_user.name}</div>
                    </div>
                  )}
                </div>
                {leadDetails.lead.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded">{leadDetails.lead.notes}</div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="followups" className="space-y-3">
                {leadDetails.followups?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No follow-ups yet</p>
                ) : (
                  leadDetails.followups?.map((followup) => (
                    <Card key={followup.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge>{followup.followup_type}</Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(followup.followup_date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{followup.notes}</p>
                        {followup.outcome && (
                          <div className="mt-2 text-xs text-gray-600">
                            Outcome: <span className="font-medium">{followup.outcome}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="add-followup">
                <form onSubmit={handleAddFollowup} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Follow-up Type *</label>
                    <Select
                      value={followupData.followup_type}
                      onValueChange={(value) => setFollowupData(prev => ({ ...prev, followup_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Phone Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="site_visit">Site Visit</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes *</label>
                    <Textarea
                      value={followupData.notes}
                      onChange={(e) => setFollowupData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Follow-up notes..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Outcome</label>
                    <Select
                      value={followupData.outcome}
                      onValueChange={(value) => setFollowupData(prev => ({ ...prev, outcome: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interested">Interested</SelectItem>
                        <SelectItem value="not_interested">Not Interested</SelectItem>
                        <SelectItem value="callback_later">Callback Later</SelectItem>
                        <SelectItem value="site_visit_scheduled">Site Visit Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Next Follow-up Date</label>
                    <Input
                      type="datetime-local"
                      value={followupData.next_followup_date}
                      onChange={(e) => setFollowupData(prev => ({ ...prev, next_followup_date: e.target.value }))}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Add Follow-up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Page Info Modal */}
      <PageInfoModal
        title="Leads Management"
        description="Comprehensive CRM system for capturing, tracking, and nurturing leads through your sales pipeline. Manage follow-ups, track lead quality, and convert prospects into customers with intelligent workflow automation."
        features={[
          "Create and manage leads with complete contact information",
          "Track lead sources (Walk-in, Website, Referral, Social Media, etc.)",
          "Lead status pipeline: New → Contacted → Interested → Site Visit → Negotiation → Converted/Lost",
          "Lead quality rating system (1-5 stars) for prioritization",
          "Budget range tracking for property matching",
          "Project interest association for targeted follow-ups",
          "Comprehensive follow-up management with multiple types (Call, Email, SMS, WhatsApp, Site Visit, Meeting)",
          "Follow-up history tracking with notes and outcomes",
          "Next follow-up date scheduling with reminders",
          "Real-time statistics: Total Leads, Active Leads, Converted, Conversion Rate",
          "Lead detail view with complete history and timeline",
          "Search and filter leads by status, source, or project"
        ]}
        technologies={[
          "React.js",
          "FastAPI Backend",
          "MongoDB",
          "Shadcn UI",
          "React Hook Form",
          "Lead Status Pipeline",
          "Follow-up System",
          "Analytics API"
        ]}
        implementations={[
          {
            title: "Lead Capture & Management",
            description: "Created comprehensive lead form with validation for name, phone (required), email, source, project interest, budget range (min/max), notes, and quality rating. Form uses Select components for dropdowns and star rating UI for quality assessment. All fields are properly validated before submission."
          },
          {
            title: "Follow-up Management System",
            description: "Built tabbed interface in lead details dialog: Details tab shows complete lead info, Follow-ups tab displays chronological history with badges and timestamps, Add Follow-up tab provides form for recording new interactions. Supports 6 follow-up types with outcome tracking and next follow-up scheduling."
          },
          {
            title: "Lead Status Pipeline",
            description: "Implemented 7-stage status pipeline with color-coded badges: New (blue), Contacted (yellow), Interested (green), Site Visit Scheduled (purple), Negotiation (orange), Converted (dark gray), Lost (red). Status updates tracked automatically through follow-up outcomes."
          },
          {
            title: "Statistics Dashboard",
            description: "Real-time KPI cards showing Total Leads, Active Leads (non-converted), Converted count, and Conversion Rate percentage. Data fetched from analytics API and updates automatically after lead actions. Color-coded stat cards with icons for visual clarity."
          },
          {
            title: "Lead Quality & Prioritization",
            description: "5-star rating system allows staff to mark lead quality/interest level. Star ratings displayed in lead list for quick visual scanning. Helps prioritize follow-up efforts on high-quality leads."
          }
        ]}
      />
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
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
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Leads;
