export type CreateAdminInput = {
  loginId: string;
  password: string;
  name?: string;
  role: "admin" | "master";
};

export type CreatedAdmin = {
  id: string;
  email: string;
  role: "admin" | "master";
};

export type UpdateMemberInput = {
  loginId: string;
  password?: string;
  role: "admin" | "master";
  name?: string;
};

export type UpdatedMember = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "master";
};

export type MembersResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
