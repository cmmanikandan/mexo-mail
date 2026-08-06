export type UserRole = 'user' | 'system_admin';

export interface MexoUser {
  id: string;
  username: string; // e.g. "manikandan"
  email: string;    // e.g. "manikandan@mexo.com"
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  recoveryEmail?: string;
  recoveryPhone?: string;
  dob?: string;
  gender?: string;
  password?: string;
  status: 'active' | 'suspended';
  storageUsedBytes: number;
  storageLimitBytes: number;
  createdAt: string;
  lastActiveAt: string;
  twoFactorEnabled: boolean;
  requiresPasswordChange?: boolean;
  createdByAdmin?: boolean;
}

export interface UserSession {
  id: string;
  deviceName: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SecurityEvent {
  id: string;
  type: 'login_success' | 'login_failed' | 'password_changed' | 'recovery_updated' | 'suspicious_activity';
  timestamp: string;
  device: string;
  location: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'alert';
}
