import { getAuth } from "@clerk/express";
import type { Request } from "express";

const ANONYMOUS_USER_ID = "anonymous";

/**
 * Authentication is optional for this app. Keep Clerk-compatible identity
 * support when configured, but let the studio work without a login provider.
 */
export function getUserId(req: Request): string {
  try {
    return getAuth(req).userId ?? ANONYMOUS_USER_ID;
  } catch {
    return ANONYMOUS_USER_ID;
  }
}