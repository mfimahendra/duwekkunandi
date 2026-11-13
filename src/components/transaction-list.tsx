import type { Transaction } from "@/lib/transactions";

export const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function Dash({ value }: { value: string }) {
  return value || <span className="text-slate-300">-</span>;
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Belum ada transaksi.</p>;
  }

  return (
    <>
      {/* Mobile: kartu */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {transactions.map((t) => (
          <li key={t.id} className="space-y-1 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  <Dash value={t.penerima} />
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
              <th className="py-2 pr-4 font-medium">Tanggal</th>
              <th className="py-2 pr-4 font-medium">Jam</th>
              <th className="py-2 pr-4 font-medium">Bank</th>
              <th className="py-2 pr-4 font-medium">Jenis</th>
              <th className="py-2 pr-4 font-medium">Penerima/Penyedia</th>
              <th className="py-2 pr-4 text-right font-medium">Nominal</th>
              <th className="py-2 pr-4 text-right font-medium">Biaya</th>
              <th className="py-2 pr-4 text-right font-medium">Total</th>
              <th className="py-2 pr-4 font-medium">Kategori</th>
              <th className="py-2 pr-4 font-medium">Rekening</th>
              <th className="py-2 pr-4 font-medium">No Referensi</th>
              <th className="py-2 font-medium">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id} className="align-top text-slate-700">
                <td className="whitespace-nowrap py-2 pr-4">
                  <Dash value={t.tanggal} />
                </td>
                <td className="whitespace-nowrap py-2 pr-4">
                  <Dash value={t.jam} />
                </td>
                <td className="py-2 pr-4">
                  <Dash value={t.bank} />
                </td>
                <td className="py-2 pr-4">
                  <Dash value={t.jenis} />
                </td>
                <td className="py-2 pr-4">
                  <Dash value={t.penerima} />
                </td>
                <td className="whitespace-nowrap py-2 pr-4 text-right">{rupiah.format(t.nominal)}</td>
                <td className="whitespace-nowrap py-2 pr-4 text-right">{rupiah.format(t.biaya)}</td>
                <td className="whitespace-nowrap py-2 pr-4 text-right font-semibold text-slate-900">
                  {rupiah.format(t.total)}
                </td>
                <td className="py-2 pr-4">
                  <Dash value={t.kategori} />
                </td>
                <td className="py-2 pr-4">
                  <Dash value={t.rekening} />
                </td>
                <td className="py-2 pr-4">
                  <Dash value={t.noReferensi} />
                </td>
                <td className="py-2 text-slate-500">
                  <Dash value={t.keterangan} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
