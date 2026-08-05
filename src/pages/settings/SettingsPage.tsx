import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AccountSettingsLayout } from '../../components/layout/AccountSettingsLayout';
import { SettingsNavigation, SETTINGS_ITEMS } from '../../components/settings/SettingsNavigation';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoInput } from '../../components/common/MexoInput';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { MexoBadge } from '../../components/common/MexoBadge';
import { ComposeContainer } from '../../components/compose/ComposeModal';
import { MexoToastContainer } from '../../components/common/MexoToast';
import { useMailStore } from '../../store/mailStore';
import { useUIStore } from '../../store/uiStore';
import { db, UserSettings } from '../../services/db';
import { notificationService } from '../../services/notificationService';
import {
  Sliders,
  Palette,
  Inbox,
  PenTool,
  FileSignature,
  Palmtree,
  Bell,
  Tag,
  ShieldOff,
  Forward,
  Filter,
  Eye,
  HardDrive,
  WifiOff,
  Cpu,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  ArrowLeft,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Check,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// ─── Mobile Settings Home ───────────────────────────────────────────────────────
const MobileSettingsHome: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = db.getCurrentUser();

  const handleBack = () => {
    navigate('/mail/inbox');
  };

  const groups = [
    {
      label: 'GENERAL',
      items: SETTINGS_ITEMS.filter((i) => i.category === 'GENERAL'),
    },
    {
      label: 'COMPOSE',
      items: SETTINGS_ITEMS.filter((i) => i.category === 'COMPOSE'),
    },
    {
      label: 'MAIL MANAGEMENT',
      items: SETTINGS_ITEMS.filter((i) => i.category === 'MAIL MANAGEMENT'),
    },
    {
      label: 'PRIVACY & SYSTEM',
      items: SETTINGS_ITEMS.filter((i) => i.category === 'PRIVACY & SYSTEM'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] dark:bg-[#0D1117] font-sans text-slate-900 dark:text-slate-100 select-none">
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-app-border shadow-sm">
        <div
          onClick={handleBack}
          className="flex items-center h-14 px-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <button
            onClick={handleBack}
            className="p-2 rounded-xl text-app-heading flex-shrink-0"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-base font-bold text-app-heading truncate px-1">Mail Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-12 pt-3">
        <div className="px-4 space-y-5">
          {/* Account Identity Card */}
          <div>
            <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2 px-1">
              ACCOUNT
            </p>
            <div
              onClick={() => navigate('/account')}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 flex items-center space-x-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-98 transition-all shadow-sm"
            >
              <MexoAvatar
                name={`${currentUser.firstName} ${currentUser.lastName}`}
                src={currentUser.avatarUrl}
                size="lg"
                className="w-12 h-12 text-lg shadow-sm flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-app-heading truncate">
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                <p className="text-xs text-app-muted truncate font-mono mt-0.5">
                  {currentUser.email}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
            </div>
          </div>

          {/* Setting Group Cards */}
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2 px-1">
                {group.label}
              </p>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
                {group.items.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 transition-colors min-h-[64px] ${
                      idx < group.items.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/40' : ''
                    }`}
                  >
                    <span className="text-app-muted mr-3.5 flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-app-heading">{item.label}</p>
                      <p className="text-xs text-app-muted mt-0.5">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ComposeContainer />
      <MexoToastContainer />
    </div>
  );
};

// ─── Desktop Settings Overview (left pane default) ────────────────────────────
const DesktopSettingsDefault: React.FC = () => (
  <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm flex flex-col items-center justify-center text-center min-h-[340px]">
    <SettingsIcon className="w-10 h-10 text-app-muted mb-3" />
    <h3 className="text-base font-bold text-app-heading mb-1">Mail Settings</h3>
    <p className="text-xs text-app-muted max-w-sm">Select a category from the sidebar to configure your mailbox preferences, signature, rules and storage.</p>
  </div>
);

// ─── Main SettingsPage Component ──────────────────────────────────────────────
export const SettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { density, setDensity } = useMailStore();
  const { theme, setTheme, addToast } = useUIStore();

  const currentUser = db.getCurrentUser();
  const currentPath = location.pathname;
  const isSettingsRoot = currentPath === '/settings' || currentPath === '/settings/';

  // Persistent settings state
  const [settings, setSettings] = useState<UserSettings>(db.getSettings());

  useEffect(() => {
    setSettings(db.getSettings());
  }, [currentPath]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = db.updateSettings({ [key]: value });
    setSettings(updated);
    addToast({ message: 'Settings saved.', type: 'success' });
  };

  // Section route flags
  const isGeneral       = currentPath.includes('/general');
  const isAppearance    = currentPath.includes('/appearance');
  const isInbox         = currentPath.includes('/inbox');
  const isWriting       = currentPath.includes('/writing') || currentPath.includes('/compose');
  const isSignature     = currentPath.includes('/signature');
  const isVacation      = currentPath.includes('/vacation');
  const isNotifications = currentPath.includes('/notifications');
  const isLabels        = currentPath.includes('/labels');
  const isBlocked       = currentPath.includes('/blocked');
  const isForwarding    = currentPath.includes('/forwarding');
  const isFilters       = currentPath.includes('/filters');
  const isPrivacy       = currentPath.includes('/privacy');
  const isStorage       = currentPath.includes('/storage');
  const isOffline       = currentPath.includes('/offline');
  const isAdvanced      = currentPath.includes('/advanced');

  // Blocked address state
  const [newBlockedEmail, setNewBlockedEmail] = useState('');
  const handleAddBlocked = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBlockedEmail.trim().toLowerCase();
    if (!clean) return;
    if (settings.blockedSenders.includes(clean)) {
      addToast({ message: 'Address is already blocked.', type: 'warning' });
      return;
    }
    const updatedList = [...settings.blockedSenders, clean];
    updateSetting('blockedSenders', updatedList);
    setNewBlockedEmail('');
  };

  const handleRemoveBlocked = (email: string) => {
    const updatedList = settings.blockedSenders.filter((b) => b !== email);
    updateSetting('blockedSenders', updatedList);
  };

  // ── Mobile Settings Root ──
  if (isSettingsRoot) {
    return (
      <>
        <div className="hidden md:block">
          <AccountSettingsLayout
            title="Mail Settings"
            subtitle="Mailbox Preferences & Rules"
            sidebar={<SettingsNavigation />}
          >
            <DesktopSettingsDefault />
          </AccountSettingsLayout>
        </div>
        <div className="md:hidden">
          <MobileSettingsHome />
        </div>
      </>
    );
  }

  const getSubpageTitle = () => {
    if (isGeneral)       return 'General Preferences';
    if (isAppearance)    return 'Appearance';
    if (isInbox)         return 'Inbox Settings';
    if (isWriting)       return 'Writing & Compose';
    if (isSignature)     return 'Signature';
    if (isVacation)      return 'Vacation Responder';
    if (isNotifications) return 'Notifications';
    if (isLabels)        return 'Labels';
    if (isBlocked)       return 'Blocked Addresses';
    if (isForwarding)    return 'Forwarding';
    if (isFilters)       return 'Filters & Rules';
    if (isPrivacy)       return 'Privacy';
    if (isStorage)       return 'Storage';
    if (isOffline)       return 'Offline';
    if (isAdvanced)      return 'Advanced';
    return 'Mail Settings';
  };

  const cardCls = 'bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-6 mx-4 md:mx-0';

  const renderContent = () => {
    // 1. GENERAL
    if (isGeneral) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Sliders className="w-5 h-5 mr-2 text-app-primary" /> General Preferences
          </h2>
          <div className="space-y-5 text-xs max-w-lg">
            <div>
              <label className="block font-semibold text-app-body mb-1.5">Language</label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full max-w-xs h-11 px-3 rounded-xl border border-app-border bg-white dark:bg-slate-800 text-app-heading text-xs font-medium"
              >
                <option>English (United States)</option>
                <option>English (United Kingdom)</option>
                <option>Tamil</option>
                <option>Hindi</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-app-body mb-2">Time Format</label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    checked={settings.timeFormat === '12'}
                    onChange={() => updateSetting('timeFormat', '12')}
                    className="text-app-primary"
                  />
                  <span>12-hour (1:30 PM)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    checked={settings.timeFormat === '24'}
                    onChange={() => updateSetting('timeFormat', '24')}
                    className="text-app-primary"
                  />
                  <span>24-hour (13:30)</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-app-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-app-heading">Conversation View</h4>
                  <p className="text-[11px] text-app-muted">Group emails with the same subject into threads.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.conversationView}
                  onChange={(e) => updateSetting('conversationView', e.target.checked)}
                  className="w-4 h-4 rounded text-app-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-app-heading">Confirm Before Deleting</h4>
                  <p className="text-[11px] text-app-muted">Ask confirmation before permanent removal.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.confirmBeforeDelete}
                  onChange={(e) => updateSetting('confirmBeforeDelete', e.target.checked)}
                  className="w-4 h-4 rounded text-app-primary"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. APPEARANCE
    if (isAppearance) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Palette className="w-5 h-5 mr-2 text-app-primary" /> Appearance & Theme
          </h2>
          <div className="space-y-5 text-xs">
            <div>
              <label className="block font-semibold text-app-body mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-3 max-w-xs">
                {([
                  ['light', 'Light', <Sun key="l" className="w-5 h-5 text-amber-500" />],
                  ['dark', 'Dark', <Moon key="d" className="w-5 h-5 text-mexo-400" />],
                  ['system', 'System', <Monitor key="s" className="w-5 h-5 text-slate-500" />],
                ] as const).map(([val, lbl, icon]) => (
                  <button
                    key={val}
                    onClick={() => setTheme(val)}
                    className={`p-3 rounded-xl border flex flex-col items-center space-y-1.5 font-semibold transition-colors ${
                      theme === val
                        ? 'border-app-primary bg-app-softBrandSurface text-app-primary'
                        : 'border-app-border hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {icon}
                    <span>{lbl}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-app-body mb-2">Accent Color</label>
              <div className="flex items-center space-x-3 max-w-sm">
                {[
                  { name: 'MEXO Blue', color: '#0878e8' },
                  { name: 'Indigo', color: '#6366f1' },
                  { name: 'Purple', color: '#8b5cf6' },
                  { name: 'Emerald', color: '#10b981' },
                  { name: 'Amber', color: '#f59e0b' },
                  { name: 'Rose', color: '#f43f5e' },
                  { name: 'Teal', color: '#14b8a6' },
                  { name: 'Dark Slate', color: '#475569' },
                ].map((c) => {
                  const isSelected = (settings.accentColor || '#0878e8') === c.color;
                  return (
                    <button
                      key={c.color}
                      onClick={() => {
                        updateSetting('accentColor', c.color);
                        db.applyAccentColor(c.color);
                      }}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                        isSelected ? 'ring-2 ring-offset-2 ring-[#0878e8] scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    >
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-app-body mb-2">Reading Pane Position</label>
              <div className="grid grid-cols-3 gap-3 max-w-xs">
                {([
                  ['off', 'No split'],
                  ['right', 'Right of list'],
                  ['below', 'Below list'],
                ] as const).map(([pos, label]) => (
                  <button
                    key={pos}
                    onClick={() => updateSetting('readingPanePosition', pos)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold capitalize transition-colors ${
                      (settings.readingPanePosition || 'right') === pos
                        ? 'border-app-primary bg-app-softBrandSurface text-app-primary font-extrabold'
                        : 'border-app-border hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. INBOX
    if (isInbox) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Inbox className="w-5 h-5 mr-2 text-app-primary" /> Inbox Settings
          </h2>
          <div className="space-y-5 text-xs max-w-lg">
            <div>
              <label className="block font-semibold text-app-body mb-1.5">Inbox Type</label>
              <select
                value={settings.inboxType}
                onChange={(e) => updateSetting('inboxType', e.target.value as any)}
                className="w-full max-w-xs h-11 px-3 rounded-xl border border-app-border bg-white dark:bg-slate-800 text-app-heading font-medium"
              >
                <option value="default">Default</option>
                <option value="unread">Unread first</option>
                <option value="starred">Starred first</option>
                <option value="important">Important first</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-app-body mb-1.5">Messages Per Page</label>
              <select
                value={settings.messagesPerPage}
                onChange={(e) => updateSetting('messagesPerPage', Number(e.target.value))}
                className="w-full max-w-xs h-11 px-3 rounded-xl border border-app-border bg-white dark:bg-slate-800 text-app-heading font-medium"
              >
                <option value={25}>25 messages</option>
                <option value={50}>50 messages</option>
                <option value={100}>100 messages</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    // 4. WRITING & COMPOSE
    if (isWriting) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <PenTool className="w-5 h-5 mr-2 text-app-primary" /> Writing & Compose
          </h2>
          <div className="space-y-5 text-xs max-w-md">
            <div>
              <label className="block font-semibold text-app-body mb-1.5">Undo Send Duration</label>
              <select
                value={settings.undoSendSeconds}
                onChange={(e) => updateSetting('undoSendSeconds', Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl border border-app-border bg-white dark:bg-slate-800 text-app-heading font-medium"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={20}>20 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-app-body mb-2">Default Reply Behavior</label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="replyBehavior"
                    checked={settings.defaultReplyBehavior === 'reply'}
                    onChange={() => updateSetting('defaultReplyBehavior', 'reply')}
                    className="text-app-primary"
                  />
                  <span>Reply</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="replyBehavior"
                    checked={settings.defaultReplyBehavior === 'reply_all'}
                    onChange={() => updateSetting('defaultReplyBehavior', 'reply_all')}
                    className="text-app-primary"
                  />
                  <span>Reply All</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-app-border space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h4 className="font-bold text-app-heading">Auto-Save Drafts</h4>
                  <p className="text-[11px] text-app-muted">Save drafts automatically while typing.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSaveDrafts}
                  onChange={(e) => updateSetting('autoSaveDrafts', e.target.checked)}
                  className="w-4 h-4 rounded text-app-primary"
                />
              </label>
            </div>
          </div>
        </div>
      );
    }

    // 5. SIGNATURE
    if (isSignature) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <FileSignature className="w-5 h-5 mr-2 text-app-primary" /> Email Signature
          </h2>
          <div className="space-y-4 text-xs max-w-lg">
            <MexoInput
              label="Signature Name"
              value={settings.signatureName}
              onChange={(e) => updateSetting('signatureName', e.target.value)}
            />
            <div>
              <label className="block font-semibold text-app-body mb-1">Signature Content</label>
              <textarea
                value={settings.signatureContent}
                onChange={(e) => updateSetting('signatureContent', e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl border border-app-border bg-white dark:bg-slate-800 text-app-heading text-xs font-sans"
              />
            </div>
            <div className="space-y-2 pt-2 border-t border-app-border">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.signatureNewMail}
                  onChange={(e) => updateSetting('signatureNewMail', e.target.checked)}
                  className="w-4 h-4 rounded text-app-primary"
                />
                <span className="font-semibold text-app-heading">Insert signature for new emails</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.signatureReplies}
                  onChange={(e) => updateSetting('signatureReplies', e.target.checked)}
                  className="w-4 h-4 rounded text-app-primary"
                />
                <span className="font-semibold text-app-heading">Insert signature for replies / forwards</span>
              </label>
            </div>
          </div>
        </div>
      );
    }

    // 6. VACATION RESPONDER
    if (isVacation) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Palmtree className="w-5 h-5 mr-2 text-app-primary" /> Vacation Responder
          </h2>
          <div className="space-y-4 text-xs max-w-lg">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-app-secondarySurface border border-app-border">
              <div>
                <h4 className="font-bold text-app-heading">Enable Vacation Responder</h4>
                <p className="text-[11px] text-app-muted">Send automated response for incoming messages.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.vacationEnabled}
                onChange={(e) => updateSetting('vacationEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-app-primary"
              />
            </div>

            {settings.vacationEnabled && (
              <div className="space-y-3 pt-2">
                <MexoInput
                  label="Subject"
                  value={settings.vacationSubject}
                  onChange={(e) => updateSetting('vacationSubject', e.target.value)}
                />
                <div>
                  <label className="block font-semibold text-app-body mb-1">Message</label>
                  <textarea
                    value={settings.vacationBody}
                    onChange={(e) => updateSetting('vacationBody', e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-app-border bg-white dark:bg-slate-800 text-app-heading text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 7. NOTIFICATIONS
    if (isNotifications) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Bell className="w-5 h-5 mr-2 text-app-primary" /> Notifications
          </h2>
          <div className="space-y-3 text-xs max-w-lg">
            <div className="flex items-center justify-between p-4 rounded-xl border border-app-border">
              <div>
                <h4 className="font-bold text-app-heading">Desktop Push Notifications</h4>
                <p className="text-[11px] text-app-muted mt-0.5">Show system notifications even when browser tab is inactive.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!settings.notifyBrowser) {
                    const perm = await notificationService.requestPermission();
                    if (perm === 'granted') {
                      updateSetting('notifyBrowser', true);
                      addToast({ message: 'Desktop notifications enabled!', type: 'success' });
                    } else {
                      addToast({ message: 'Notification permission denied in browser.', type: 'warning' });
                    }
                  } else {
                    updateSetting('notifyBrowser', false);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  settings.notifyBrowser
                    ? 'bg-[#0878e8] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {settings.notifyBrowser ? 'Enabled' : 'Enable'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-app-border">
              <div>
                <h4 className="font-bold text-app-heading">Notification Sound</h4>
                <p className="text-[11px] text-app-muted mt-0.5">Play a chime when alerts arrive.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifySound}
                onChange={(e) => updateSetting('notifySound', e.target.checked)}
                className="w-4 h-4 rounded text-app-primary"
              />
            </div>
          </div>
        </div>
      );
    }

    // 8. LABELS
    if (isLabels) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Tag className="w-5 h-5 mr-2 text-app-primary" /> Labels Management
          </h2>
          <p className="text-xs text-app-body">
            Manage your custom labels. Labels can also be created directly from the sidebar.
          </p>
          <div className="space-y-2 max-w-lg">
            {db.getLabels().map((lbl) => (
              <div
                key={lbl.id}
                className="flex items-center justify-between p-3 rounded-xl border border-app-border bg-white dark:bg-slate-800"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: lbl.color || '#0878e8' }} />
                  <span className="text-xs font-bold text-app-heading">{lbl.name}</span>
                </div>
                <MexoBadge colorHex={lbl.color} size="sm">
                  Active
                </MexoBadge>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 9. BLOCKED ADDRESSES
    if (isBlocked) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <ShieldOff className="w-5 h-5 mr-2 text-rose-600" /> Blocked Addresses
          </h2>
          <div className="space-y-4 text-xs max-w-lg">
            <form onSubmit={handleAddBlocked} className="flex items-center space-x-2">
              <input
                type="email"
                placeholder="Enter email to block..."
                value={newBlockedEmail}
                onChange={(e) => setNewBlockedEmail(e.target.value)}
                className="flex-1 h-11 px-3 rounded-xl border border-app-border bg-white dark:bg-slate-800 text-app-heading text-xs"
              />
              <MexoButton type="submit" variant="outline" size="sm">
                Block
              </MexoButton>
            </form>

            {settings.blockedSenders.length === 0 ? (
              <div className="p-4 rounded-xl bg-app-secondarySurface border border-app-border text-center text-app-muted">
                No blocked addresses.
              </div>
            ) : (
              <div className="space-y-2">
                {settings.blockedSenders.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 rounded-xl border border-app-border bg-white dark:bg-slate-800"
                  >
                    <span className="font-mono font-semibold text-app-heading">{email}</span>
                    <button
                      onClick={() => handleRemoveBlocked(email)}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 10. FORWARDING
    if (isForwarding) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Forward className="w-5 h-5 mr-2 text-app-primary" /> Mail Forwarding
          </h2>
          <div className="space-y-4 text-xs max-w-lg">
            <div className="flex items-center justify-between p-4 rounded-xl border border-app-border">
              <div>
                <h4 className="font-bold text-app-heading">Enable Forwarding</h4>
                <p className="text-[11px] text-app-muted">Automatically forward incoming mail to another address.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.forwardingEnabled}
                onChange={(e) => updateSetting('forwardingEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-app-primary"
              />
            </div>

            {settings.forwardingEnabled && (
              <MexoInput
                label="Forward to Email"
                placeholder="e.g. forward@example.com"
                value={settings.forwardingAddress}
                onChange={(e) => updateSetting('forwardingAddress', e.target.value)}
              />
            )}
          </div>
        </div>
      );
    }

    // 11. FILTERS & RULES
    if (isFilters) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Filter className="w-5 h-5 mr-2 text-app-primary" /> Filters & Rules
          </h2>
          <p className="text-xs text-app-body">
            Automate actions on incoming messages based on sender, subject, or keywords.
          </p>
          <div className="p-4 rounded-xl bg-app-secondarySurface border border-app-border text-xs text-app-muted">
            Search filters set from the Search bar or Filter modal are automatically applied to your mailbox.
          </div>
        </div>
      );
    }

    // 12. PRIVACY
    if (isPrivacy) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Eye className="w-5 h-5 mr-2 text-purple-600" /> Mail Privacy
          </h2>
          <div className="space-y-3 text-xs max-w-lg">
            <div className="flex items-center justify-between p-4 rounded-xl border border-app-border">
              <div>
                <h4 className="font-bold text-app-heading font-sans">External Images</h4>
                <p className="text-[11px] text-app-muted mt-0.5">Automatically display external images in emails.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacyLoadImages}
                onChange={(e) => updateSetting('privacyLoadImages', e.target.checked)}
                className="w-4 h-4 rounded text-app-primary"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-app-border">
              <div>
                <h4 className="font-bold text-app-heading">Pixel Tracking Protection</h4>
                <p className="text-[11px] text-app-muted mt-0.5">Block known email tracking pixels.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacyPixelBlock}
                onChange={(e) => updateSetting('privacyPixelBlock', e.target.checked)}
                className="w-4 h-4 rounded text-app-primary"
              />
            </div>
          </div>
        </div>
      );
    }

    // 13. STORAGE
    if (isStorage) {
      const storageInfo = db.getStorageForUser(currentUser.email);
      const limitGB = (storageInfo.limitBytes / (1024 * 1024 * 1024)).toFixed(0);

      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <HardDrive className="w-5 h-5 mr-2 text-emerald-600" /> Mailbox Storage
          </h2>
          <div className="space-y-4 text-xs max-w-lg">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-app-border space-y-3">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-app-heading">{storageInfo.usedFormatted} of {limitGB} GB used</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  {storageInfo.percent}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md transition-all duration-500"
                  style={{ width: `${Math.max(storageInfo.percent, 3)}%` }}
                />
              </div>
              <p className="text-[11px] text-app-muted">
                Your MEXO Account includes 15 GB of storage shared across Mail and attachments.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 14. OFFLINE
    if (isOffline) {
      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <WifiOff className="w-5 h-5 mr-2 text-app-primary" /> Offline Mail
          </h2>
          <div className="space-y-4 text-xs max-w-lg">
            <div className="flex items-center justify-between p-4 rounded-xl border border-app-border">
              <div>
                <h4 className="font-bold text-app-heading">Enable Offline Mail</h4>
                <p className="text-[11px] text-app-muted">Keep recent emails accessible without internet.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.offlineEnabled}
                onChange={(e) => updateSetting('offlineEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-app-primary"
              />
            </div>
          </div>
        </div>
      );
    }

    // 15. ADVANCED & IMPORT/EXPORT
    if (isAdvanced) {
      const handleExportContactsCSV = () => {
        const contacts = db.getContacts();
        const headers = ['Name', 'Email', 'Phone', 'Company', 'Notes'];
        const rows = contacts.map((c) => [
          `"${c.displayName || `${c.firstName} ${c.lastName}`.trim()}"`,
          `"${c.email || ''}"`,
          `"${c.phone || ''}"`,
          `"${c.organization || ''}"`,
          `"${(c.notes || '').replace(/"/g, '""')}"`,
        ]);
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MEXO_Contacts_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        addToast({ message: 'Exported contacts to CSV!', type: 'success' });
      };

      const handleExportMailJSON = () => {
        const msgs = db.getMessagesForUser(currentUser.email);
        const dataStr = JSON.stringify(msgs, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MEXO_Mail_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        addToast({ message: 'Exported mailbox backup to JSON!', type: 'success' });
      };

      return (
        <div className={cardCls}>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-app-primary" /> Advanced & Data Management
          </h2>
          <div className="space-y-4 text-xs max-w-lg">
            <div className="flex items-center justify-between p-4 rounded-xl border border-app-border">
              <div>
                <h4 className="font-bold text-app-heading">Keyboard Shortcuts</h4>
                <p className="text-[11px] text-app-muted">Press C to Compose, / to Search, ? for Shortcuts.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.keyboardShortcutsEnabled}
                onChange={(e) => updateSetting('keyboardShortcutsEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-app-primary"
              />
            </div>

            <div className="pt-3 border-t border-app-border space-y-3">
              <h4 className="font-bold text-app-heading">Data Export & Backup</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportContactsCSV}
                  className="p-3 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-semibold text-app-heading flex flex-col items-center justify-center text-center space-y-1 transition-colors"
                >
                  <span className="text-xs font-bold text-[#0878e8]">Export Contacts (.CSV)</span>
                  <span className="text-[10px] text-app-muted">Download address book</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportMailJSON}
                  className="p-3 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-semibold text-app-heading flex flex-col items-center justify-center text-center space-y-1 transition-colors"
                >
                  <span className="text-xs font-bold text-[#0878e8]">Backup Mail (.JSON)</span>
                  <span className="text-[10px] text-app-muted">Download full mail store</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <DesktopSettingsDefault />;
  };

  return (
    <AccountSettingsLayout
      title={getSubpageTitle()}
      subtitle="Mail Settings"
      sidebar={<SettingsNavigation />}
      mobileBackPath="/settings"
    >
      <div className="py-4 md:py-0">{renderContent()}</div>
    </AccountSettingsLayout>
  );
};
