"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkPin,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export type LoginState = { error?: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const pin = String(formData.get("pin") ?? "");
  if (!pin || !checkPin(pin)) {
    return { error: "PIN salah" };
  }

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
