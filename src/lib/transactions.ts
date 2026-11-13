import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";
import type { Transaction } from "@/lib/types";

export const TRANSAKSI_CACHE_TAG = "transaksi";

export type TransactionsSnapshot = {
  data: Transaction[];
  fetchedAt: string;
};

type SheetError = { error: string };

const SNAPSHOT_FILE = path.join(process.cwd(), "data", "transaksi.json");

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const n = Number(value.replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toText(value: unknown): string {
  return value == null ? "" : String(value);
}

const jamFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

// Sheets time cells arrive as 1899-12-30 datetimes; keep only HH:mm, blank if no time.
function toJam(value: unknown): string {
  const text = toText(value);
  if (!text.startsWith("1899-12-30")) return text;
  const date = new Date(text);
  return /\d{2}:\d{2}/.test(text) && !Number.isNaN(date.getTime()) ? jamFmt.format(date) : "";
}

function sortTime(t: Transaction): number {
  const time = Date.parse(`${t.tanggal} ${t.jam}`.trim());
  return Number.isNaN(time) ? 0 : time;
}

async function fetchFromSheet(): Promise<Transaction[]> {
  const url = process.env.SHEET_API_URL;
  const key = process.env.SHEET_API_KEY;
  if (!url || !key) throw new Error("SHEET_API_URL atau SHEET_API_KEY belum diset");

  const res = await fetch(`${url}?key=${encodeURIComponent(key)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal mengambil data sheet (HTTP ${res.status})`);

  const json: unknown = await res.json();
  if (!Array.isArray(json)) {
    const message = (json as SheetError | null)?.error ?? "Respons sheet tidak valid";
    throw new Error(message);
  }

  return json
    .map((row): Transaction => {
      const r = row as Record<string, unknown>;
      const nominal = toNumber(r.nominal);
      const biaya = toNumber(r.biaya);
      return {
        tanggal: toText(r.tanggal),
        jam: toJam(r.jam),
        bank: toText(r.bank),
        jenis: toText(r.jenis),
        penerima_penyedia: toText(r.penerima_penyedia),
        nominal,
        biaya,
        total: toNumber(r.total) || nominal + biaya,
        kategori: toText(r.kategori),
        rekening: toText(r.rekening),
        no_referensi: toText(r.no_referensi),
        keterangan: toText(r.keterangan),
      };
    })
    .sort((a, b) => sortTime(b) - sortTime(a));
}

async function readSnapshotFile(): Promise<TransactionsSnapshot | null> {
  try {
    const parsed = JSON.parse(await readFile(SNAPSHOT_FILE, "utf8")) as TransactionsSnapshot;
    if (!Array.isArray(parsed.data)) return null;
    return { ...parsed, data: parsed.data.map((t) => ({ ...t, jam: toJam(t.jam) })) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

// Cache tanpa masa kedaluwarsa; hanya dihapus oleh updateTag saat Sync.
export const readTransactionsSnapshot = unstable_cache(readSnapshotFile, ["transaksi-snapshot"], {
  tags: [TRANSAKSI_CACHE_TAG],
});

// Satu-satunya jalur fetch ke Sheets; hanya dipanggil dari aksi Sync.
export async function syncFromSheet(): Promise<TransactionsSnapshot> {
  const snapshot: TransactionsSnapshot = {
    data: await fetchFromSheet(),
    fetchedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(SNAPSHOT_FILE), { recursive: true });
  await writeFile(SNAPSHOT_FILE, JSON.stringify(snapshot), "utf8");
  return snapshot;
}
