import { NextResponse } from "next/server";

import { asAppError } from "@/lib/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(error: unknown) {
  const appError = asAppError(error);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details ?? null,
      },
    },
    { status: appError.status },
  );
}

export async function handleRoute<T>(handler: () => Promise<T>) {
  try {
    const data = await handler();
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
