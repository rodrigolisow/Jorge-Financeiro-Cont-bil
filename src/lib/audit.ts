import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

type AuditLogInput = {
  action: string;
  entityType: string;
  entityId: string;
  actorUserId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function writeAuditLog(
  client: PrismaClient | Prisma.TransactionClient,
  input: AuditLogInput,
) {
  return client.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actorUserId: input.actorUserId ?? null,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}
