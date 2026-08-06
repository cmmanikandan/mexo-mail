import { MexoUser } from '../types/user';
import { Message, Thread, Label, FilterRule, UserSignature } from '../types/mail';
import { MexoGroup } from '../types/group';
import { Contact } from '../types/contact';

export const RESERVED_USERNAMES = [
  'welcome',
  'no-reply',
  'noreply',
  'support',
  'admin',
  'administrator',
  'security',
  'help',
  'abuse',
  'postmaster',
  'system',
  'root',
  'mailer-daemon',
];

export const INITIAL_USERS: MexoUser[] = [
  {
    id: 'usr-1',
    username: 'manikandan',
    email: 'manikandan@mexo.com',
    firstName: 'Manikandan',
    lastName: 'Prabhu',
    role: 'user',
    password: 'password123',
    recoveryEmail: 'manikandan.recovery@gmail.com',
    status: 'active',
    storageUsedBytes: 4.8 * 1024 * 1024 * 1024,
    storageLimitBytes: 15 * 1024 * 1024 * 1024,
    createdAt: '2025-01-10T08:00:00Z',
    lastActiveAt: new Date().toISOString(),
    twoFactorEnabled: false,
  },
  {
    id: 'usr-2',
    username: 'arun',
    email: 'arun@mexo.com',
    firstName: 'Arun',
    lastName: 'Kumar',
    role: 'user',
    password: 'password123',
    recoveryEmail: 'arun.k@gmail.com',
    status: 'active',
    storageUsedBytes: 1.2 * 1024 * 1024 * 1024,
    storageLimitBytes: 15 * 1024 * 1024 * 1024,
    createdAt: '2025-01-12T10:00:00Z',
    lastActiveAt: '2026-08-05T09:00:00Z',
    twoFactorEnabled: true,
  },
  {
    id: 'usr-3',
    username: 'priya',
    email: 'priya@mexo.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'user',
    password: 'password123',
    recoveryEmail: 'priya.s@yahoo.com',
    status: 'active',
    storageUsedBytes: 2.1 * 1024 * 1024 * 1024,
    storageLimitBytes: 15 * 1024 * 1024 * 1024,
    createdAt: '2025-02-01T14:30:00Z',
    lastActiveAt: '2026-08-04T18:20:00Z',
    twoFactorEnabled: false,
  },
  {
    id: 'usr-4',
    username: 'admin',
    email: 'admin@mexo.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'system_admin',
    password: 'admin',
    recoveryEmail: 'sec-admin@mexo.com',
    status: 'active',
    storageUsedBytes: 512 * 1024 * 1024,
    storageLimitBytes: 100 * 1024 * 1024 * 1024,
    createdAt: '2025-01-01T00:00:00Z',
    lastActiveAt: new Date().toISOString(),
    twoFactorEnabled: true,
  },
];

export const INITIAL_LABELS: Label[] = [
  { id: 'lbl-work', name: 'Work', color: '#0070d4', unreadCount: 2 },
  { id: 'lbl-projects', name: 'Projects', color: '#10b981', unreadCount: 1 },
  { id: 'lbl-personal', name: 'Personal', color: '#f59e0b', unreadCount: 0 },
  { id: 'lbl-urgent', name: 'Urgent', color: '#f43f5e', unreadCount: 1 },
];

export const INITIAL_GROUPS: MexoGroup[] = [
  {
    id: 'grp-1',
    name: 'III IT A',
    address: 'iii-it-a@mexo.com',
    description: 'Third Year Information Technology Section A Group',
    memberCount: 3,
    privacy: 'private',
    postingPermission: 'members',
    viewMembersPermission: 'members',
    members: [
      { userId: 'usr-1', email: 'manikandan@mexo.com', firstName: 'Manikandan', lastName: 'Prabhu', role: 'owner', joinedAt: '2025-01-15T00:00:00Z' },
      { userId: 'usr-2', email: 'arun@mexo.com', firstName: 'Arun', lastName: 'Kumar', role: 'manager', joinedAt: '2025-01-16T00:00:00Z' },
      { userId: 'usr-3', email: 'priya@mexo.com', firstName: 'Priya', lastName: 'Sharma', role: 'member', joinedAt: '2025-01-17T00:00:00Z' },
    ],
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'grp-2',
    name: 'MEXO Engineering Core',
    address: 'engineering@mexo.com',
    description: 'MEXO Platform Core Architecture & Development Team',
    memberCount: 2,
    privacy: 'invite_only',
    postingPermission: 'members',
    viewMembersPermission: 'members',
    members: [
      { userId: 'usr-1', email: 'manikandan@mexo.com', firstName: 'Manikandan', lastName: 'Prabhu', role: 'owner', joinedAt: '2025-01-01T00:00:00Z' },
      { userId: 'usr-4', email: 'admin@mexo.com', firstName: 'System', lastName: 'Administrator', role: 'manager', joinedAt: '2025-01-01T00:00:00Z' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cnt-1',
    firstName: 'Arun',
    lastName: 'Kumar',
    email: 'arun@mexo.com',
    phone: '+91 98765 43210',
    organization: 'MEXO Inc',
    jobTitle: 'Lead Software Engineer',
    notes: 'Primary collaborator on MEXO Groups engine',
    isFavorite: true,
    isFrequent: true,
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'cnt-2',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya@mexo.com',
    phone: '+91 98123 45678',
    organization: 'MEXO Product Design',
    jobTitle: 'UI/UX Designer',
    notes: 'Handles branding & typography systems',
    isFavorite: true,
    isFrequent: true,
    createdAt: '2025-01-18T00:00:00Z',
  },
  {
    id: 'cnt-3',
    firstName: 'Support',
    lastName: 'Desk',
    email: 'support@mexo.com',
    organization: 'MEXO Operations',
    isFavorite: false,
    isFrequent: false,
    createdAt: '2025-01-01T00:00:00Z',
  }
];

export const INITIAL_MESSAGES: Message[] = [];
