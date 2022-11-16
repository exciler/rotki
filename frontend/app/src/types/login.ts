import { SyncConflictPayload } from '@/store/session/types';
import { Exchange } from '@/types/exchanges';
import { UserSettingsModel } from '@/types/user';

export type SyncApproval = 'yes' | 'no' | 'unknown';

export interface LoginCredentials {
  readonly username: string;
  readonly password: string;
  readonly syncApproval?: SyncApproval;
}

export interface PremiumSetup {
  readonly apiKey: string;
  readonly apiSecret: string;
  readonly submitUsageAnalytics: boolean;
  readonly syncDatabase: boolean;
}

export type AccountSession = Record<string, 'loggedin' | 'loggedout'>;

export class SyncConflictError extends Error {
  readonly payload: SyncConflictPayload;

  constructor(message: string, payload: SyncConflictPayload) {
    super(message);
    this.payload = payload;
  }
}

export interface CreateAccountPayload {
  readonly credentials: LoginCredentials;
  premiumSetup?: PremiumSetup;
}

export interface UnlockPayload {
  settings: UserSettingsModel;
  exchanges: Exchange[];
  username: string;
  fetchData?: boolean;
}
