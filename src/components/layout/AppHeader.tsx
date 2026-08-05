import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useMailStore } from '../../store/mailStore';
import { MexoAvatar } from '../common/MexoAvatar';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { MobileMailDrawer } from './MobileMailDrawer';
import { db } from '../../services/db';
import {
  Menu,
  Search,
  SlidersHorizontal,
  HelpCircle,
  Settings,
  LogOut,
  Shield,
  Clock,
  UserCheck,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser: storeUser, signOut } = useAuthStore();
  const currentUser = storeUser || db.getCurrentUser();
  const { toggleSidebar, toggleMobileDrawer, setAdvancedSearchOpen, setKeyboardShortcutsOpen } = useUIStore();
  const { searchQuery, setSearchQuery, setCurrentFolder } = useMailStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);

  // Keep input in sync with the store (e.g. when user navigates back to search results)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const contacts = db.getContacts();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      setCurrentFolder('search');
      setIsFocused(false);
      navigate(`/mail/search?q=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  const handleSelectSuggestion = (text: string) => {
    setLocalSearch(text);
    setSearchQuery(text);
    setCurrentFolder('search');
    setIsFocused(false);
    navigate(`/mail/search?q=${encodeURIComponent(text)}`);
  };

  return (
    <>
      <header className="h-16 border-b border-app-border bg-white dark:bg-slate-900 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 shadow-mexo-sm select-none">
        {/* Left Branding & Mobile Hamburger */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                toggleMobileDrawer();
              } else {
                toggleSidebar();
              }
            }}
            className="p-2 rounded-xl text-app-body hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => {
              setCurrentFolder('inbox');
              navigate('/mail/inbox');
            }}
            className="flex items-center space-x-2 cursor-pointer select-none"
          >
            <img src="/logo.png" alt="MEXO Mail" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
              MEXO <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent font-extrabold text-base sm:text-lg ml-1">Mail</span>
            </span>
          </div>
        </div>

        {/* Center Desktop Search Bar (Hidden on Mobile < md) */}
        <div className="hidden md:block flex-1 max-w-2xl px-4 relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-app-muted pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search in mail"
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#EEF3F9] dark:bg-slate-800/80 text-sm text-app-heading placeholder-app-muted border border-transparent focus:border-app-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-app-primary/20 transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => setAdvancedSearchOpen(true)}
              className="absolute right-3 p-1 rounded-lg text-app-muted hover:text-app-primary hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Advanced Search Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </form>

          {/* Real Search Suggestions Floating Panel */}
          {isFocused && (
            <div className="absolute left-4 right-4 top-12 mt-1 bg-white dark:bg-slate-900 rounded-2xl shadow-mexo-popover border border-app-border p-3 z-50 animate-in fade-in duration-150 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider px-2 mb-1.5 flex items-center">
                  <Clock className="w-3 h-3 mr-1.5 text-app-primary" /> Suggested Operators
                </p>
                <div className="space-y-1">
                  {[
                    { label: 'Unread messages', query: 'is:unread' },
                    { label: 'Messages with attachments', query: 'has:attachment' },
                    { label: 'Starred messages', query: 'is:starred' },
                    { label: 'Welcome mail', query: 'from:welcome@mexo.com' },
                  ].map((s) => (
                    <button
                      key={s.query}
                      onMouseDown={() => handleSelectSuggestion(s.query)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#0878e8] transition-colors flex items-center space-x-2"
                    >
                      <Search className="w-3.5 h-3.5 text-[#0878e8] flex-shrink-0" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {contacts.length > 0 && (
                <div className="pt-2 border-t border-app-border">
                  <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider px-2 mb-1.5 flex items-center">
                    <UserCheck className="w-3 h-3 mr-1.5 text-emerald-600" /> People
                  </p>
                  <div className="space-y-1">
                    {contacts.slice(0, 3).map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={() => handleSelectSuggestion(`from:${c.email}`)}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-app-body hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-app-heading">{c.firstName} {c.lastName}</span>
                        <span className="font-mono text-[11px] text-app-primary">{c.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right User Actions (Mobile Search Button + Avatar) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Mobile Search Button (Visible on Mobile < md) */}
          <button
            onClick={() => {
              setCurrentFolder('search');
              navigate('/mail/search');
            }}
            className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden flex items-center justify-center"
            title="Search Mail"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => setKeyboardShortcutsOpen(true)}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center justify-center"
            title="Keyboard Shortcuts"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center justify-center"
            title="Mail Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <PWAInstallButton className="hidden sm:flex" />

          {/* Profile Circle Avatar */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center justify-center p-0.5 rounded-full border-2 border-transparent hover:border-[#6366F1] transition-all focus:outline-none ring-2 ring-transparent">
                <MexoAvatar name={`${currentUser.firstName} ${currentUser.lastName}`} src={currentUser.avatarUrl} size="sm" className="w-8 h-8 text-xs font-bold shadow-xs" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-mexo-popover border border-app-border z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                align="end"
                sideOffset={8}
              >
                {/* Identity Header */}
                <div className="flex flex-col items-center text-center px-5 py-5 border-b border-app-border bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="mb-3">
                    <MexoAvatar name={`${currentUser.firstName} ${currentUser.lastName}`} src={currentUser.avatarUrl} size="lg" className="w-14 h-14 text-xl shadow-mexo-md border-2 border-white dark:border-slate-700" />
                  </div>
                  <p className="font-bold text-sm text-app-heading">{currentUser.firstName} {currentUser.lastName}</p>
                  <p className="text-xs text-app-primary font-mono mt-0.5 truncate max-w-full">{currentUser.email}</p>
                  <button
                    onClick={() => navigate('/account')}
                    className="mt-3 px-4 py-1.5 rounded-full border border-app-border text-xs font-semibold text-app-heading hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Manage MEXO Account
                  </button>
                </div>

                {/* Options */}
                <div className="p-2 space-y-0.5">
                  {currentUser.role === 'system_admin' && (
                    <DropdownMenu.Item
                      onClick={() => navigate('/admin')}
                      className="flex items-center px-3 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer outline-none"
                    >
                      <Shield className="w-4 h-4 mr-2.5 text-emerald-500" />
                      System Admin Console
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Item
                    onClick={() => navigate('/settings')}
                    className="flex items-center px-3 py-2.5 text-xs font-semibold text-app-body rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none"
                  >
                    <Settings className="w-4 h-4 mr-2.5 text-app-muted" />
                    Mail Settings
                  </DropdownMenu.Item>
                </div>

                <div className="border-t border-app-border p-2">
                  <DropdownMenu.Item
                    onClick={() => { signOut(); navigate('/signin'); }}
                    className="flex items-center px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer outline-none"
                  >
                    <LogOut className="w-4 h-4 mr-2.5 text-rose-500" />
                    Sign out of MEXO
                  </DropdownMenu.Item>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      {/* Render Mobile Navigation Drawer */}
      <MobileMailDrawer />
    </>
  );
};
