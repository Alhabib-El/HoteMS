import { NextFunction, Request, Response } from "express";
import type { StaffRole } from "@prisma/client";
import { AuthStaff, verifyToken } from "./auth.service";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staff?: AuthStaff;
    }
  }
}

const DEV_BYPASS_STAFF: AuthStaff = { id: "dev-bypass", fullName: "Dev (auth disabled)", role: "MANAGEMENT" };

// Temporary escape hatch while staff PINs can't be tested (no database yet). Set DISABLE_AUTH=true
// in backend/.env to skip PIN checks entirely; unset it once the database is seeded with real staff.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.DISABLE_AUTH === "true") {
    req.staff = DEV_BYPASS_STAFF;
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing session token" });
    return;
  }
  try {
    req.staff = verifyToken(header.slice("Bearer ".length));
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireRole(...roles: StaffRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.staff) {
      res.status(401).json({ error: "Missing session token" });
      return;
    }
    if (req.staff.role === "MANAGEMENT" || roles.includes(req.staff.role)) {
      next();
      return;
    }
    res.status(403).json({ error: "You do not have access to this module" });
  };
}
