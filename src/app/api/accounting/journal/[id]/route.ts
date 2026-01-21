import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireDbUser();
    const { id } = await context.params;
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: { include: { account: true } },
      },
    });

    if (!entry) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Journal entry not found",
        status: 404,
      });
    }

    return entry;
  });
}
