"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkPin,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { getLockoutMs, recordFailure, resetFailures } from "@/lib/rate-limit";

export type LoginState = { error?: string } | null;

async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const key = await clientKey();
  const lockoutMs = getLockoutMs(key);
  if (lockoutMs > 0) {
    const minutes = Math.ceil(lockoutMs / 60_000);
    return { error: `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit` };
  }

  const pin = String(formData.get("pin") ?? "");
  if (!pin || !checkPin(pin)) {
    recordFailure(key);
    return { error: "PIN salah" };
  }

  resetFailures(key);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
