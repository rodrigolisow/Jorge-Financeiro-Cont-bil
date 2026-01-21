import { auth, currentUser } from "@clerk/nextjs/server";
import { Role, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { AppError } from "@/lib/errors";

export type AuthContext = {
  userId: string;
  clerkUser: Awaited<ReturnType<typeof currentUser>>;
};

export type DbUser = User;

export async function requireAuth(): Promise<AuthContext> {
  const { userId } = await auth();

  if (!userId) {
    throw new AppError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      status: 401,
    });
  }

  const clerkUser = await currentUser();
  return { userId, clerkUser };
}

function resolveBootstrapRole(email?: string | null) {
  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  const normalizedEmail = email?.toLowerCase();

  if (bootstrapEmail && normalizedEmail && bootstrapEmail === normalizedEmail) {
    return Role.ADMIN;
  }

  return Role.VIEWER;
}

export async function getOrCreateDbUser(): Promise<DbUser> {
  const { userId, clerkUser } = await requireAuth();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
  const role = resolveBootstrapRole(email);

  return prisma.user.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: {
      clerkUserId: userId,
      role,
    },
  });
}

export async function requireDbUser(allowed?: Role[]) {
  const user = await getOrCreateDbUser();

  if (allowed?.length) {
    requireRole(user.role, allowed);
  }

  return user;
}
