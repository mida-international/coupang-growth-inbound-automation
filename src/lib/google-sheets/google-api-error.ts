type GoogleApiErrorBody = {
  error?: {
    message?: string;
    status?: string;
    code?: number;
  };
};

type GoogleApiErrorLike = {
  message?: string;
  code?: number;
  response?: {
    status?: number;
    data?: GoogleApiErrorBody;
  };
};

export function getGoogleApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Google Sheets API 호출에 실패했습니다.";
  }

  const apiError = error as GoogleApiErrorLike;
  const apiMessage = apiError.response?.data?.error?.message;

  if (apiMessage) {
    return apiMessage;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Google Sheets API 호출에 실패했습니다.";
}

export function getGoogleApiErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const apiError = error as GoogleApiErrorLike;
  return apiError.response?.status ?? apiError.code ?? null;
}

export function formatGoogleSheetsPermissionError(
  clientEmail: string | null,
): string {
  if (clientEmail) {
    return `스프레드시트에 서비스 계정(${clientEmail})을 편집자로 공유해 주세요. Google Cloud에서 Google Sheets API가 활성화되어 있는지도 확인해 주세요.`;
  }

  return "스프레드시트 편집 권한을 확인해 주세요. Google Cloud에서 Google Sheets API가 활성화되어 있는지도 확인해 주세요.";
}
