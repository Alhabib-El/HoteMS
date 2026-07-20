import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/client";
import { HttpError } from "../../middleware/errorHandler";
import type { StaffRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const TOKEN_TTL = "12h";

export interface AuthStaff {
  id: string;
  fullName: string;
  role: StaffRole;
}

export async function login(pin: string): Promise<{ token: string; staff: AuthStaff }> {
  const candidates = await prisma.staff.findMany({ where: { active: true } });
  for (const staff of candidates) {
    if (await bcrypt.compare(pin, staff.pinHash)) {
      const authStaff: AuthStaff = { id: staff.id, fullName: staff.fullName, role: staff.role };
      const token = jwt.sign(authStaff, JWT_SECRET, { expiresIn: TOKEN_TTL });
      return { token, staff: authStaff };
    }
  }
  throw new HttpError(401, "Invalid PIN");
}

export function verifyToken(token: string): AuthStaff {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthStaff;
  } catch {
    throw new HttpError(401, "Invalid or expired session");
  }
}
