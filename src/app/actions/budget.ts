"use server";

import { revalidatePath } from "next/cache";
import { readBudgetStore, writeBudgetStore } from "@/lib/budget";

export async function setBudget(periodeStart: string, nominal: number): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodeStart)) throw new Error("Periode tidak valid.");
  if (!Number.isFinite(nominal) || nominal < 0) throw new Error("Nominal budget tidak valid.");

  const store = await readBudgetStore();
  if (nominal === 0) {
    delete store[periodeStart];
  } else {
    store[periodeStart] = Math.round(nominal);
  }

  await writeBudgetStore(store);
  revalidatePath("/");
}
