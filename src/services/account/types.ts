export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type AccountResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
