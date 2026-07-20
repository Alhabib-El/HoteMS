import bcrypt from "bcryptjs";
import { StaffRole } from "@prisma/client";
import { prisma } from "../../db/client";

export function listStaff() {
  return prisma.staff.findMany({
    select: { id: true, fullName: true, role: true, active: true, createdAt: true },
    orderBy: { fullName: "asc" },
  });
}

export async function createStaff(data: { fullName: string; role: StaffRole; pin: string }) {
  const pinHash = await bcrypt.hash(data.pin, 10);
  const staff = await prisma.staff.create({
    data: { fullName: data.fullName, role: data.role, pinHash },
  });
  return { id: staff.id, fullName: staff.fullName, role: staff.role, active: staff.active, createdAt: staff.createdAt };
}

export function setStaffActive(id: string, active: boolean) {
  return prisma.staff.update({
    where: { id },
    data: { active },
    select: { id: true, fullName: true, role: true, active: true, createdAt: true },
  });
}
