import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMailStore } from '../../store/mailStore';
import { db } from '../../services/db';
import { filterMessagesByQuery } from '../../utils/SearchQueryParser';
import {
  ArrowLeft,
  Search,
  X,
  Paperclip,
  Star,
  Mail,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Message } from '../../types/mail';
import { formatDistanceToNow } from 'date-fns';
import { MexoAvatar } from '../common/MexoAvatar';
import { MexoButton } from '../common/MexoButton';
import { MobileComposeFAB } from '../common/MobileComposeFAB';
import { MobileBottomNav } from '../layout/MobileBottomNav';
import { ComposeContainer } from '../compose/ComposeModal';
import { MexoToastContainer } from '../common/MexoToast';

// ─── Search Result Item Row ──────────────────────────────────────────────────
const MobileSearchResultRow: React.FC<{ message: Message; onOpen: () => void }> = ({ message, onOpen }) => {
  const isUnread = !message.userState.isRead;
  const timeLabel = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
  return (
    <button
      onClick={onOpen}
      className={`w-full flex items-start px-4 py-3.5 space-x-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 ${
        isUnread ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
      }`}
    >
      <MexoAvatar
        name={message.senderName || 'MEXO'}
        src={undefined}
        size="md"
        className="w-10 h-10 text-xs font-bold flex-shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-xs truncate ${isUnread ? 'font-bold text-app-heading' : 'font-semibold text-app-body'}`}>
            {message.senderName}
          </span>
          <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
            {message.userState.isStarred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
            <span className="text-[11px] text-app-muted">{timeLabel}</span>
          </div>
        </div>
        <p className={`text-xs truncate ${isUnread ? 'font-bold text-app-heading' : 'font-semibold text-app-heading/80'}`}>
          {message.subject}
        </p>
        <div className="flex items-center mt-1">
          <p className="text-[11px] text-app-muted truncate flex-1">{message.snippet}</p>
          {message.attachments && message.attachments.length > 0 && (
            <Paperclip className="w-3.5 h-3.5 text-app-muted ml-1.5 flex-shrink-0" />
          )}
        </div>
      </div>
    </button>
  );
};

// ─── Human Readable Quick Search Definitions ──────────────────────────────────
interface QuickSearchItem {
  id: string;
  label: string;
  internalQuery: string;
  icon: React.ReactNode;
}

const QUICK_SEARCH_ITEMS: QuickSearchItem[] = [
  {
    id: 'unread',
    label: 'Unread messages',
    internalQuery: 'is:unread',
    icon: <Mail className="w-5 h-5 text-app-primary" />,
  },
  {
    id: 'attachments',
    label: 'Messages with attachments',
    internalQuery: 'has:attachment',
    icon: <Paperclip className="w-5 h-5 text-emerald-600" />,
  },
  {
    id: 'starred',
    label: 'Starred messages',
    internalQuery: 'is:starred',
    icon: <Star className="w-5 h-5 text-amber-500 fill-amber-400" />,
  },
];

// ─── MobileSearchPage ────────────────────────────────────────────────────────
export const MobileSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCurrentFolder } = useMailStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialQuery = searchParams.get('q') || '';

  // Store display label shown in input vs internal engine query
  const [displayQuery, setDisplayQuery] = useState<string>(initialQuery);
  const [internalQuery, setInternalQuery] = useState<string>(initialQuery);
  const [hasSearched, setHasSearched] = useState<boolean>(!!initialQuery);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Advanced Filter state
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterDate, setFilterDate] = useState('any');
  const [filterHasAttachment, setFilterHasAttachment] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterStarred, setFilterStarred] = useState(false);

  // Auto-focus on open
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const currentUser = db.getCurrentUser();
  const allMessages = db.getMessagesForUser(currentUser.email);
  const contacts = db.getContacts();
  const labels = db.getLabels();

  // Dynamic People List: contacts + recent senders/recipients
  const peopleList = useMemo(() => {
    const peopleMap = new Map<string, { id: string; name: string; email: string }>();

    // Add saved contacts
    contacts.forEach((c) => {
      peopleMap.set(c.email.toLowerCase(), {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
      });
    });

    // Add recent email senders
    allMessages.forEach((m) => {
      if (m.senderEmail && m.senderEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
        const key = m.senderEmail.toLowerCase();
        if (!peopleMap.has(key)) {
          peopleMap.set(key, {
            id: `recent-${m.id}`,
            name: m.senderName || m.senderEmail.split('@')[0],
            email: m.senderEmail,
          });
        }
      }
    });

    return Array.from(peopleMap.values()).slice(0, 6);
  }, [contacts, allMessages, currentUser.email]);

  // Live Suggestions while typing
  const isTyping = !hasSearched && displayQuery.trim().length > 0;
  const matchingPeople = useMemo(() => {
    if (!isTyping) return [];
    const q = displayQuery.trim().toLowerCase();
    return peopleList.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [isTyping, displayQuery, peopleList]);

  const matchingSubjects = useMemo(() => {
    if (!isTyping) return [];
    const q = displayQuery.trim().toLowerCase();
    const seenSubjects = new Set<string>();
    const matches: Message[] = [];
    allMessages.forEach((m) => {
      if (m.subject && m.subject.toLowerCase().includes(q) && !seenSubjects.has(m.subject)) {
        seenSubjects.add(m.subject);
        matches.push(m);
      }
    });
    return matches.slice(0, 4);
  }, [isTyping, displayQuery, allMessages]);

  // Search Results
  const results = useMemo(() => {
    if (!hasSearched || !internalQuery.trim()) return [];
    return filterMessagesByQuery(
      allMessages.filter((m) => !m.userState.isDeleted && !m.userState.isSpam),
      internalQuery.trim(),
      labels
    );
  }, [hasSearched, internalQuery, allMessages, labels]);

  // Handle Search Execution
  const executeSearch = (displayText: string, queryToRun: string) => {
    const trimmedDisplay = displayText.trim();
    const trimmedQuery = queryToRun.trim();
    if (!trimmedDisplay) return;

    setDisplayQuery(trimmedDisplay);
    setInternalQuery(trimmedQuery);
    setHasSearched(true);
    setSearchParams({ q: trimmedDisplay });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch(displayQuery, displayQuery);
    }
  };

  const handleBack = () => {
    if (hasSearched) {
      setHasSearched(false);
      setDisplayQuery('');
      setInternalQuery('');
      setSearchParams({});
    } else {
      navigate(-1);
    }
  };

  const handleClear = () => {
    setDisplayQuery('');
    setInternalQuery('');
    setHasSearched(false);
    setSearchParams({});
    if (inputRef.current) inputRef.current.focus();
  };

  const handleQuickSearchTap = (item: QuickSearchItem) => {
    executeSearch(item.label, item.internalQuery);
  };

  const handlePersonTap = (person: { name: string; email: string }) => {
    executeSearch(person.name, `from:${person.email}`);
  };

  // Apply Advanced Search Filter Modal
  const handleApplyFilters = () => {
    const parts: string[] = [];
    if (filterFrom.trim()) parts.push(`from:${filterFrom.trim()}`);
    if (filterTo.trim()) parts.push(`to:${filterTo.trim()}`);
    if (filterHasAttachment) parts.push('has:attachment');
    if (filterUnread) parts.push('is:unread');
    if (filterStarred) parts.push('is:starred');

    if (filterDate === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      parts.push(`after:${d.toISOString().split('T')[0]}`);
    } else if (filterDate === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      parts.push(`after:${d.toISOString().split('T')[0]}`);
    } else if (filterDate === 'year') {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      parts.push(`after:${d.toISOString().split('T')[0]}`);
    }

    const compiledQuery = parts.join(' ');
    const displayTitle = parts.length > 0 ? 'Filtered search' : 'All mail';

    setIsFilterOpen(false);
    executeSearch(displayTitle, compiledQuery.length > 0 ? compiledQuery : 'all');
  };

  const handleResetFilters = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterDate('any');
    setFilterHasAttachment(false);
    setFilterUnread(false);
    setFilterStarred(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-slate-900 fixed inset-0 z-40 overflow-hidden font-sans text-slate-900 dark:text-slate-100">
      {/* ── 1. Search Header ── */}
      <div className="flex items-center px-3 py-2 border-b border-app-border bg-white dark:bg-slate-900 shadow-sm flex-shrink-0">
        <button
          onClick={handleBack}
          className="p-2 mr-1 rounded-xl text-app-heading hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={displayQuery}
            onChange={(e) => {
              setDisplayQuery(e.target.value);
              setInternalQuery(e.target.value);
              if (!e.target.value.trim()) {
                setHasSearched(false);
                setSearchParams({});
              }
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search in mail..."
            className="w-full h-11 pl-9 pr-9 rounded-2xl bg-[#F0F4F9] dark:bg-slate-800 text-base sm:text-sm text-app-heading placeholder-app-muted border border-transparent focus:border-app-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-app-primary/20 transition-all outline-none"
          />
          {displayQuery && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-app-muted hover:text-app-heading transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Modal Trigger */}
        <button
          onClick={() => setIsFilterOpen(true)}
          className="p-2.5 ml-1.5 rounded-xl text-app-body hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          title="Search Filters"
        >
          <SlidersHorizontal className="w-5 h-5 text-app-muted" />
        </button>
      </div>

      {/* ── 2. Body Content ── */}
      <div className="flex-1 overflow-y-auto pb-28 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
        {/* ── State A: Showing Search Results ── */}
        {hasSearched ? (
          <div>
            {/* Header Result Count */}
            <div className="px-4 py-3 border-b border-app-border bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <p className="text-xs font-semibold text-app-muted">
                {results.length > 0
                  ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${displayQuery}"`
                  : `No results for "${displayQuery}"`}
              </p>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-app-primary hover:underline"
              >
                Clear
              </button>
            </div>

            {results.length > 0 ? (
              <div className="divide-y divide-app-border">
                {results.map((msg) => (
                  <MobileSearchResultRow
                    key={msg.id}
                    message={msg}
                    onOpen={() => navigate(`/mail/thread/${msg.threadId}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-app-muted" />
                </div>
                <h3 className="text-base font-bold text-app-heading mb-1">No messages found</h3>
                <p className="text-xs text-app-muted max-w-xs">
                  Try checking for spelling errors or adjusting search terms.
                </p>
              </div>
            )}
          </div>
        ) : isTyping ? (
          /* ── State B: Live Suggestions while Typing ── */
          <div className="px-4 py-4 space-y-5">
            {/* Search option */}
            <button
              onClick={() => executeSearch(displayQuery, displayQuery)}
              className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl bg-app-primarySoft text-app-primary text-sm font-semibold transition-colors active:scale-98"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span>Search mail for &quot;{displayQuery}&quot;</span>
            </button>

            {/* Matching People */}
            {matchingPeople.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2 px-1">
                  People
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/40">
                  {matchingPeople.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePersonTap(p)}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <MexoAvatar name={p.name} size="sm" className="mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-app-heading truncate">{p.name}</p>
                        <p className="text-[11px] text-app-muted truncate">{p.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Messages */}
            {matchingSubjects.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2 px-1">
                  Messages
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/40">
                  {matchingSubjects.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => navigate(`/mail/thread/${m.threadId}`)}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-app-muted mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-app-heading truncate">{m.subject}</p>
                        <p className="text-[11px] text-app-muted truncate">{m.senderName}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── State C: Default Quick Searches & People ── */
          <div className="px-4 py-5 space-y-6">
            {/* Quick Searches */}
            <div>
              <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2.5 px-1">
                Quick Searches
              </p>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/40">
                {QUICK_SEARCH_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleQuickSearchTap(item)}
                    className="w-full flex items-center px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 transition-colors min-h-[58px]"
                  >
                    <span className="mr-3.5 flex-shrink-0">{item.icon}</span>
                    <span className="text-sm font-semibold text-app-heading flex-1">{item.label}</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic People Section */}
            {peopleList.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2.5 px-1">
                  People
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/40">
                  {peopleList.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handlePersonTap(person)}
                      className="w-full flex items-center px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 transition-colors min-h-[64px]"
                    >
                      <MexoAvatar name={person.name} size="md" className="mr-3.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-app-heading truncate">{person.name}</p>
                        <p className="text-xs text-app-muted truncate mt-0.5 font-mono">{person.email}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. Advanced Search Filter Sheet / Modal ── */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-app-border p-5 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h3 className="text-base font-extrabold text-app-heading flex items-center">
                <SlidersHorizontal className="w-4 h-4 mr-2 text-app-primary" /> Search Filters
              </h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1.5 rounded-xl text-app-muted hover:text-app-heading transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Form Controls */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-app-body mb-1">From</label>
                <input
                  type="text"
                  placeholder="Sender name or email..."
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-app-heading text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-app-body mb-1">To</label>
                <input
                  type="text"
                  placeholder="Recipient name or email..."
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-app-heading text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-app-body mb-1">Date Range</label>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-app-heading text-xs font-medium"
                >
                  <option value="any">Any time</option>
                  <option value="7days">Past 7 days</option>
                  <option value="30days">Past 30 days</option>
                  <option value="year">Past year</option>
                </select>
              </div>

              <div className="pt-2 border-t border-app-border space-y-3">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterHasAttachment}
                    onChange={(e) => setFilterHasAttachment(e.target.checked)}
                    className="w-4 h-4 rounded text-app-primary focus:ring-app-primary"
                  />
                  <span className="font-semibold text-app-heading">Has attachments</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterUnread}
                    onChange={(e) => setFilterUnread(e.target.checked)}
                    className="w-4 h-4 rounded text-app-primary focus:ring-app-primary"
                  />
                  <span className="font-semibold text-app-heading">Unread messages only</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterStarred}
                    onChange={(e) => setFilterStarred(e.target.checked)}
                    className="w-4 h-4 rounded text-app-primary focus:ring-app-primary"
                  />
                  <span className="font-semibold text-app-heading">Starred messages only</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-app-border">
              <MexoButton variant="ghost" size="sm" onClick={handleResetFilters} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
                Reset
              </MexoButton>
              <MexoButton variant="primary" size="sm" onClick={handleApplyFilters} leftIcon={<Check className="w-3.5 h-3.5" />}>
                Show results
              </MexoButton>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compose FAB & Bottom Navigation Bar */}
      <MobileComposeFAB />
      <MobileBottomNav />

      {/* Floating Compose Windows & Toasts */}
      <ComposeContainer />
      <MexoToastContainer />
    </div>
  );
};
