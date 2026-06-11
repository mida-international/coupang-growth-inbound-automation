export type CreateAdminInput = {
  email: string;
  password: string;
  name?: string;
  role: "admin" | "master";
};

export type CreatedAdmin = {
  id: string;
  email: string;
  role: "admin" | "master";
};

export type MembersResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
