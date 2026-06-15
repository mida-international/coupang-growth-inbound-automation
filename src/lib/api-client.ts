import type { ApiResult } from "@/lib/api/types";

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

function isApiResult(value: unknown): value is ApiResult<unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (obj.ok === true) {
    return true;
  }

  if (obj.ok === false && typeof obj.error === "string") {
    return true;
  }

  return false;
}

function normalizeErrorBody(body: unknown, status: number): ApiResult<never> {
  if (status === 401) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "string"
  ) {
    const { error } = body as { error: string };

    if (error === "Unauthorized") {
      return { ok: false, error: "로그인이 필요합니다." };
    }

    return { ok: false, error };
  }

  return { ok: false, error: "요청 처리에 실패했습니다." };
}

export async function apiRequest<T>(
  path: string,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  const { method = "GET", body, headers } = options ?? {};

  const init: RequestInit = {
    method,
    credentials: "same-origin",
    headers: {
      ...headers,
    },
  };

  if (body !== undefined) {
    init.headers = {
      "Content-Type": "application/json",
      ...init.headers,
    };
    init.body = JSON.stringify(body);
  }

  let response: Response;

  try {
    response = await fetch(path, init);
  } catch {
    return { ok: false, error: "요청 처리에 실패했습니다." };
  }

  let parsed: unknown;

  try {
    parsed = await response.json();
  } catch {
    return { ok: false, error: "응답을 처리할 수 없습니다." };
  }

  if (isApiResult(parsed)) {
    return parsed as ApiResult<T>;
  }

  if (!response.ok) {
    return normalizeErrorBody(parsed, response.status);
  }

  return { ok: false, error: "응답을 처리할 수 없습니다." };
}

export function apiGet<T>(path: string): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { method: "GET" });
}

export function apiPost<T>(
  path: string,
  body: unknown
): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { method: "POST", body });
}

export async function apiPostFormData<T>(
  path: string,
  formData: FormData,
): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
  } catch {
    return { ok: false, error: "요청 처리에 실패했습니다." };
  }

  let parsed: unknown;

  try {
    parsed = await response.json();
  } catch {
    return { ok: false, error: "응답을 처리할 수 없습니다." };
  }

  if (isApiResult(parsed)) {
    return parsed as ApiResult<T>;
  }

  if (!response.ok) {
    return normalizeErrorBody(parsed, response.status);
  }

  return { ok: false, error: "응답을 처리할 수 없습니다." };
}

export function apiPatch<T>(
  path: string,
  body: unknown
): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { method: "PATCH", body });
}

export function apiPut<T>(
  path: string,
  body: unknown
): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { method: "PUT", body });
}
