import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MexoModal } from '../common/MexoModal';
import { MexoInput } from '../common/MexoInput';
import { MexoButton } from '../common/MexoButton';
import { useMailStore, MailFolder } from '../../store/mailStore';
import { db } from '../../services/db';
import { Search, RotateCcw } from 'lucide-react';

export interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setSearchQuery, setCurrentFolder } = useMailStore();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [hasWords, setHasWords] = useState('');
  const [dateRange, setDateRange] = useState('any');
  const [location, setLocation] = useState('all');
  const [hasAttachment, setHasAttachment] = useState(false);

  const labels = db.getLabels();

  const handleReset = () => {
    setFrom('');
    setTo('');
    setSubject('');
    setHasWords('');
    setDateRange('any');
    setLocation('all');
    setHasAttachment(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts: string[] = [];

    if (from.trim()) parts.push(`from:${from.trim()}`);
    if (to.trim()) parts.push(`to:${to.trim()}`);
    if (subject.trim()) parts.push(`subject:${subject.trim()}`);
    if (hasWords.trim()) parts.push(hasWords.trim());
    if (hasAttachment) parts.push('has:attachment');

    if (location !== 'all') {
      parts.push(`in:${location}`);
    }

    if (dateRange !== 'any') {
      const now = new Date();
      if (dateRange === 'past_day') now.setDate(now.getDate() - 1);
      else if (dateRange === 'past_week') now.setDate(now.getDate() - 7);
      else if (dateRange === 'past_month') now.setMonth(now.getMonth() - 1);
      else if (dateRange === 'past_year') now.setFullYear(now.getFullYear() - 1);

      parts.push(`after:${now.toISOString().split('T')[0]}`);
    }

    const constructedQuery = parts.join(' ');
    setSearchQuery(constructedQuery);
    setCurrentFolder('search');
    onClose();
    navigate(`/mail/search?q=${encodeURIComponent(constructedQuery)}`);
  };

  return (
    <MexoModal isOpen={isOpen} onClose={onClose} title="Advanced Mail Search" maxWidth="lg">
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MexoInput label="From" placeholder="e.g. welcome@mexo.com" value={from} onChange={(e) => setFrom(e.target.value)} autoFocus />
          <MexoInput label="To" placeholder="e.g. user@mexo.com" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        <MexoInput label="Subject" placeholder="e.g. Welcome, Internship, Invoice" value={subject} onChange={(e) => setSubject(e.target.value)} />

        <MexoInput label="Includes Words" placeholder="Search keywords..." value={hasWords} onChange={(e) => setHasWords(e.target.value)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-app-body mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-app-border bg-white dark:bg-slate-900 text-app-heading text-xs font-medium"
            >
              <option value="any">Any time</option>
              <option value="past_day">Past 24 hours</option>
              <option value="past_week">Past week</option>
              <option value="past_month">Past month</option>
              <option value="past_year">Past year</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-body mb-1">Search Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-app-border bg-white dark:bg-slate-900 text-app-heading text-xs font-medium"
            >
              <option value="all">All Mail</option>
              <option value="inbox">Inbox</option>
              <option value="starred">Starred</option>
              <option value="sent">Sent</option>
              <option value="trash">Trash</option>
              {labels.map((l) => (
                <option key={l.id} value={`label:${l.name}`}>
                  Label: {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="hasAttAdv"
            checked={hasAttachment}
            onChange={(e) => setHasAttachment(e.target.checked)}
            className="w-4 h-4 rounded text-app-primary focus:ring-app-primary border-app-border cursor-pointer"
          />
          <label htmlFor="hasAttAdv" className="text-xs font-semibold text-app-heading cursor-pointer">
            Has Attachment
          </label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-app-border">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center text-xs font-semibold text-app-muted hover:text-app-heading transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Filters
          </button>

          <div className="flex items-center space-x-2">
            <MexoButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </MexoButton>
            <MexoButton type="submit" variant="primary" leftIcon={<Search className="w-4 h-4" />}>
              Search
            </MexoButton>
          </div>
        </div>
      </form>
    </MexoModal>
  );
};
