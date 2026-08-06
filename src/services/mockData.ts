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

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-101',
    threadId: 'th-101',
    senderName: 'Arun Kumar',
    senderEmail: 'arun@mexo.com',
    recipients: ['manikandan@mexo.com'],
    subject: 'MEXO Mail Architecture Review & Group Distribution Protocol',
    snippet: 'Hey Mani, I reviewed the MEXO Groups single-attachment storage spec. The deduplication model looks solid...',
    bodyHtml: `<p>Hey Mani,</p>
<p>I reviewed the <strong>MEXO Groups</strong> single-attachment storage spec. The single upload + attachment reference model looks solid! When sending to <code>iii-it-a@mexo.com</code>, all 60 members will receive their individual inbox states without duplicating files on the cloud.</p>
<p>Here is the summary of implementation items:</p>
<ul>
  <li>Database references with composite indexes</li>
  <li>WebSocket push for instant inbox badges</li>
  <li>Single-pass Cloudinary asset signing</li>
</ul>
<p>Let me know when you want to run the load test!</p>
<p>Best regards,<br><strong>Arun Kumar</strong></p>`,
    attachments: [
      {
        id: 'att-1',
        filename: 'MEXO_Groups_Architecture_v2.pdf',
        originalFileName: 'MEXO_Groups_Architecture_v2.pdf',
        mimeType: 'application/pdf',
        fileExtension: 'pdf',
        sizeBytes: 2.4 * 1024 * 1024,
        downloadUrl: '#',
        previewUrl: '#',
      }
    ],
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    userState: {
      recipientEmail: 'manikandan@mexo.com',
      isRead: false,
      isStarred: true,
      isImportant: true,
      isArchived: false,
      isDeleted: false,
      isSpam: false,
      labels: ['lbl-work', 'lbl-projects'],
    }
  },
  {
    id: 'msg-102',
    threadId: 'th-102',
    senderName: 'Priya Sharma',
    senderEmail: 'priya@mexo.com',
    recipients: ['manikandan@mexo.com', 'arun@mexo.com'],
    subject: 'Brand Design Guidelines & Typography Tokens for MEXO Mail',
    snippet: 'Hi Manikandan, I completed the design system specification for MEXO Mail. The HSL blue and mint green palette is ready...',
    bodyHtml: `<p>Hi Manikandan,</p>
<p>I completed the design system specification for <strong>MEXO Mail</strong>. We are adhering to:</p>
<ul>
  <li><strong>Primary Interactive Color:</strong> Vibrant Blue (#0070d4)</li>
  <li><strong>Success / Available Indicator:</strong> Emerald Mint (#10b981)</li>
  <li><strong>Typography:</strong> Inter Sans-Serif with strict 8px spacing grid</li>
</ul>
<p>Check out the updated specs. Tagline <em>"Made to Connect."</em> will strictly remain on auth screens and onboarding.</p>
<p>Cheers,<br>Priya</p>`,
    attachments: [],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    userState: {
      recipientEmail: 'manikandan@mexo.com',
      isRead: false,
      isStarred: false,
      isImportant: true,
      isArchived: false,
      isDeleted: false,
      isSpam: false,
      labels: ['lbl-work', 'lbl-urgent'],
    }
  },
  {
    id: 'msg-103',
    threadId: 'th-103',
    senderName: 'III IT A Group',
    senderEmail: 'iii-it-a@mexo.com',
    recipients: ['manikandan@mexo.com'],
    subject: '[III IT A] Schedule for Mid-Term Project Demonstrations',
    snippet: 'Attention Members of III IT A: Attached is the revised schedule for the upcoming project reviews...',
    bodyHtml: `<p>Dear Members of <strong>III IT A</strong>,</p>
<p>Please find attached the schedule for our upcoming project reviews next week. Everyone is expected to present their live working code.</p>
<p>Reminder: Group distribution allows every member to view the announcements directly in their inbox.</p>
<p>Regards,<br>Class Representative</p>`,
    attachments: [
      {
        id: 'att-2',
        filename: 'Project_Schedule_III_IT_A.docx',
        originalFileName: 'Project_Schedule_III_IT_A.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileExtension: 'docx',
        sizeBytes: 1.1 * 1024 * 1024,
        downloadUrl: '#',
      }
    ],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    userState: {
      recipientEmail: 'manikandan@mexo.com',
      isRead: true,
      isStarred: false,
      isImportant: false,
      isArchived: false,
      isDeleted: false,
      isSpam: false,
      labels: ['lbl-projects'],
    }
  },
  {
    id: 'msg-104',
    threadId: 'th-104',
    senderName: 'System Administrator',
    senderEmail: 'admin@mexo.com',
    recipients: ['manikandan@mexo.com'],
    subject: 'Security Alert: New Sign-in from Chrome on Windows 11',
    snippet: 'Your MEXO Account was accessed from a new device in Chennai, India. If this was you, no action is needed...',
    bodyHtml: `<p>Hello Manikandan,</p>
<p>Your <strong>MEXO Account</strong> (<code>manikandan@mexo.com</code>) was accessed from a new device.</p>
<p><strong>Location:</strong> Chennai, TN, India<br>
<strong>Device:</strong> Chrome on Windows 11<br>
<strong>Time:</strong> ${new Date().toLocaleString()}</p>
<p>If you did not perform this login, please immediately revoke session access from your Account Security settings.</p>`,
    attachments: [],
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    userState: {
      recipientEmail: 'manikandan@mexo.com',
      isRead: true,
      isStarred: false,
      isImportant: true,
      isArchived: false,
      isDeleted: false,
      isSpam: false,
      labels: [],
    }
  }
];
