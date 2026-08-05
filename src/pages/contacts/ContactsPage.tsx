import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { ContactDrawer } from '../../components/contacts/ContactDrawer';
import { MexoEmptyState } from '../../components/common/MexoEmptyState';
import { useComposeStore } from '../../store/composeStore';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../services/db';
import { Contact } from '../../types/contact';
import { BookOpen, Plus, Mail, Star, Phone, Building, Edit2, Trash2, Search } from 'lucide-react';

export const ContactsPage: React.FC = () => {
  const { openCompose } = useComposeStore();
  const { addToast } = useUIStore();

  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [contacts, setContacts] = useState<Contact[]>(db.getContacts());

  const filteredContacts = contacts.filter((c) => {
    if (filter === 'favorites' && !c.isFavorite) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return `${c.firstName} ${c.lastName} ${c.email} ${c.organization || ''}`
        .toLowerCase()
        .includes(q);
    }
    return true;
  });

  const handleToggleFavorite = (id: string, currentFav: boolean) => {
    const updated = contacts.map((c) => (c.id === id ? { ...c, isFavorite: !currentFav } : c));
    setContacts(updated);
    db.updateContact(id, { isFavorite: !currentFav });
  };

  const handleSaveContact = (contactData: Partial<Contact>) => {
    if (contactData.id) {
      // Edit existing
      const updated = contacts.map((c) =>
        c.id === contactData.id ? ({ ...c, ...contactData } as Contact) : c
      );
      setContacts(updated);
      db.updateContact(contactData.id, contactData);
      addToast({ message: 'Contact updated successfully.', type: 'success' });
    } else {
      // Create new
      const newContact: Contact = {
        id: `cnt-${Date.now()}`,
        firstName: contactData.firstName || '',
        lastName: contactData.lastName || '',
        displayName: contactData.displayName || `${contactData.firstName} ${contactData.lastName}`,
        email: contactData.email || '',
        phone: contactData.phone,
        organization: contactData.organization,
        jobTitle: contactData.jobTitle,
        isFavorite: false,
        isFrequent: false,
        createdAt: new Date().toISOString(),
      };
      setContacts([newContact, ...contacts]);
      db.createContact(newContact);
      addToast({ message: 'New contact added to your directory.', type: 'success' });
    }
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    db.deleteContact(id);
    addToast({ message: 'Contact removed.', type: 'info' });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-4 sm:space-y-6 relative pb-24 md:pb-8">
        {/* Responsive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-app-heading flex items-center">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-[#0878e8]" /> MEXO Contacts
            </h1>
            <p className="text-[11px] sm:text-xs text-app-body mt-0.5 sm:mt-1">
              Manage saved contacts and directory connections.
            </p>
          </div>

          <div className="hidden sm:block">
            <MexoButton
              onClick={() => {
                setEditingContact(null);
                setIsDrawerOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              variant="primary"
            >
              Add Contact
            </MexoButton>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#0878e8] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Contacts ({contacts.length})
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'favorites'
                  ? 'bg-[#0878e8] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Favorites
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-app-border bg-white dark:bg-slate-900 text-app-heading outline-none focus:border-app-primary transition-all"
            />
          </div>
        </div>

        {/* Contacts View */}
        {filteredContacts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-8 sm:p-12 text-center">
            <MexoEmptyState
              title="No contacts yet"
              description="Add people you communicate with frequently to easily reach them on MEXO Mail."
              action={
                <MexoButton
                  onClick={() => {
                    setEditingContact(null);
                    setIsDrawerOpen(true);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                  variant="primary"
                >
                  Add your first contact
                </MexoButton>
              }
            />
          </div>
        ) : (
          <>
            {/* ── 1. Desktop Table View (>= 768px) ── */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-app-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-app-secondarySurface border-b border-app-border text-app-muted font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 w-10"></th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email / MEXO Address</th>
                      <th className="py-3 px-4">Organization & Title</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border text-app-body font-medium">
                    {filteredContacts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleFavorite(c.id, c.isFavorite)}
                            className="text-slate-300 hover:text-amber-400 focus:outline-none"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                c.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 px-4 font-bold text-app-heading flex items-center space-x-3">
                          <MexoAvatar name={`${c.firstName} ${c.lastName}`} size="sm" />
                          <span>
                            {c.firstName} {c.lastName}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-app-primary">
                          {c.email}
                        </td>
                        <td className="py-3 px-4">
                          {c.organization ? (
                            <span>
                              {c.jobTitle ? `${c.jobTitle} at ` : ''}
                              {c.organization}
                            </span>
                          ) : (
                            <span className="text-app-muted font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {c.phone ? c.phone : <span className="text-app-muted font-normal">—</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => openCompose({ to: [c.email] })}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-app-primary"
                              title="Send Message"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingContact(c);
                                setIsDrawerOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-app-body"
                              title="Edit Contact"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(c.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 2. Mobile Contact Cards List (< 768px) ── */}
            <div className="md:hidden space-y-3">
              {filteredContacts.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 transition-all"
                >
                  {/* Card Header: Avatar + Name + Org + Star */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                      <MexoAvatar name={`${c.firstName} ${c.lastName}`} size="md" className="flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {c.firstName} {c.lastName}
                        </h3>
                        {c.organization && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {c.jobTitle ? `${c.jobTitle} at ` : ''}{c.organization}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(c.id, c.isFavorite)}
                      className="p-1 rounded-lg text-slate-300 hover:text-amber-400 focus:outline-none"
                      title={c.isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                      <Star className={`w-5 h-5 ${c.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  </div>

                  {/* Contact Details Pill */}
                  <div className="space-y-1 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-xs font-mono font-semibold text-[#0878e8] truncate flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-slate-400" />
                      {c.email}
                    </p>
                    {c.phone && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 truncate flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-slate-400" />
                        {c.phone}
                      </p>
                    )}
                  </div>

                  {/* Card Action Buttons: Send Mail, Edit, Delete */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => openCompose({ to: [c.email] })}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0878e8] dark:text-blue-400 font-bold text-xs hover:bg-blue-100 transition-colors mr-2 cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Email</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingContact(c);
                          setIsDrawerOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Edit Contact"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(c.id)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Mobile Floating Add Contact FAB */}
        <button
          type="button"
          onClick={() => {
            setEditingContact(null);
            setIsDrawerOpen(true);
          }}
          className="md:hidden fixed right-4 bottom-5 z-40 flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#0878e8] to-[#0668cc] active:scale-95 text-white font-bold shadow-lg shadow-blue-500/30 transition-all select-none focus:outline-none ring-2 ring-white dark:ring-slate-900 cursor-pointer"
          style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          aria-label="Add new contact"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="text-xs font-bold tracking-wide">Add Contact</span>
        </button>

        {/* Contact Centered Popup Modal */}
        <ContactDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSave={handleSaveContact}
          initialContact={editingContact}
        />
      </div>
    </AppLayout>
  );
};
