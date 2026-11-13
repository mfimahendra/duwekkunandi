"use client";

import { useState, useTransition } from "react";
import { setPenerimaCategory } from "@/app/actions/kategori";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rupiah } from "@/lib/format";
import type { PenerimaRow } from "@/lib/summary";

const BARU = "__baru__";

export function CategoryManager({ rows, kategori }: { rows: PenerimaRow[]; kategori: string[] }) {
  const [open, setOpen] = useState(true);
  const [showAssigned, setShowAssigned] = useState(false);

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">Belum ada penerima untuk dikategorikan.</p>;
  }

  const belum = rows.filter((r) => r.kategori === null);
  const sudah = rows.filter((r) => r.kategori !== null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {belum.length > 0 ? `${belum.length} penerima belum dikategorikan` : "Semua penerima sudah dikategorikan"}
        </p>
        <Button type="button" variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Tutup" : "Buka"}
        </Button>
      </div>

      {open && (
        <>
          {belum.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-lg border border-amber-200 bg-amber-50/40 px-3">
              {belum.map((row) => (
                <CategoryRow key={row.key} row={row} kategori={kategori} />
              ))}
            </ul>
          )}

          {sudah.length > 0 && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                aria-expanded={showAssigned}
                onClick={() => setShowAssigned(!showAssigned)}
                className="w-full"
              >
                {showAssigned ? "Sembunyikan" : "Tampilkan"} yang sudah dikategorikan ({sudah.length})
              </Button>
              {showAssigned && (
                <ul className="divide-y divide-slate-100">
                  {sudah.map((row) => (
                    <CategoryRow key={row.key} row={row} kategori={kategori} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryRow({ row, kategori }: { row: PenerimaRow; kategori: string[] }) {
  const [value, setValue] = useState(row.kategori ?? "");
  const [baru, setBaru] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const finalKategori = value === BARU ? baru.trim() : value;
  const unchanged = finalKategori === (row.kategori ?? "");

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await setPenerimaCategory(row.nama, finalKategori);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menyimpan.");
      }
    });
  }

  return (
    <li className="space-y-2 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{row.nama}</p>
          <p className="text-xs text-slate-500">
            {row.jumlah} transaksi · {rupiah.format(row.total)}
          </p>
        </div>
        {row.kategori === null ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Baru
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{row.kategori}</span>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm sm:flex-1"
        >
          <option value="" disabled>
            Pilih kategori
          </option>
          {kategori.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
          <option value={BARU}>+ Kategori baru</option>
        </select>

        {value === BARU && (
          <Input
            placeholder="Nama kategori baru"
            value={baru}
            onChange={(e) => setBaru(e.target.value)}
            disabled={pending}
            className="sm:flex-1"
          />
        )}

        <Button
          type="button"
          onClick={save}
          disabled={pending || !finalKategori || unchanged}
          className="w-full sm:w-auto"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}
