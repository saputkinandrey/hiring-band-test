import type { UserRecord } from './user-record.type';

export type SessionRecord = {
  id: string;
  brandId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type SessionWithUserRecord = SessionRecord & {
  user: UserRecord;
};

export type CreateSessionInput = {
  brandId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};
