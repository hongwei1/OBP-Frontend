/**
 * Extract error details from a caught exception.
 * IMPORTANT: Never simplify or hide OBP error messages - show them in full!
 *
 * @param err - The caught error
 * @returns Object with error message and optional OBP error code
 */
export function extractErrorDetails(err: unknown): {
  message: string;
  obpErrorCode?: string;
} {
  if (err instanceof Error) {
    const result: { message: string; obpErrorCode?: string } = {
      message: err.message,
    };
    // Check if it's an OBPRequestError with obpErrorCode property
    if ("obpErrorCode" in err) {
      result.obpErrorCode = (err as any).obpErrorCode;
    }
    return result;
  }

  if (typeof err === "string") {
    return { message: err };
  }

  if (err && typeof err === "object") {
    // Try to extract message from object
    const message =
      (err as any).message ||
      (err as any).error ||
      (err as any).error_message ||
      JSON.stringify(err);
    return { message };
  }

  return { message: String(err) };
}

export class OBPErrorBase extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "OBPError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, OBPErrorBase.prototype);
  }
}

export class OBPRequestError extends OBPErrorBase {
  code: string;
  message: string;
  obpErrorCode: string;

  constructor(code: string | number, message: string, statusCode?: number) {
    super(message, statusCode);
    this.name = "OBPRequestError";
    this.code = String(code);
    this.message = message;
    Object.setPrototypeOf(this, OBPRequestError.prototype);
    this.obpErrorCode = this.getObpErrorCode();
  }

  getObpErrorCode(): string {
    // Try to extract OBP error code from message first
    const messageMatch = this.message.match(/OBP-\d+/);
    if (messageMatch) {
      return messageMatch[0];
    }
    // If code looks like an OBP code, use it
    if (this.code && this.code.match(/^OBP-\d+$/)) {
      return this.code;
    }
    return "UNKNOWN_ERROR";
  }
}
