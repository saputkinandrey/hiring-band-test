export type UserRecord = {
  id: string;
  brandId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  deletedAt: Date | null;
};

export type CreateUserInput = {
  brandId: string;
  email: string;
  passwordHash: string;
};
