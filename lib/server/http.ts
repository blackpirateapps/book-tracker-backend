import { NextResponse } from "next/server";
import { getAdminPassword } from "@/lib/server/env";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function requireAdminPassword(password?: string | null) {
  if (!password) {
    throw Object.assign(new Error("Missing password"), { status: 401 });
  }
  if (password !== getAdminPassword()) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}
