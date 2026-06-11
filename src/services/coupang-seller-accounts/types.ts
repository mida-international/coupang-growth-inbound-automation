export type CreateSellerAccountInput = {
  displayName: string;
  isActive?: boolean;
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
