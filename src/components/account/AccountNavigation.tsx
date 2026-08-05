import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Monitor,
  KeyRound,
  Grid,
  Eye,
  HardDrive,
  ChevronRight,
} from 'lucide-react';

export type AccountSection =
  | 'personal'
  | 'security'
  | 'sessions'
  | 'recovery'
  | 'apps'
  | 'privacy'
  | 'storage';

export interface AccountItem {
  id: AccountSection;
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
}

export const ACCOUNT_ITEMS: AccountItem[] = [
  {
    id: 'personal',
    label: 'Personal info',
    description: 'Name, photo and personal data',
    path: '/account/personal-info',
    icon: <User className="w-5 h-5" />,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Password and authentication',
    path: '/account/security',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: 'sessions',
    label: 'Devices & sessions',
    description: 'Manage signed-in devices',
    path: '/account/devices',
    icon: <Monitor className="w-5 h-5" />,
  },
  {
    id: 'recovery',
    label: 'Recovery',
    description: 'Recovery email and options',
    path: '/account/recovery',
    icon: <KeyRound className="w-5 h-5" />,
  },
  {
    id: 'apps',
    label: 'Connected MEXO Apps',
    description: 'Apps connected to your account',
    path: '/account/connected-apps',
    icon: <Grid className="w-5 h-5" />,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'Privacy controls and activity',
    path: '/account/privacy',
    icon: <Eye className="w-5 h-5" />,
  },
  {
    id: 'storage',
    label: 'Data & Storage',
    description: 'Storage usage and your data',
    path: '/account/storage',
    icon: <HardDrive className="w-5 h-5" />,
  },
];

export const AccountNavigation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="space-y-1">
      {ACCOUNT_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => navigate(item.path)}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-app-body hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          <span className="text-app-muted">{item.icon}</span>
          <span>{item.label}</span>
          <ChevronRight className="w-3.5 h-3.5 text-app-muted ml-auto" />
        </button>
      ))}
    </nav>
  );
};
