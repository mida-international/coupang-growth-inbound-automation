export type CreateSellerAccountBody = {
  displayName: string;
  isActive?: boolean;
};

export type CreateSellerAccountInput = CreateSellerAccountBody & {
  createdById: string;
};

export type SellerAccountView = {
  id: string;
  displayName: string;
  isActive: boolean;
  createdAt: Date;
  createdBy: {
    id: string;
    email: string;
    name: string | null;
  };
};

export type SellerAccountsResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
