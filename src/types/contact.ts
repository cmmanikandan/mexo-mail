export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string; // e.g. "arun@mexo.com"
  avatarUrl?: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
  notes?: string;
  isFavorite: boolean;
  isFrequent: boolean;
  groupIds?: string[];
  createdAt: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  contactCount: number;
}
