import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { env } from "../env.js";

declare module "express-serve-static-core" {
  interface Request {
    userId: string;
  }
}

const COOKIE = "sr_uid";

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/**
 * Anonymous per-browser identity: the first request gets an httpOnly cookie with
 * a random id, and every query is scoped to it (so each visitor only sees their
 * own saved questions).
 *
 * This is the single place to swap in real sign-in (JWT, Auth0, Clerk, better-auth, ...):
 * verify the credential here and set `req.userId` to the verified user id.
 */
export function requireUser(req: Request, res: Response, next: NextFunction) {
  let id = readCookie(req.headers.cookie, COOKIE);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    id = randomUUID();
    res.cookie(COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.isProd,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
  }
  req.userId = id;
  next();
}
