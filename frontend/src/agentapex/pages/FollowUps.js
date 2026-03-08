import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import { 
  ArrowLeft, Plus, Phone, MessageSquare, Calendar, User, 
  Clock, X, Check, ChevronRight, ThumbsUp, ThumbsDown, 
  RefreshCw, Bell, StickyNote, MapPin, Contact, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { id: 'interested', label: 'Interested', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'not_interested', label: 'Not Interested', icon: ThumbsDown, color: 'text-red-600', bg: 'bg-red-100' },
  { id: 'reschedule', label: 'Reschedule', icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-100' },
  { id: 'followup_again', label: 'Follow-up Again', icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100' },
];

const FollowUps = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showHistory, setShowHistory] = useState(null);
  const [showAddNote, setShowAddNote] = useState(null);
  const [newContact, setNewContact] = useState({ 
    contact_name: '', 
    contact_phone: '', 
    notes: '',
    location: ''
  });
  const [newNote, setNewNote] = useState({
    status: '',
    feedback: '',
    next_date: '',
    next_time: ''
  });

  useEffect(() => { fetchFollowups(); }, []);

  const fetchFollowups = async () => {
    try {
      const res = await api().get('/followups');
      // Group by contact and sort by latest follow-up
      const grouped = {};
      res.data.forEach(f => {
        const key = f.contact_phone;
        if (!grouped[key]) {
          grouped[key] = {
            ...f,
            history: []
          };
        }
        if (f.status && f.status !== 'pending') {
          grouped[key].history.push({
            status: f.status,
            notes: f.notes,
            date: f.updated_at || f.created_at,
            next_follow_up: f.next_follow_up
          });
        }
      });
      
      // Sort contacts by latest activity
      const contactList = Object.values(grouped).sort((a, b) => {
        const aDate = a.next_follow_up || a.created_at;
        const bDate = b.next_follow_up || b.created_at;
        return new Date(bDate) - new Date(aDate);
      });
      
      setContacts(contactList);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      const res = await api().post('/followups', {
        ...newContact,
        status: 'pending'
      });
      setContacts(prev => [{ ...res.data, history: [] }, ...prev]);
      setShowAdd(false);
      setNewContact({ contact_name: '', contact_phone: '', notes: '', location: '' });
      toast.success('Contact added!');
    } catch (e) { 
      console.error(e);
      toast.error('Failed to add contact');
    }
  };

  const handleAddNote = async (contactId) => {
    if (!newNote.status) {
      toast.error('Please select a status');
      return;
    }
    
    try {
      const nextFollowUp = newNote.next_date 
        ? `${newNote.next_date}T${newNote.next_time || '10:00'}:00`
        : null;
      
      await api().put(`/followups/${contactId}`, null, {
        params: {
          status: newNote.status,
          notes: newNote.feedback,
          next_follow_up: nextFollowUp
        }
      });
      
      // Update local state
      setContacts(prev => prev.map(c => {
        if (c.id === contactId) {
          return {
            ...c,
            status: newNote.status,
            notes: newNote.feedback,
            next_follow_up: nextFollowUp,
            history: [
              {
                status: newNote.status,
                notes: newNote.feedback,
                date: new Date().toISOString(),
                next_follow_up: nextFollowUp
              },
              ...c.history
            ]
          };
        }
        return c;
      }));
      
      setShowAddNote(null);
      setNewNote({ status: '', feedback: '', next_date: '', next_time: '' });
      toast.success('Follow-up updated!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update');
    }
  };

  const getStatusInfo = (status) => {
    return STATUS_OPTIONS.find(s => s.id === status) || STATUS_OPTIONS[3];
  };

  const getDateLabel = (d) => {
    if (!d) return null;
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: 'Overdue', color: 'text-red-500', bg: 'bg-red-50' };
    if (diff === 0) return { label: 'Today', color: 'text-amber-600', bg: 'bg-amber-50' };
    if (diff === 1) return { label: 'Tomorrow', color: 'text-green-500', bg: 'bg-green-50' };
    if (diff <= 7) return { label: `In ${diff} days`, color: 'text-blue-500', bg: 'bg-blue-50' };
    return { 
      label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), 
      color: 'text-gray-500', 
      bg: 'bg-gray-100' 
    };
  };

  const formatDateTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} data-testid="back-btn" className="w-10 h-10 flex items-center justify-center">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Follow-ups</h1>
              <p className="text-xs text-gray-500">{contacts.length} contacts</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            data-testid="add-followup-btn"
            className="w-10 h-10 flex items-center justify-center"
          >
            <Plus className="w-6 h-6 text-blue-500" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl skeleton" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-900 font-semibold">No follow-ups yet</p>
            <p className="text-gray-500 text-sm mt-1">Add contacts to track your follow-ups</p>
            <button 
              onClick={() => setShowAdd(true)}
              className="mt-6 px-8 py-3 bg-blue-500 text-white font-semibold rounded-xl"
            >
              Add Contact
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, i) => {
              const dateInfo = getDateLabel(contact.next_follow_up);
              const statusInfo = contact.status ? getStatusInfo(contact.status) : null;
              const StatusIcon = statusInfo?.icon || Clock;
              
              return (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                >
                  {/* Contact Header */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-lg">
                          {contact.contact_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{contact.contact_name}</p>
                          {dateInfo && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dateInfo.bg} ${dateInfo.color}`}>
                              {dateInfo.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{contact.contact_phone}</p>
                        {contact.location && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {contact.location}
                          </p>
                        )}
                        
                        {/* Latest Status */}
                        {statusInfo && contact.status !== 'pending' && (
                          <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg ${statusInfo.bg}`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                            <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                        )}
                        
                        {/* Latest Note */}
                        {contact.notes && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2 italic">"{contact.notes}"</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <a 
                        href={`tel:${contact.contact_phone}`}
                        className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-4 h-4" /> Call
                      </a>
                      <a 
                        href={`https://wa.me/91${contact.contact_phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 bg-green-100 rounded-xl text-sm font-medium text-green-700 flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" /> WhatsApp
                      </a>
                      <button
                        onClick={() => setShowAddNote(contact)}
                        className="flex-1 py-2.5 bg-blue-500 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5"
                      >
                        <StickyNote className="w-4 h-4" /> Add Note
                      </button>
                    </div>
                  </div>
                  
                  {/* History Preview */}
                  {contact.history && contact.history.length > 0 && (
                    <button
                      onClick={() => setShowHistory(contact)}
                      className="w-full px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-500">
                        {contact.history.length} previous follow-up{contact.history.length > 1 ? 's' : ''}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Contact Sheet */}
      <Drawer.Root open={showAdd} onOpenChange={setShowAdd}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[1001]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[1002] outline-none max-h-[90vh] overflow-y-auto">
            <div className="p-4 pb-8">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Add Contact</h2>
              <p className="text-sm text-gray-500 mb-6">Add from phone or enter manually</p>
              
              {/* Import from Phone Contacts Button */}
              {'contacts' in navigator && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const props = ['name', 'tel'];
                      const opts = { multiple: false };
                      const contacts = await navigator.contacts.select(props, opts);
                      if (contacts && contacts.length > 0) {
                        const contact = contacts[0];
                        setNewContact({
                          ...newContact,
                          contact_name: contact.name?.[0] || '',
                          contact_phone: contact.tel?.[0]?.replace(/\D/g, '') || ''
                        });
                        toast.success('Contact imported!');
                      }
                    } catch (e) {
                      console.error('Contact picker error:', e);
                      toast.error('Could not access contacts');
                    }
                  }}
                  className="w-full py-4 mb-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 shadow-lg"
                >
                  <UserPlus className="w-5 h-5" />
                  Import from Phone Contacts
                </button>
              )}
              
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-sm text-gray-400">or enter manually</span>
                </div>
              </div>
              
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Contact Name *</label>
                  <input
                    type="text"
                    value={newContact.contact_name}
                    onChange={(e) => setNewContact({ ...newContact, contact_name: e.target.value })}
                    placeholder="Enter name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    required
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Phone Number *</label>
                  <input
                    type="tel"
                    value={newContact.contact_phone}
                    onChange={(e) => setNewContact({ ...newContact, contact_phone: e.target.value })}
                    placeholder="Enter phone"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    required
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Location/Area</label>
                  <input
                    type="text"
                    value={newContact.location}
                    onChange={(e) => setNewContact({ ...newContact, location: e.target.value })}
                    placeholder="e.g., Banjara Hills, Hyderabad"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    data-testid="input-location"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Initial Notes</label>
                  <textarea
                    value={newContact.notes}
                    onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                    placeholder="Add notes about this contact..."
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
                    data-testid="input-notes"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl"
                  data-testid="submit-contact-btn"
                >
                  Add Contact
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Add Note/Status Sheet */}
      <Drawer.Root open={!!showAddNote} onOpenChange={(open) => !open && setShowAddNote(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[1001]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[1002] outline-none max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Add Follow-up Note</h2>
              <p className="text-sm text-gray-500 mb-6">{showAddNote?.contact_name}</p>
              
              {/* Status Selection */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">What's the status?</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(status => {
                    const Icon = status.icon;
                    const isSelected = newNote.status === status.id;
                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => setNewNote({ ...newNote, status: status.id })}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                          isSelected 
                            ? `${status.bg} border-current ${status.color}` 
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Feedback/Notes */}
              <div className="mb-4">
                <label className="text-sm text-gray-500 mb-1.5 block">Feedback/Notes</label>
                <textarea
                  value={newNote.feedback}
                  onChange={(e) => setNewNote({ ...newNote, feedback: e.target.value })}
                  placeholder="What did they say? Any specific requirements?"
                  rows={3}
                  className="w-full resize-none"
                />
              </div>
              
              {/* Reschedule Date/Time */}
              {(newNote.status === 'reschedule' || newNote.status === 'followup_again') && (
                <div className="mb-6 p-4 bg-amber-50 rounded-xl">
                  <p className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule Next Follow-up
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Date</label>
                      <input
                        type="date"
                        value={newNote.next_date}
                        onChange={(e) => setNewNote({ ...newNote, next_date: e.target.value })}
                        className="w-full text-sm"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Time</label>
                      <input
                        type="time"
                        value={newNote.next_time}
                        onChange={(e) => setNewNote({ ...newNote, next_time: e.target.value })}
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => handleAddNote(showAddNote?.id)}
                className="w-full py-3.5 bg-blue-500 text-white font-semibold rounded-xl"
              >
                Save Note
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* History Sheet */}
      <Drawer.Root open={!!showHistory} onOpenChange={(open) => !open && setShowHistory(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[1001]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[1002] outline-none max-h-[85vh] overflow-y-auto">
            <div className="p-4">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {showHistory?.contact_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{showHistory?.contact_name}</h2>
                  <p className="text-sm text-gray-500">{showHistory?.contact_phone}</p>
                </div>
              </div>
              
              <p className="text-sm font-medium text-gray-700 mb-4">Follow-up History</p>
              
              <div className="space-y-4">
                {showHistory?.history?.map((h, i) => {
                  const statusInfo = getStatusInfo(h.status);
                  const Icon = statusInfo?.icon || Clock;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusInfo?.bg}`}>
                        <Icon className={`w-4 h-4 ${statusInfo?.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${statusInfo?.color}`}>{statusInfo?.label}</span>
                          <span className="text-xs text-gray-400">{formatDateTime(h.date)}</span>
                        </div>
                        {h.notes && <p className="text-sm text-gray-600 mt-1">{h.notes}</p>}
                        {h.next_follow_up && (
                          <p className="text-xs text-gray-400 mt-1">
                            Scheduled: {formatDateTime(h.next_follow_up)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default FollowUps;
