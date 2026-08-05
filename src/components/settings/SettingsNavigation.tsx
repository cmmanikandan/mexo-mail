import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../services/db';
import { MexoAvatar } from '../common/MexoAvatar';
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
  ChevronRight,
} from 'lucide-react';

export type SettingsSection =
  | 'general'
  | 'appearance'
  | 'inbox'
  | 'compose'
  | 'signatures'
  | 'vacation'
  | 'notifications'
  | 'labels'
  | 'blocked'
  | 'forwarding'
  | 'filters'
  | 'privacy'
  | 'storage'
  | 'offline'
  | 'advanced';

export interface SettingsItem {
  id: SettingsSection;
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  category: 'GENERAL' | 'COMPOSE' | 'MAIL MANAGEMENT' | 'PRIVACY & SYSTEM';
}

export const SETTINGS_ITEMS: SettingsItem[] = [
  // GENERAL
  { id: 'general',       label: 'General',            description: 'Language, time and behavior',     path: '/settings/general',       icon: <Sliders className="w-4 h-4" />,      category: 'GENERAL' },
  { id: 'appearance',    label: 'Appearance',          description: 'Theme and display preferences',   path: '/settings/appearance',    icon: <Palette className="w-4 h-4" />,      category: 'GENERAL' },
  { id: 'inbox',         label: 'Inbox',               description: 'Inbox layout and mail behavior',  path: '/settings/inbox',         icon: <Inbox className="w-4 h-4" />,        category: 'GENERAL' },

  // COMPOSE
  { id: 'compose',       label: 'Writing & Compose',   description: 'Compose and reply preferences',   path: '/settings/writing',       icon: <PenTool className="w-4 h-4" />,      category: 'COMPOSE' },
  { id: 'signatures',    label: 'Signature',           description: 'Manage your email signature',     path: '/settings/signature',     icon: <FileSignature className="w-4 h-4" />,category: 'COMPOSE' },
  { id: 'vacation',      label: 'Vacation Responder',  description: 'Automatic vacation replies',      path: '/settings/vacation',      icon: <Palmtree className="w-4 h-4" />,     category: 'COMPOSE' },

  // MAIL MANAGEMENT
  { id: 'notifications', label: 'Notifications',       description: 'Email and browser alerts',        path: '/settings/notifications', icon: <Bell className="w-4 h-4" />,        category: 'MAIL MANAGEMENT' },
  { id: 'labels',        label: 'Labels',              description: 'Create and manage labels',        path: '/settings/labels',        icon: <Tag className="w-4 h-4" />,         category: 'MAIL MANAGEMENT' },
  { id: 'blocked',       label: 'Blocked Addresses',   description: 'Manage blocked senders',          path: '/settings/blocked',       icon: <ShieldOff className="w-4 h-4" />,   category: 'MAIL MANAGEMENT' },
  { id: 'forwarding',    label: 'Forwarding',          description: 'Forward incoming mail',           path: '/settings/forwarding',    icon: <Forward className="w-4 h-4" />,     category: 'MAIL MANAGEMENT' },
  { id: 'filters',       label: 'Filters & Rules',     description: 'Automate incoming mail',          path: '/settings/filters',       icon: <Filter className="w-4 h-4" />,      category: 'MAIL MANAGEMENT' },

  // PRIVACY & SYSTEM
  { id: 'privacy',       label: 'Privacy',             description: 'Mail privacy preferences',        path: '/settings/privacy',       icon: <Eye className="w-4 h-4" />,          category: 'PRIVACY & SYSTEM' },
  { id: 'storage',       label: 'Storage',             description: 'Mailbox storage usage',           path: '/settings/storage',       icon: <HardDrive className="w-4 h-4" />,    category: 'PRIVACY & SYSTEM' },
  { id: 'offline',       label: 'Offline',             description: 'Offline mailbox availability',    path: '/settings/offline',       icon: <WifiOff className="w-4 h-4" />,      category: 'PRIVACY & SYSTEM' },
  { id: 'advanced',      label: 'Advanced',            description: 'Advanced mailbox controls',       path: '/settings/advanced',      icon: <Cpu className="w-4 h-4" />,         category: 'PRIVACY & SYSTEM' },
];

export const SettingsNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const currentUser = db.getCurrentUser();

  const categories: SettingsItem['category'][] = [
    'GENERAL',
    'COMPOSE',
    'MAIL MANAGEMENT',
    'PRIVACY & SYSTEM',
  ];

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Signed-in Account Identity Card */}
      <div
        onClick={() => navigate('/account')}
        className="p-3 rounded-2xl bg-[#E8F1FF] dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center space-x-3 cursor-pointer hover:bg-blue-100/70 dark:hover:bg-blue-900/60 transition-all shadow-xs"
        title="Manage MEXO Account"
      >
        <MexoAvatar
          name={`${currentUser.firstName} ${currentUser.lastName}`}
          src={currentUser.avatarUrl}
          size="md"
          className="w-10 h-10 text-xs shadow-sm flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs text-app-heading truncate">
            {currentUser.firstName} {currentUser.lastName}
          </p>
          <p className="text-[11px] text-app-primary font-mono truncate mt-0.5">
            {currentUser.email}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-app-primary flex-shrink-0 ml-1" />
      </div>

      {/* Categorized Navigation List */}
      <div className="space-y-4 pt-1">
        {categories.map((cat) => {
          const catItems = SETTINGS_ITEMS.filter((i) => i.category === cat);
          return (
            <div key={cat}>
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1.5 px-2">
                {cat}
              </p>
              <div className="space-y-0.5">
                {catItems.map((item) => {
                  const isActive =
                    currentPath === item.path ||
                    (item.id === 'general' && currentPath === '/settings');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-[#E8F1FF] text-[#0B57D0] dark:bg-blue-950/80 dark:text-blue-400 font-extrabold shadow-xs'
                          : 'text-app-body hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold'
                      }`}
                    >
                      <span className={isActive ? 'text-[#0B57D0] dark:text-blue-400 font-bold' : 'text-app-muted'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
