import { Suspense } from "react";
import { connection } from "next/server";
import { logoutAction } from "@/app/actions/auth";
import { DashboardView } from "@/components/dashboard-view";
import { SyncButton } from "@/components/sync-button";
import { Button } from "@/components/ui/button";
import { readCategoryStore } from "@/lib/categories";
import { readTransactionsSnapshot } from "@/lib/transactions";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 p-4 sm:space-y-6 sm:p-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-2xl">Monitoring Keuangan</h1>
          <SyncButton />
        </div>
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
  const [snapshot, store] = await Promise.all([readTransactionsSnapshot(), readCategoryStore()]);
  return (
    <DashboardView transactions={snapshot?.data ?? []} fetchedAt={snapshot?.fetchedAt ?? null} store={store} />
  );
}
