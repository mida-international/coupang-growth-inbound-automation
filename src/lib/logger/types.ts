export type LogLevel = "debug" | "info" | "warn" | "error";

/** 구조화 로그에 붙일 선택 필드 (감사·동기화 확장용) */
export type LogContext = Record<string, unknown>;
