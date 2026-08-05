import React, { useState, useRef, useEffect } from 'react';
import { db } from '../../services/db';
import { MexoAvatar } from '../common/MexoAvatar';
import { X, Users } from 'lucide-react';

export interface RecipientInputProps {
  label: string;
  recipients: string[];
  onChangeRecipients: (updated: string[]) => void;
  onRemoveField?: () => void;
  extraControls?: React.ReactNode;
}

export const RecipientInput: React.FC<RecipientInputProps> = ({
  label,
  recipients,
  onChangeRecipients,
  onRemoveField,
  extraControls,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const contacts = db.getContacts();
  const users = db.getUsers();
  const groups = db.getGroups();

  // Combine suggestions with profile photo (avatar) resolution
  const suggestions: { name: string; email: string; avatar?: string; isGroup?: boolean }[] = [];

  groups.forEach((g) => {
    suggestions.push({ name: g.name, email: g.address, isGroup: true });
  });

  contacts.forEach((c) => {
    const matchedUser = users.find((u) => u.email.toLowerCase() === c.email.toLowerCase());
    suggestions.push({
      name: `${c.firstName} ${c.lastName}`.trim() || c.displayName || c.email,
      email: c.email,
      avatar: matchedUser?.avatarUrl || c.avatarUrl,
    });
  });

  users.forEach((u) => {
    if (!suggestions.some((s) => s.email.toLowerCase() === u.email.toLowerCase())) {
      suggestions.push({
        name: `${u.firstName} ${u.lastName}`.trim() || u.email,
        email: u.email,
        avatar: u.avatarUrl,
      });
    }
  });

  // Close dropdown when clicking anywhere outside container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = suggestions.filter((s) => {
    if (recipients.includes(s.email.toLowerCase())) return false;
    if (!inputValue.trim()) return true;
    const clean = inputValue.toLowerCase().trim();
    return s.name.toLowerCase().includes(clean) || s.email.toLowerCase().includes(clean);
  });

  const addRecipient = (emailToAdd: string) => {
    let clean = emailToAdd.toLowerCase().trim();
    if (!clean) return;
    if (!clean.includes('@')) clean = `${clean}@mexo.com`;
    if (!recipients.includes(clean)) {
      onChangeRecipients([...recipients, clean]);
    }
    setInputValue('');
    setShowDropdown(false);
  };

  const removeRecipient = (emailToRemove: string) => {
    onChangeRecipients(recipients.filter((r) => r !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (inputValue.trim()) {
        addRecipient(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      removeRecipient(recipients[recipients.length - 1]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center flex-wrap gap-1 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
    >
      <span className="font-semibold text-slate-500 w-12 flex-shrink-0 select-none">{label}:</span>

      {/* Recipient Pills */}
      {recipients.map((email) => (
        <span
          key={email}
          className="inline-flex items-center px-2 py-0.5 rounded-md bg-mexo-50 dark:bg-mexo-950 text-mexo-700 dark:text-mexo-300 font-semibold border border-mexo-200 dark:border-mexo-800 text-[11px]"
        >
          {email}
          <button onClick={() => removeRecipient(email)} className="ml-1 text-mexo-500 hover:text-mexo-800">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        placeholder={recipients.length === 0 ? `Type email address or group name...` : ''}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onClick={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-[140px] bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 py-1"
      />

      {/* Right Controls (Extra +Cc/+Bcc buttons or Remove Field button) */}
      <div className="flex items-center space-x-1.5 ml-auto flex-shrink-0 select-none">
        {extraControls}

        {onRemoveField && (
          <button
            type="button"
            onClick={onRemoveField}
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title={`Remove ${label} field`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && filteredSuggestions.length > 0 && (
        <div className="absolute left-14 top-full mt-1 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-mexo-popover p-1 z-50 max-h-56 overflow-y-auto">
          {filteredSuggestions.slice(0, 8).map((s) => (
            <button
              key={s.email}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addRecipient(s.email);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {s.isGroup ? (
                <div className="w-7 h-7 rounded-lg bg-mexo-100 dark:bg-mexo-950 text-mexo-600 flex items-center justify-center font-bold flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              ) : (
                <MexoAvatar name={s.name} src={s.avatar} size="xs" className="flex-shrink-0" />
              )}
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{s.name}</p>
                <p className="text-[11px] text-mexo-600 dark:text-mexo-400 truncate">{s.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
