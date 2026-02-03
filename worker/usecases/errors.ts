export type UseCaseError =
  | { code: "NOT_FOUND"; entity: string; id?: number | string }
  | { code: "VALIDATION_ERROR"; message: string; field?: string }
  | { code: "UNAUTHORIZED" }
  | { code: "FORBIDDEN" }
  | { code: "CONFLICT"; message: string }
  | {
      code: "PICK_WINDOW_CLOSED";
      reason: "too_early" | "too_late";
      opensAt?: Date;
    }
  | { code: "DRIVER_UNAVAILABLE"; driverId: number };

export const notFound = (
  entity: string,
  id?: number | string,
): UseCaseError => ({
  code: "NOT_FOUND",
  entity,
  id,
});

export const validationError = (
  message: string,
  field?: string,
): UseCaseError => ({
  code: "VALIDATION_ERROR",
  message,
  field,
});

export const unauthorized = (): UseCaseError => ({ code: "UNAUTHORIZED" });

export const forbidden = (): UseCaseError => ({ code: "FORBIDDEN" });

export const conflict = (message: string): UseCaseError => ({
  code: "CONFLICT",
  message,
});

export const pickWindowClosed = (
  reason: "too_early" | "too_late",
  opensAt?: Date,
): UseCaseError => ({
  code: "PICK_WINDOW_CLOSED",
  reason,
  opensAt,
});

export const driverUnavailable = (driverId: number): UseCaseError => ({
  code: "DRIVER_UNAVAILABLE",
  driverId,
});

/**
 * HTTP Status codes used by our API
 */
export type ApiStatusCode = 400 | 401 | 403 | 404 | 409 | 500;

/**
 * Convert a UseCaseError to HTTP status code
 */
export function errorToHttpStatus(error: UseCaseError): ApiStatusCode {
  switch (error.code) {
    case "NOT_FOUND":
      return 404;
    case "VALIDATION_ERROR":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "CONFLICT":
      return 409;
    case "PICK_WINDOW_CLOSED":
      return 400;
    case "DRIVER_UNAVAILABLE":
      return 400;
    default:
      return 500;
  }
}

/**
 * Convert a UseCaseError to a user-friendly message
 */
export function errorToMessage(error: UseCaseError): string {
  switch (error.code) {
    case "NOT_FOUND":
      return error.id
        ? `${error.entity} with id ${error.id} not found`
        : `${error.entity} not found`;
    case "VALIDATION_ERROR":
      return error.field ? `${error.field}: ${error.message}` : error.message;
    case "UNAUTHORIZED":
      return "Unauthorized";
    case "FORBIDDEN":
      return "Forbidden";
    case "CONFLICT":
      return error.message;
    case "PICK_WINDOW_CLOSED":
      return error.reason === "too_early"
        ? `Pick window not yet open${error.opensAt ? `. Opens ${error.opensAt.toISOString()}` : ""}`
        : "Pick window has closed";
    case "DRIVER_UNAVAILABLE":
      return `Driver ${error.driverId} is not available`;
    default:
      return "An unexpected error occurred";
  }
}
