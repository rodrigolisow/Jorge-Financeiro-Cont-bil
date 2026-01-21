export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PRECONDITION_FAILED"
  | "INTERNAL_ERROR";

type AppErrorParams = {
  code: ErrorCode;
  message: string;
  status: number;
  details?: unknown;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor({ code, message, status, details }: AppErrorParams) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function asAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    message: "Internal error",
    status: 500,
  });
}
