"use server";

import { revalidatePath } from "next/cache";
import { readCategoryStore, writeCategoryStore } from "@/lib/categories";
import { normalizeName } from "@/lib/summary";

export async function setPenerimaCategory(penerima: string, kategori: string): Promise<void> {
  const key = normalizeName(penerima);
  const nama = kategori.trim().replace(/\s+/g, " ");
  if (!key || !nama) throw new Error("Penerima dan kategori wajib diisi.");

  const store = await readCategoryStore();
  if (!store.kategori.some((k) => k.toLowerCase() === nama.toLowerCase())) {
    store.kategori.push(nama);
    store.kategori.sort((a, b) => a.localeCompare(b, "id"));
  }
  const existing = store.kategori.find((k) => k.toLowerCase() === nama.toLowerCase()) ?? nama;
  store.penerima[key] = existing;

  await writeCategoryStore(store);
  revalidatePath("/");
}
