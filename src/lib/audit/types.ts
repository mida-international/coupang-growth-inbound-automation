export const AUDIT_ACTIONS = {
  profileUpdate: "profile_update",
  passwordChange: "password_change",
  memberCreate: "member_create",
} as const;

export type AuditAction =
  (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type LogAuditInput = {
  actorId: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};
