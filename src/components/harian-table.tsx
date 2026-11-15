"use client";

import { rupiah } from "@/lib/format";

// Interpolasi dari hijau (rendah) ke merah (tinggi) menggunakan warna Tailwind green-500 dan red-500.
const LOW = [34, 197, 94];
const HIGH = [239, 68, 68];

function heatColor(t: number): string {
  const [r, g, b] = LOW.map((low, i) => Math.round(low + (HIGH[i] - low) * t));
  return `rgba(${r}, ${g}, ${b}, ${(0.15 + 0.35 * t).toFixed(2)})`;
}

export function HarianTable({
  labels,
  values,
  fixedBudget,
  batasAman,
}: {
  labels: string[];
  values: number[];
  fixedBudget: (number | null)[];
  batasAman: (number | null)[];
}) {
  const max = Math.max(0, ...values);

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="text-sm">
        <tbody>
          <tr className="border-b border-slate-200">
            <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-medium text-slate-500">
              Tanggal
            </th>
            {labels.map((label, i) => (
              <th key={label + i} className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-slate-500">
                {label}
              </th>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-medium text-slate-600">
              Fixed Budget
            </th>
            {fixedBudget.map((value, i) => (
              <td key={labels[i] + i} className="whitespace-nowrap px-3 py-1.5 text-right text-slate-600">
                {value === null ? "—" : rupiah.format(value)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-medium text-slate-600">
              Batas Aman Budget
            </th>
            {batasAman.map((value, i) => (
              <td key={labels[i] + i} className="whitespace-nowrap px-3 py-1.5 text-right text-slate-600">
                {value === null ? "—" : rupiah.format(value)}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-medium text-slate-900">
              Actual Pengeluaran
            </th>
            {values.map((value, i) => {
              const t = max > 0 ? value / max : 0;
              return (
                <td
                  key={labels[i] + i}
                  className="whitespace-nowrap px-3 py-1.5 text-right font-medium text-slate-900"
                  style={{ backgroundColor: heatColor(t) }}
                >
                  {rupiah.format(value)}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
