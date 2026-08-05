import React, { useState } from 'react';
import { MexoModal } from '../common/MexoModal';
import { MexoInput } from '../common/MexoInput';
import { MexoButton } from '../common/MexoButton';
import { db } from '../../services/db';
import { useUIStore } from '../../store/uiStore';
import { Contact } from '../../types/contact';

export interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContact?: Contact;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  initialContact,
}) => {
  const { addToast } = useUIStore();
  const [firstName, setFirstName] = useState(initialContact?.firstName || '');
  const [lastName, setLastName] = useState(initialContact?.lastName || '');
  const [email, setEmail] = useState(initialContact?.email || '');
  const [phone, setPhone] = useState(initialContact?.phone || '');
  const [organization, setOrganization] = useState(initialContact?.organization || '');
  const [jobTitle, setJobTitle] = useState(initialContact?.jobTitle || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;

    if (initialContact) {
      db.updateContact(initialContact.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        jobTitle: jobTitle.trim(),
      });
      addToast({ message: 'Contact updated.', type: 'success' });
    } else {
      db.createContact({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        jobTitle: jobTitle.trim(),
        isFavorite: false,
        isFrequent: false,
      });
      addToast({ message: 'New contact saved.', type: 'success' });
    }

    onClose();
  };

  return (
    <MexoModal isOpen={isOpen} onClose={onClose} title={initialContact ? 'Edit Contact' : 'Create Contact'} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MexoInput label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus />
          <MexoInput label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>

        <MexoInput label="MEXO Address / Email" type="email" placeholder="arun@mexo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <MexoInput label="Phone Number" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <MexoInput label="Organization" placeholder="MEXO Inc" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          <MexoInput label="Job Title" placeholder="Software Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <MexoButton type="button" variant="outline" onClick={onClose}>
            Cancel
          </MexoButton>
          <MexoButton type="submit" variant="primary">
            Save Contact
          </MexoButton>
        </div>
      </form>
    </MexoModal>
  );
};
