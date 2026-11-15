"use client";

import { useMemo, useState } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { BudgetCard } from "@/components/budget-card";
import { BulananChart, HarianChart, KategoriChart, TopKategoriChart } from "@/components/charts";
import { CategoryManager } from "@/components/category-manager";
import { HarianTable } from "@/components/harian-table";
import { PeriodeFilter, type PeriodeState } from "@/components/periode-filter";
import { TransactionList } from "@/components/transaction-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryStore } from "@/lib/categories";
import { rupiah } from "@/lib/format";
import {
  REFERENSI_LABEL,
  addDays,
  buildChartHarian,
  currentBulan,
  inPeriode,
  resolvePeriode,
  resolveReferensi,
  shiftBulan,
  todayIso,
} from "@/lib/periode";
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

const gajianFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function defaultFilter(): PeriodeState {
  return { mode: "tanggal", bulan: currentBulan(), gajian: 25, tanggal: todayIso() };
}

export function DashboardView({
  transactions: raw,
  fetchedAt,
  store,
  owners,
  budgets,
}: {
  transactions: Transaction[];
  fetchedAt: string | null;
  store: CategoryStore;
  owners: string[];
  budgets: Record<string, number>;
}) {
  const [filter, setFilter] = useState<PeriodeState>(defaultFilter);
  const [budgetGajian, setBudgetGajian] = useState(25);

  // Tidak bergantung pada filter periode, jadi hanya dihitung ulang saat data berubah.
  const transactions = useMemo(
    () => raw.map((t) => ({ ...t, kategori: resolveKategori(t, store.penerima, owners) })),
    [raw, store, owners],
  );
  const chartBulan = useMemo(() => buildChartBulan(transactions, owners), [transactions, owners]);
  const penerimaRows = useMemo(
    () => buildPenerimaRows(transactions, store.penerima, owners),
    [transactions, store, owners],
  );

  const view = useMemo(() => {
    const periode = resolvePeriode({
      mode: filter.mode,
      bulan: filter.bulan,
      gajian: String(filter.gajian),
      tanggal: filter.tanggal,
    });
    const periodeTx = transactions.filter((t) => inPeriode(t, periode));
    const pengeluaran = periodeTx.filter((t) => isPengeluaran(t, owners));

    const chartKategori = buildChartKategori(periodeTx, owners);

    // Periode acuan untuk persentase perbandingan.
    const referensi = resolveReferensi({
      mode: filter.mode,
      bulan: filter.bulan,
      gajian: filter.gajian,
      tanggal: filter.tanggal,
    });
    const referensiTotal = transactions
      .filter((t) => inPeriode(t, referensi) && isPengeluaran(t, owners))
      .reduce((sum, t) => sum + t.total, 0);
    const totalKeseluruhan = pengeluaran.reduce((sum, t) => sum + t.total, 0);

    return {
      periode,
      periodeTx,
      excludedCount: periodeTx.length - pengeluaran.length,
      totalKeseluruhan,
      referensiTotal,
      deltaPersen: referensiTotal > 0 ? ((totalKeseluruhan - referensiTotal) / referensiTotal) * 100 : null,
      chartHarian: buildChartHarian(periodeTx, periode, owners),
      chartKategori,
      chartTop5: chartKategori.filter((k) => k.name !== KATEGORI_BELUM).slice(0, 5),
    };
  }, [transactions, filter, owners]);

  // Rata-rata harian periode berjalan dikalikan total hari periode; null jika periode belum mulai.
  const proyeksi = useMemo(() => {
    const today = todayIso();
    const { start, end } = view.periode;
    if (today < start) return null;
    const hariDiff = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);
    const totalHari = hariDiff(end, start);
    const berjalan = Math.min(hariDiff(today, start) + 1, totalHari);
    return {
      nominal: Math.round((view.totalKeseluruhan / berjalan) * totalHari),
      rataRata: Math.round(view.totalKeseluruhan / berjalan),
      berjalan,
      totalHari,
    };
  }, [view]);

  // Mode tanggal memakai periode gajian yang memuat tanggal tersebut; mode lain memakai bulan periode.
  const budgetPeriode = useMemo(() => {
    if (filter.mode === "tanggal") {
      const tanggal = view.periode.start;
      const day = Number(tanggal.slice(8, 10));
      const bulan = day >= budgetGajian ? tanggal.slice(0, 7) : shiftBulan(tanggal.slice(0, 7), -1);
      return resolvePeriode({ mode: "gajian", bulan, gajian: String(budgetGajian) });
    }
    return resolvePeriode({ mode: "gajian", bulan: view.periode.bulan, gajian: String(budgetGajian) });
  }, [filter.mode, view.periode.start, view.periode.bulan, budgetGajian]);
  const budgetSpent = useMemo(
    () =>
      transactions
        .filter((t) => inPeriode(t, budgetPeriode) && isPengeluaran(t, owners))
        .reduce((sum, t) => sum + t.total, 0),
    [transactions, budgetPeriode, owners],
  );
  // Fixed Budget dibagi rata ke seluruh hari periode; Batas Aman sisa budget dibagi sisa hari.
  const budgetRows = useMemo(() => {
    const budget = budgets[budgetPeriode.start];
    const perTanggal = new Map<string, number>();
    for (const t of transactions) {
      if (!inPeriode(t, budgetPeriode) || !isPengeluaran(t, owners)) continue;
      const tanggal = t.tanggal.slice(0, 10);
      perTanggal.set(tanggal, (perTanggal.get(tanggal) ?? 0) + t.total);
    }

    const totalHari = Math.round((Date.parse(budgetPeriode.end) - Date.parse(budgetPeriode.start)) / 86_400_000);
    const fixed = new Map<string, number>();
    const aman = new Map<string, number>();
    if (budget !== undefined) {
      let terpakai = 0;
      for (let day = budgetPeriode.start; day < budgetPeriode.end; day = addDays(day, 1)) {
        const sisaHari = Math.round((Date.parse(budgetPeriode.end) - Date.parse(day)) / 86_400_000);
        fixed.set(day, Math.floor(budget / totalHari));
        aman.set(day, Math.max(0, Math.floor((budget - terpakai) / sisaHari)));
        terpakai += perTanggal.get(day) ?? 0;
      }
    }

    const days: string[] = [];
    for (let day = view.periode.start; day < view.periode.end; day = addDays(day, 1)) {
      days.push(day);
    }
    return {
      fixed: days.map((day) => fixed.get(day) ?? null),
      aman: days.map((day) => aman.get(day) ?? null),
    };
  }, [transactions, budgets, budgetPeriode, owners, view.periode.start, view.periode.end]);

  // Sama dengan nilai batas aman harian pada tabel, khusus untuk hari ini.
  const batasAmanHariIni = useMemo(() => {
    const budget = budgets[budgetPeriode.start];
    const today = todayIso();
    if (budget === undefined || today < budgetPeriode.start || today >= budgetPeriode.end) return null;
    const terpakai = transactions
      .filter((t) => inPeriode(t, budgetPeriode) && isPengeluaran(t, owners) && t.tanggal.slice(0, 10) < today)
      .reduce((sum, t) => sum + t.total, 0);
    const sisaHari = Math.round((Date.parse(budgetPeriode.end) - Date.parse(today)) / 86_400_000);
    return Math.max(0, Math.floor((budget - terpakai) / sisaHari));
  }, [transactions, budgets, budgetPeriode, owners]);

  // Gajian berikutnya dihitung dari hari ini; tanggal gajian sama dengan hari ini berarti bulan depan.
  const gajianBerikutnya = useMemo(() => {
    const today = todayIso();
    const bulanIni = today.slice(0, 7);
    const gajianBulanIni = resolvePeriode({ mode: "gajian", bulan: bulanIni, gajian: String(budgetGajian) }).start;
    const tanggal =
      gajianBulanIni > today
        ? gajianBulanIni
        : resolvePeriode({ mode: "gajian", bulan: shiftBulan(bulanIni, 1), gajian: String(budgetGajian) }).start;
    return { tanggal, sisaHari: Math.round((Date.parse(tanggal) - Date.parse(today)) / 86_400_000) };
  }, [budgetGajian]);

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

      <BudgetCard
        key={budgetPeriode.start}
        periodeStart={budgetPeriode.start}
        label={budgetPeriode.label}
        spent={budgetSpent}
        budget={budgets[budgetPeriode.start]}
        gajian={budgetGajian}
        onGajianChange={setBudgetGajian}
      />

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
            <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm">
              {view.deltaPersen === null ? (
                <span className="font-medium text-slate-500">—</span>
              ) : view.deltaPersen > 0 ? (
                <span className="inline-flex items-center gap-1 font-medium text-red-600">
                  <TrendingUp className="size-4" aria-hidden />+{view.deltaPersen.toFixed(1)}%
                </span>
              ) : view.deltaPersen < 0 ? (
                <span className="inline-flex items-center gap-1 font-medium text-green-600">
                  <TrendingDown className="size-4" aria-hidden />
                  {view.deltaPersen.toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                  <Minus className="size-4" aria-hidden />0%
                </span>
              )}
              <span className="text-slate-500">
                {REFERENSI_LABEL[filter.mode]} ({rupiah.format(view.referensiTotal)})
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gajian Berikutnya</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-slate-900 sm:text-xl">{gajianBerikutnya.sisaHari} hari lagi</p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {gajianFormat.format(new Date(`${gajianBerikutnya.tanggal}T00:00:00Z`))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proyeksi Akhir Periode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-slate-900 sm:text-xl">
              {proyeksi ? rupiah.format(proyeksi.nominal) : "—"}
            </p>
            {proyeksi && (
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Berdasarkan {proyeksi.berjalan} dari {proyeksi.totalHari} hari
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Batas Aman Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-slate-900 sm:text-xl">
              {batasAmanHariIni !== null ? rupiah.format(batasAmanHariIni) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rata-rata Pengeluaran Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold text-slate-900 sm:text-xl">
              {proyeksi ? rupiah.format(proyeksi.rataRata) : "—"}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran Harian & Tren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <HarianChart {...view.chartHarian} />
          <HarianTable
            labels={view.chartHarian.labels}
            values={view.chartHarian.values}
            fixedBudget={budgetRows.fixed}
            batasAman={budgetRows.aman}
          />
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
