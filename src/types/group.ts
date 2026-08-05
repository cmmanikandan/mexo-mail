export type GroupRole = 'owner' | 'manager' | 'member';

export type GroupPrivacy = 'public' | 'private' | 'invite_only';

export type GroupPostingPermission = 'everyone' | 'members' | 'managers' | 'owner_only';

export interface GroupMember {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: GroupRole;
  joinedAt: string;
}

export interface MexoGroup {
  id: string;
  name: string; // e.g. "III IT A"
  address: string; // e.g. "iii-it-a@mexo.com"
  description: string;
  avatarUrl?: string;
  memberCount: number;
  privacy: GroupPrivacy;
  postingPermission: GroupPostingPermission;
  viewMembersPermission: 'everyone' | 'members' | 'managers' | 'owner_only';
  members: GroupMember[];
  createdAt: string;
}
