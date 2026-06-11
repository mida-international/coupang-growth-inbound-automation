export type ProfileView = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "master";
};

export type UpdateProfileNameInput = {
  name: string;
};

export type ProfileResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
