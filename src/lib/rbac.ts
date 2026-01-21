import { Role } from "@prisma/client";

import { AppError } from "@/lib/errors";

export const roles = Object.values(Role) as Role[];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export function requireRole(role: Role | null | undefined, allowed: Role[]) {
  if (!role || !allowed.includes(role)) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Access denied",
      status: 403,
    });
  }
}
