import { readJson, writeJson } from "@/lib/storage";

// Budget per periode gajian, dengan kunci tanggal mulai YYYY-MM-DD dan nilai dalam rupiah.
export type BudgetStore = Record<string, number>;

export async function readBudgetStore(): Promise<BudgetStore> {
  const parsed = await readJson<BudgetStore>("budget");
  if (!parsed || typeof parsed !== "object") return {};
  return Object.fromEntries(
    Object.entries(parsed).filter(([key, value]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && typeof value === "number"),
  );
}

export async function writeBudgetStore(store: BudgetStore): Promise<void> {
  await writeJson("budget", store);
}
