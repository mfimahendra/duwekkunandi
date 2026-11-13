"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { rupiah } from "@/lib/format";
import type { Transaction } from "@/lib/types";

type SortKey = keyof Transaction;
type Sort = { key: SortKey; dir: "asc" | "desc" } | null;

const NUMERIC: SortKey[] = ["nominal", "biaya", "total"];

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "tanggal", label: "Tanggal" },
  { key: "jam", label: "Jam" },
  { key: "bank", label: "Bank" },
  { key: "jenis", label: "Jenis" },
  { key: "penerima_penyedia", label: "Penerima/Penyedia" },
  { key: "nominal", label: "Nominal" },
  { key: "biaya", label: "Biaya" },
  { key: "total", label: "Total" },
  { key: "kategori", label: "Kategori" },
  { key: "rekening", label: "Rekening" },
  { key: "no_referensi", label: "No Referensi" },
  { key: "keterangan", label: "Keterangan" },
];

const SORT_OPTIONS: { key: SortKey; dir: "asc" | "desc"; label: string }[] = [
  { key: "tanggal", dir: "desc", label: "Tanggal terbaru" },
  { key: "tanggal", dir: "asc", label: "Tanggal terlama" },
  { key: "total", dir: "desc", label: "Total terbesar" },
  { key: "total", dir: "asc", label: "Total terkecil" },
  { key: "penerima_penyedia", dir: "asc", label: "Penerima A-Z" },
  { key: "kategori", dir: "asc", label: "Kategori A-Z" },
];

// Tanggal diurutkan sebagai waktu gabungan tanggal + jam.
function sortValue(t: Transaction, key: SortKey): number | string {
  if (key === "tanggal") return Date.parse(`${t.tanggal} ${t.jam}`) || 0;
  if (NUMERIC.includes(key)) return Number(t[key]) || 0;
  return String(t[key] ?? "");
}

function compareValues(a: number | string, b: number | string): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "id");
}

function Dash({ value }: { value: string }) {
  return value || <span className="text-slate-300">-</span>;
}

function renderValue(t: Transaction, key: SortKey) {
  if (NUMERIC.includes(key)) return rupiah.format(Number(t[key]) || 0);
  return <Dash value={String(t[key] ?? "")} />;
}

function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
  if (dir === "asc") return <ArrowUp className="size-3.5" aria-hidden />;
  if (dir === "desc") return <ArrowDown className="size-3.5" aria-hidden />;
  return <ArrowUpDown className="size-3.5 text-slate-300" aria-hidden />;
}

export function TransactionList({
  transactions,
  kategori,
}: {
  transactions: Transaction[];
  kategori: string[];
}) {
  const [query, setQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = transactions.filter((t) => {
      if (kategoriFilter && t.kategori !== kategoriFilter) return false;
      return !q || Object.values(t).some((v) => String(v).toLowerCase().includes(q));
    });
    if (!sort) return filtered;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => sign * compareValues(sortValue(a, sort.key), sortValue(b, sort.key)));
  }, [transactions, query, kategoriFilter, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  if (transactions.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Belum ada transaksi.</p>;
  }

  const activeOption = SORT_OPTIONS.findIndex((o) => sort && o.key === sort.key && o.dir === sort.dir);

  return (
    <div className="space-y-3">
      {kategori.length > 0 && (
        <div role="group" aria-label="Filter kategori" className="flex flex-wrap gap-2">
          {[null, ...kategori].map((k) => {
            const active = kategoriFilter === k;
            return (
              <button
                key={k ?? "__semua__"}
                type="button"
                aria-pressed={active}
                onClick={() => setKategoriFilter(k)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {k ?? "Semua"}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex w-full items-center sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 size-4 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari transaksi..."
            aria-label="Cari transaksi"
            className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm"
          />
        </label>
        <div className="flex items-center gap-2 md:hidden">
          <label htmlFor="urutkan" className="text-xs text-slate-600">
            Urutkan
          </label>
          <select
            id="urutkan"
            value={activeOption === -1 ? "" : String(activeOption)}
            onChange={(e) => {
              const option = SORT_OPTIONS[Number(e.target.value)];
              setSort(option ? { key: option.key, dir: option.dir } : null);
            }}
            className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm sm:flex-none"
          >
            <option value="">Urutan asli</option>
            {SORT_OPTIONS.map((o, i) => (
              <option key={`${o.key}-${o.dir}`} value={i}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Menampilkan {rows.length} dari {transactions.length} transaksi
      </p>

      {rows.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Tidak ada transaksi yang cocok.</p>}

      {/* Mobile: kartu */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {rows.map((t, i) => (
          <li key={i} className="space-y-1 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  <Dash value={t.penerima_penyedia} />
                </p>
                <p className="text-xs text-slate-500">
                  {t.tanggal} {t.jam} · {t.bank}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-slate-900">{rupiah.format(t.total)}</p>
            </div>
            <div className="flex flex-wrap gap-x-3 text-xs text-slate-500">
              <span>{t.jenis}</span>
              <span>{t.kategori}</span>
              <span>Nominal {rupiah.format(t.nominal)}</span>
              {t.biaya > 0 && <span>Biaya {rupiah.format(t.biaya)}</span>}
            </div>
            {t.keterangan && <p className="text-xs text-slate-400">{t.keterangan}</p>}
          </li>
        ))}
      </ul>

      {/* Desktop: tabel */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              {COLUMNS.map((col) => {
                const dir = sort?.key === col.key ? sort.dir : null;
                const numeric = NUMERIC.includes(col.key);
                return (
                  <th
                    key={col.key}
                    aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}
                    className={`py-2 pr-4 font-medium ${numeric ? "text-right" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 uppercase hover:text-slate-900 ${
                        numeric ? "flex-row-reverse" : ""
                      }`}
                    >
                      {col.label}
                      <SortIcon dir={dir} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((t, i) => (
              <tr key={i} className="align-top text-slate-700">
                {COLUMNS.map((col) => {
                  const classes = [
                    "py-2 pr-4",
                    NUMERIC.includes(col.key) ? "whitespace-nowrap text-right" : "",
                    col.key === "tanggal" || col.key === "jam" ? "whitespace-nowrap" : "",
                    col.key === "total" ? "font-semibold text-slate-900" : "",
                    col.key === "keterangan" ? "text-slate-500" : "",
                  ].join(" ");
                  return (
                    <td key={col.key} className={classes}>
                      {renderValue(t, col.key)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
