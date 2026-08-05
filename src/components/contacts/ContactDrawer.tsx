import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Contact } from '../../types/contact';
import { MexoInput } from '../common/MexoInput';
import { MexoButton } from '../common/MexoButton';
import { X, User } from 'lucide-react';

export interface ContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => void;
  initialContact?: Contact | null;
}

export const ContactDrawer: React.FC<ContactDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  initialContact,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Lock body scroll and add ESC key listener when open
  useEffect(() => {
    if (initialContact) {
      setFirstName(initialContact.firstName || '');
      setLastName(initialContact.lastName || '');
      setEmail(initialContact.email || '');
      setPhone(initialContact.phone || '');
      setOrganization(initialContact.organization || '');
      setJobTitle(initialContact.jobTitle || '');
      setNotes('');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setOrganization('');
      setJobTitle('');
      setNotes('');
    }
    setError('');
  }, [initialContact, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid email address is required.');
      return;
    }

    onSave({
      id: initialContact?.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      organization: organization.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
    });
    onClose();
  };

  const modalElement = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
    >
      {/* Full Viewport Dark Translucent Backdrop (Click outside to close) */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Centered Dialog Window Card Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[calc(100dvh-48px)] z-[110] my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Top MEXO Brand Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0878e8] via-[#36abfa] to-[#0878e8] flex-shrink-0" />

        {/* Popup Card Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-slate-900 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0878e8]/10 text-[#0878e8] dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {initialContact ? 'Edit Contact' : 'Add New Contact'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {initialContact
                  ? 'Update contact info & directory listing'
                  : 'Save a new person to your MEXO directory'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <MexoInput
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoFocus
            />
            <MexoInput
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <MexoInput
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <MexoInput
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <MexoInput
              label="Organization"
              placeholder="Company Name"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
            <MexoInput
              label="Job Title"
              placeholder="e.g. Lead Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-body mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional contact notes..."
              rows={3}
              className="w-full p-3 rounded-xl border border-app-border bg-white dark:bg-slate-800 text-app-heading text-xs font-sans outline-none focus:ring-2 focus:ring-app-primary/40"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-app-border flex-shrink-0">
            <MexoButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </MexoButton>
            <MexoButton type="submit" variant="primary">
              {initialContact ? 'Update Contact' : 'Save Contact'}
            </MexoButton>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
};
