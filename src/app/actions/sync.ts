"use server";

import { revalidatePath, updateTag } from "next/cache";
import { TRANSAKSI_CACHE_TAG, syncFromSheet } from "@/lib/transactions";

export type SyncResult = { ok: true; count: number } | { ok: false; error: string };

export async function syncTransaksi(): Promise<SyncResult> {
  try {
    const snapshot = await syncFromSheet();
    updateTag(TRANSAKSI_CACHE_TAG);
    revalidatePath("/");
    return { ok: true, count: snapshot.data.length };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sync gagal" };
  }
}
