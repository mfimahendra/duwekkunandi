import { Suspense } from "react";
import { connection } from "next/server";
import { logoutAction } from "@/app/actions/auth";
import { TransactionList, rupiah } from "@/components/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTransactions } from "@/lib/transactions";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Monitoring Keuangan</h1>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Keluar
          </Button>
        </form>
      </header>

      <Suspense fallback={<p className="text-sm text-slate-500">Memuat data...</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  await connection();
  const transactions = await getTransactions();

  const totalNominal = transactions.reduce((sum, t) => sum + t.nominal, 0);
  const totalBiaya = transactions.reduce((sum, t) => sum + t.biaya, 0);
  const totalKeseluruhan = transactions.reduce((sum, t) => sum + t.total, 0);

  const perKategori = Object.entries(
    transactions.reduce<Record<string, number>>((acc, t) => {
      const key = t.kategori || "Tanpa kategori";
      acc[key] = (acc[key] ?? 0) + t.total;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <>
      <p className="-mt-4 text-sm text-slate-500">{transactions.length} transaksi</p>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Nominal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-slate-900 sm:text-xl">{rupiah.format(totalNominal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Biaya</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-slate-900 sm:text-xl">{rupiah.format(totalBiaya)}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Total Keseluruhan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-slate-900 sm:text-xl">
              {rupiah.format(totalKeseluruhan)}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Kategori Teratas</CardTitle>
          </CardHeader>
          <CardContent>
            {perKategori.length === 0 ? (
              <p className="text-sm text-slate-400">-</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {perKategori.map(([name, value]) => (
                  <li key={name} className="flex justify-between gap-2">
                    <span className="truncate text-slate-600">{name}</span>
                    <span className="shrink-0 font-medium text-slate-900">{rupiah.format(value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={transactions} />
        </CardContent>
      </Card>
    </>
  );
}
