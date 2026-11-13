import type { Transaction } from "@/lib/types";
import type { CategoryStore } from "@/lib/categories";

export const KATEGORI_BELUM = "Belum dikategorikan";
export const KATEGORI_SENDIRI = "Transfer sendiri";
export const KATEGORI_PINDAH = "Pindah Uang";

export type PenerimaRow = {
  key: string;
  nama: string;
  jumlah: number;
  total: number;
  kategori: string | null;
};

export type ChartKategori = { name: string; y: number };
export type ChartBulan = { label: string; y: number };

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function ownerNames(): string[] {
  return (process.env.OWNER_NAMES ?? "")
    .split(",")
    .map(normalizeName)
    .filter((name) => name.length >= 3);
}

export function isSelfTransfer(penerima: string): boolean {
  const name = normalizeName(penerima);
  if (!name) return false;
  return ownerNames().some((owner) => name.includes(owner));
}

export function isPengeluaran(t: Transaction): boolean {
  return !isSelfTransfer(t.penerima_penyedia) && t.kategori !== KATEGORI_PINDAH;
}

export function resolveKategori(t: Transaction, mapping: CategoryStore["penerima"]): string {
  if (isSelfTransfer(t.penerima_penyedia)) return KATEGORI_SENDIRI;
  const key = normalizeName(t.penerima_penyedia);
  return (key && mapping[key]) || KATEGORI_BELUM;
}

function bulanKey(tanggal: string): string | null {
  const match = /^(\d{4})-(\d{2})/.exec(tanggal);
  return match ? `${match[1]}-${match[2]}` : null;
}

const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function buildPenerimaRows(transactions: Transaction[], mapping: CategoryStore["penerima"]): PenerimaRow[] {
  const groups = new Map<string, PenerimaRow>();

  for (const t of transactions) {
    if (isSelfTransfer(t.penerima_penyedia)) continue;
    const key = normalizeName(t.penerima_penyedia);
    if (!key) continue;

    const row = groups.get(key) ?? {
      key,
      nama: t.penerima_penyedia.trim(),
      jumlah: 0,
      total: 0,
      kategori: mapping[key] ?? null,
    };
    row.jumlah += 1;
    row.total += t.total;
    groups.set(key, row);
  }

  return [...groups.values()].sort((a, b) => {
    if ((a.kategori === null) !== (b.kategori === null)) return a.kategori === null ? -1 : 1;
    return b.total - a.total;
  });
}

export function buildChartKategori(transactions: Transaction[]): ChartKategori[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (!isPengeluaran(t)) continue;
    totals.set(t.kategori || KATEGORI_BELUM, (totals.get(t.kategori || KATEGORI_BELUM) ?? 0) + t.total);
  }
  return [...totals.entries()]
    .map(([name, y]) => ({ name, y }))
    .sort((a, b) => b.y - a.y);
}

export function buildChartBulan(transactions: Transaction[]): ChartBulan[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (!isPengeluaran(t)) continue;
    const key = bulanKey(t.tanggal);
    if (!key) continue;
    totals.set(key, (totals.get(key) ?? 0) + t.total);
  }
  return [...totals.keys()]
    .sort()
    .slice(-12)
    .map((key) => {
      const [year, month] = key.split("-");
      return { label: `${namaBulan[Number(month) - 1]} ${year}`, y: totals.get(key) ?? 0 };
    });
}
