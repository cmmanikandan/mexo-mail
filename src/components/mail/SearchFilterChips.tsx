import React, { useState } from 'react';
import { useMailStore } from '../../store/mailStore';
import { useUIStore } from '../../store/uiStore';
import { SlidersHorizontal, ChevronDown, Check, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export const SearchFilterChips: React.FC = () => {
  const { searchQuery, setSearchQuery } = useMailStore();
  const { setAdvancedSearchOpen } = useUIStore();

  const isHasAttachment = searchQuery.includes('has:attachment');
  const isUnread = searchQuery.includes('is:unread');

  const toggleAttachmentFilter = () => {
    if (isHasAttachment) {
      setSearchQuery(searchQuery.replace(/has:attachment/g, '').trim());
    } else {
      setSearchQuery(`${searchQuery} has:attachment`.trim());
    }
  };

  const toggleUnreadFilter = () => {
    if (isUnread) {
      setSearchQuery(searchQuery.replace(/is:unread/g, '').trim());
    } else {
      setSearchQuery(`${searchQuery} is:unread`.trim());
    }
  };

  const handleDateFilterSelect = (timeRange: string) => {
    let dateStr = '';
    const now = new Date();

    if (timeRange === 'past_day') {
      const d = new Date(now.setDate(now.getDate() - 1));
      dateStr = `after:${d.toISOString().split('T')[0]}`;
    } else if (timeRange === 'past_week') {
      const d = new Date(now.setDate(now.getDate() - 7));
      dateStr = `after:${d.toISOString().split('T')[0]}`;
    } else if (timeRange === 'past_month') {
      const d = new Date(now.setMonth(now.getMonth() - 1));
      dateStr = `after:${d.toISOString().split('T')[0]}`;
    }

    const cleanQuery = searchQuery.replace(/after:\S+/g, '').trim();
    setSearchQuery(dateStr ? `${cleanQuery} ${dateStr}`.trim() : cleanQuery);
  };

  return (
    <div className="flex items-center space-x-2 px-4 py-2 bg-app-secondarySurface/60 border-b border-app-border overflow-x-auto text-xs font-semibold select-none">
      {/* Date Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-app-border text-app-body hover:border-app-primary transition-all">
            <span>Any time</span>
            <ChevronDown className="w-3.5 h-3.5 text-app-muted" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="w-40 bg-white dark:bg-slate-900 rounded-xl shadow-mexo-popover border border-app-border p-1 z-50 text-xs font-medium"
            align="start"
          >
            <DropdownMenu.Item
              onClick={() => handleDateFilterSelect('any')}
              className="px-3 py-1.5 rounded-lg text-app-body hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none"
            >
              Any time
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => handleDateFilterSelect('past_day')}
              className="px-3 py-1.5 rounded-lg text-app-body hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none"
            >
              Past 24 hours
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => handleDateFilterSelect('past_week')}
              className="px-3 py-1.5 rounded-lg text-app-body hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none"
            >
              Past week
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => handleDateFilterSelect('past_month')}
              className="px-3 py-1.5 rounded-lg text-app-body hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none"
            >
              Past month
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Has Attachment Chip */}
      <button
        type="button"
        onClick={toggleAttachmentFilter}
        className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl border transition-all ${
          isHasAttachment
            ? 'bg-indigo-50 text-[#7C3AED] border-[#7C3AED] dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold shadow-xs'
            : 'bg-white dark:bg-slate-900 border-app-border text-app-body hover:border-[#7C3AED]'
        }`}
      >
        {isHasAttachment && <Check className="w-3.5 h-3.5" />}
        <span>Has attachment</span>
      </button>

      {/* Is Unread Chip */}
      <button
        type="button"
        onClick={toggleUnreadFilter}
        className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl border transition-all ${
          isUnread
            ? 'bg-indigo-50 text-[#7C3AED] border-[#7C3AED] dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold shadow-xs'
            : 'bg-white dark:bg-slate-900 border-app-border text-app-body hover:border-[#7C3AED]'
        }`}
      >
        {isUnread && <Check className="w-3.5 h-3.5" />}
        <span>Unread only</span>
      </button>

      {/* Advanced Search Button */}
      <button
        type="button"
        onClick={() => setAdvancedSearchOpen(true)}
        className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-app-border text-app-body hover:border-app-primary transition-all ml-auto"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-app-primary" />
        <span>Advanced Filters</span>
      </button>
    </div>
  );
};
