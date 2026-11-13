import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type CategoryStore = {
  kategori: string[];
  penerima: Record<string, string>;
};

const STORE_FILE = path.join(process.cwd(), "data", "kategori.json");

export async function readCategoryStore(): Promise<CategoryStore> {
  try {
    const parsed = JSON.parse(await readFile(STORE_FILE, "utf8"));
    return {
      kategori: Array.isArray(parsed.kategori) ? parsed.kategori : [],
      penerima: parsed.penerima && typeof parsed.penerima === "object" ? parsed.penerima : {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { kategori: [], penerima: {} };
    throw error;
  }
}

export async function writeCategoryStore(store: CategoryStore): Promise<void> {
  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}
