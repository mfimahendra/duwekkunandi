"use client";

import { useMemo, useState } from "react";
import { BulananChart, HarianChart, KategoriChart, TopKategoriChart } from "@/components/charts";
import { CategoryManager } from "@/components/category-manager";
import { PeriodeFilter, type PeriodeState } from "@/components/periode-filter";
import { TransactionList } from "@/components/transaction-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryStore } from "@/lib/categories";
import { rupiah } from "@/lib/format";
import { addDays, buildChartHarian, currentBulan, inPeriode, resolvePeriode } from "@/lib/periode";
import {
  KATEGORI_BELUM,
  buildChartBulan,
  buildChartKategori,
  buildPenerimaRows,
  isPengeluaran,
  resolveKategori,
} from "@/lib/summary";
import type { Transaction } from "@/lib/types";

const fetchedAtFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

function defaultFilter(): PeriodeState {
  const bulan = currentBulan();
  const periode = resolvePeriode({ mode: "bulan", bulan });
  return { mode: "bulan", bulan, gajian: 25, dari: periode.start, sampai: addDays(periode.end, -1) };
}

export function DashboardView({
  transactions: raw,
  fetchedAt,
  store,
}: {
  transactions: Transaction[];
  fetchedAt: string | null;
  store: CategoryStore;
}) {
  const [filter, setFilter] = useState<PeriodeState>(defaultFilter);

  // Tidak bergantung pada filter periode, jadi hanya dihitung ulang saat data berubah.
  const transactions = useMemo(
    () => raw.map((t) => ({ ...t, kategori: resolveKategori(t, store.penerima) })),
    [raw, store],
  );
  const chartBulan = useMemo(() => buildChartBulan(transactions), [transactions]);
  const penerimaRows = useMemo(() => buildPenerimaRows(transactions, store.penerima), [transactions, store]);

  const view = useMemo(() => {
    const periode = resolvePeriode({
      mode: filter.mode,
      bulan: filter.bulan,
      gajian: String(filter.gajian),
      dari: filter.dari,
      sampai: filter.sampai,
    });
    const periodeTx = transactions.filter((t) => inPeriode(t, periode));
    const pengeluaran = periodeTx.filter(isPengeluaran);

    const chartKategori = buildChartKategori(periodeTx);
    return {
      periode,
      periodeTx,
      excludedCount: periodeTx.length - pengeluaran.length,
      totalNominal: pengeluaran.reduce((sum, t) => sum + t.nominal, 0),
      totalBiaya: pengeluaran.reduce((sum, t) => sum + t.biaya, 0),
      totalKeseluruhan: pengeluaran.reduce((sum, t) => sum + t.total, 0),
      chartHarian: buildChartHarian(periodeTx, periode),
      chartKategori,
      chartTop5: chartKategori.filter((k) => k.name !== KATEGORI_BELUM).slice(0, 5),
    };
  }, [transactions, filter]);

  // Elemen dengan referensi stabil dilewati React saat filter periode berubah.
  const bulanChart = useMemo(() => <BulananChart data={chartBulan} />, [chartBulan]);
  const categoryManager = useMemo(
    () => <CategoryManager rows={penerimaRows} kategori={store.kategori} />,
    [penerimaRows, store.kategori],
  );

  return (
    <>
      <Card>
        <CardContent className="pt-4">
          <PeriodeFilter value={filter} onApply={setFilter} />
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500 sm:text-sm">
        Periode {view.periode.label} · {view.periodeTx.length} transaksi
        {view.excludedCount > 0 && ` (${view.excludedCount} transfer/pindah uang tidak dihitung)`} ·{" "}
        {fetchedAt
          ? `Diperbarui ${fetchedAtFormat.format(new Date(fetchedAt))} WIB`
          : "Belum ada data, tekan Sync untuk mengambil dari Sheets"}
      </p>

      <section className="grid grid-cols-2 gap-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Total Keseluruhan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{rupiah.format(view.totalKeseluruhan)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Nominal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-slate-900 sm:text-xl">{rupiah.format(view.totalNominal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Biaya</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-slate-900 sm:text-xl">{rupiah.format(view.totalBiaya)}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran Harian & Tren</CardTitle>
        </CardHeader>
        <CardContent>
          <HarianChart {...view.chartHarian} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <TopKategoriChart data={view.chartTop5} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <KategoriChart data={view.chartKategori} />
        </CardContent>
      </Card>

      <section className="grid gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Bulan (semua data)</CardTitle>
          </CardHeader>
          <CardContent>{bulanChart}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Kategori Penerima</CardTitle>
        </CardHeader>
        <CardContent>{categoryManager}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={view.periodeTx} kategori={store.kategori} />
        </CardContent>
      </Card>
    </>
  );
}
