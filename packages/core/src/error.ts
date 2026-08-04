// ─────────────────────────────────────────────────────────────────────────────
// GatelyAuthError — structured errors for the auth framework
// ─────────────────────────────────────────────────────────────────────────────

export type ErrorCode =
  // Auth
  | "INVALID_EMAIL"
  | "INVALID_PASSWORD"
  | "PASSWORD_TOO_SHORT"
  | "PASSWORD_TOO_LONG"
  | "EMAIL_ALREADY_EXISTS"
  | "USER_NOT_FOUND"
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "ACCOUNT_DISABLED"
  // Session
  | "SESSION_NOT_FOUND"
  | "SESSION_EXPIRED"
  | "INVALID_TOKEN"
  | "UNAUTHORIZED"
  // OAuth
  | "INVALID_OAUTH_STATE"
  | "OAUTH_CODE_EXCHANGE_FAILED"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_EMAIL_MISSING"
  // Verification
  | "VERIFICATION_TOKEN_EXPIRED"
  | "VERIFICATION_TOKEN_INVALID"
  | "EMAIL_ALREADY_VERIFIED"
  // Rate limit
  | "RATE_LIMIT_EXCEEDED"
  // Signup
  | "SIGNUP_DISABLED"
  // Magic link / OTP
  | "MAGIC_LINK_EXPIRED"
  | "MAGIC_LINK_INVALID"
  | "OTP_EXPIRED"
  | "OTP_INVALID"
  | "OTP_MAX_ATTEMPTS"
  // Generic
  | "BAD_REQUEST"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "METHOD_NOT_ALLOWED"
  | "ORIGIN_NOT_ALLOWED";

const HTTP_STATUS: Record<ErrorCode, number> = {
  INVALID_EMAIL: 400,
  INVALID_PASSWORD: 400,
  PASSWORD_TOO_SHORT: 400,
  PASSWORD_TOO_LONG: 400,
  EMAIL_ALREADY_EXISTS: 409,
  USER_NOT_FOUND: 404,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 403,
  ACCOUNT_DISABLED: 403,
  SESSION_NOT_FOUND: 401,
  SESSION_EXPIRED: 401,
  INVALID_TOKEN: 401,
  UNAUTHORIZED: 401,
  INVALID_OAUTH_STATE: 400,
  OAUTH_CODE_EXCHANGE_FAILED: 502,
  PROVIDER_NOT_CONFIGURED: 400,
  PROVIDER_EMAIL_MISSING: 400,
  VERIFICATION_TOKEN_EXPIRED: 400,
  VERIFICATION_TOKEN_INVALID: 400,
  EMAIL_ALREADY_VERIFIED: 400,
  RATE_LIMIT_EXCEEDED: 429,
  SIGNUP_DISABLED: 403,
  MAGIC_LINK_EXPIRED: 400,
  MAGIC_LINK_INVALID: 400,
  OTP_EXPIRED: 400,
  OTP_INVALID: 400,
  OTP_MAX_ATTEMPTS: 429,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  METHOD_NOT_ALLOWED: 405,
  ORIGIN_NOT_ALLOWED: 403,
};

export class GatelyAuthError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? codeToMessage(code));
    this.name = "GatelyAuthError";
    this.code = code;
    this.status = HTTP_STATUS[code];
  }

  toResponse(headers?: Record<string, string>): Response {
    return new Response(
      JSON.stringify({ error: { code: this.code, message: this.message } }),
      {
        status: this.status,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );
  }
}

function codeToMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    INVALID_EMAIL: "Invalid email address",
    INVALID_PASSWORD: "Invalid password",
    PASSWORD_TOO_SHORT: "Password is too short",
    PASSWORD_TOO_LONG: "Password is too long",
    EMAIL_ALREADY_EXISTS: "An account with this email already exists",
    USER_NOT_FOUND: "User not found",
    INVALID_CREDENTIALS: "Invalid email or password",
    EMAIL_NOT_VERIFIED: "Please verify your email before signing in",
    ACCOUNT_DISABLED: "This account has been disabled",
    SESSION_NOT_FOUND: "Session not found",
    SESSION_EXPIRED: "Session has expired",
    INVALID_TOKEN: "Invalid or expired token",
    UNAUTHORIZED: "Authentication required",
    INVALID_OAUTH_STATE: "Invalid OAuth state parameter",
    OAUTH_CODE_EXCHANGE_FAILED: "OAuth code exchange failed",
    PROVIDER_NOT_CONFIGURED: "Social provider is not configured",
    PROVIDER_EMAIL_MISSING: "Provider did not return an email address",
    VERIFICATION_TOKEN_EXPIRED: "Verification link has expired",
    VERIFICATION_TOKEN_INVALID: "Invalid verification link",
    EMAIL_ALREADY_VERIFIED: "Email is already verified",
    RATE_LIMIT_EXCEEDED: "Too many requests — please try again later",
    SIGNUP_DISABLED: "Sign up is currently disabled",
    MAGIC_LINK_EXPIRED: "Magic link has expired",
    MAGIC_LINK_INVALID: "Invalid magic link",
    OTP_EXPIRED: "OTP code has expired",
    OTP_INVALID: "Invalid OTP code",
    OTP_MAX_ATTEMPTS: "Too many failed OTP attempts",
    BAD_REQUEST: "Bad request",
    FORBIDDEN: "Forbidden",
    NOT_FOUND: "Not found",
    INTERNAL_ERROR: "Internal server error",
    METHOD_NOT_ALLOWED: "Method not allowed",
    ORIGIN_NOT_ALLOWED: "Origin not allowed",
  };
  return messages[code];
}

/** Helper — wrap any thrown value into a JSON Response */
export function toErrorResponse(
  err: unknown,
  corsHeaders?: Record<string, string>
): Response {
  if (err instanceof GatelyAuthError) {
    return err.toResponse(corsHeaders);
  }
  console.error("[gately-auth] Unhandled error:", err);
  return new GatelyAuthError("INTERNAL_ERROR").toResponse(corsHeaders);
}
