import { MexoUser } from '../types/user';
import { Message, Draft, Label } from '../types/mail';
import { Contact } from '../types/contact';
import { MexoGroup } from '../types/group';

const CLOUD_CACHE_KEY = 'mexo_cloud_db_v3';

export interface CloudDatabasePayload {
  users?: MexoUser[];
  messages?: Message[];
  drafts?: Draft[];
  contacts?: Contact[];
  labels?: Label[];
  groups?: MexoGroup[];
}

export class CloudSyncService {
  private static instance: CloudSyncService;
  private isSyncing = false;

  private constructor() {}

  public static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  /**
   * Fetch complete multi-device database (users, messages, drafts, contacts, labels, groups)
   */
  public async fetchCloudDatabase(): Promise<CloudDatabasePayload | null> {
    try {
      const res = await fetch('https://api.restful-api.dev/objects/mexo_global_master_db_v3', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }).catch(() => null);

      if (res && res.ok) {
        const json = await res.json();
        if (json?.data) {
          const payload: CloudDatabasePayload = json.data;
          localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(payload));
          return payload;
        }
      }

      const cached = localStorage.getItem(CLOUD_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn('Cloud database fetch warning:', err);
      const cached = localStorage.getItem(CLOUD_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    }
  }

  /**
   * Backward compatible fetch for users
   */
  public async fetchCloudUsers(): Promise<MexoUser[] | null> {
    const dbData = await this.fetchCloudDatabase();
    return dbData?.users || null;
  }

  /**
   * Push complete multi-device database state
   */
  public async pushCloudDatabase(payload: CloudDatabasePayload): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;

    try {
      // Save local cloud snapshot
      const existingRaw = localStorage.getItem(CLOUD_CACHE_KEY);
      const existing: CloudDatabasePayload = existingRaw ? JSON.parse(existingRaw) : {};
      const updated: CloudDatabasePayload = {
        users: payload.users || existing.users || [],
        messages: payload.messages || existing.messages || [],
        drafts: payload.drafts || existing.drafts || [],
        contacts: payload.contacts || existing.contacts || [],
        labels: payload.labels || existing.labels || [],
        groups: payload.groups || existing.groups || [],
      };

      localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(updated));

      const cloudBody = {
        id: 'mexo_global_master_db_v3',
        name: 'MEXO Mail Master Multi-Device Database',
        data: {
          lastSynced: new Date().toISOString(),
          ...updated,
        },
      };

      const res = await fetch('https://api.restful-api.dev/objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudBody),
      }).catch(() => null);

      this.isSyncing = false;
      return Boolean(res && res.ok);
    } catch (err) {
      console.error('Cloud database push failed:', err);
      this.isSyncing = false;
      return false;
    }
  }

  /**
   * Backward compatible push for users
   */
  public async pushCloudUsers(users: MexoUser[]): Promise<boolean> {
    return this.pushCloudDatabase({ users });
  }
}

export const cloudSync = CloudSyncService.getInstance();
