"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: LoginState = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Masuk</CardTitle>
        <p className="text-sm text-slate-500">Masukkan PIN untuk membuka dashboard.</p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <Input
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="PIN"
            required
            autoFocus
          />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Memeriksa..." : "Masuk"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
