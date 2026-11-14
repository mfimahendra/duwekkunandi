import { readJson, writeJson } from "@/lib/storage";

export type CategoryStore = {
  kategori: string[];
  penerima: Record<string, string>;
};

export async function readCategoryStore(): Promise<CategoryStore> {
  const parsed = await readJson<Partial<CategoryStore>>("kategori");
  return {
    kategori: Array.isArray(parsed?.kategori) ? parsed.kategori : [],
    penerima: parsed?.penerima && typeof parsed.penerima === "object" ? parsed.penerima : {},
  };
}

export async function writeCategoryStore(store: CategoryStore): Promise<void> {
  await writeJson("kategori", store);
}
