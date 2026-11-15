"use client";

import { useState, useTransition } from "react";
import { setBudget } from "@/app/actions/budget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { rupiah } from "@/lib/format";
import { GAJIAN_OPTIONS } from "@/lib/periode";

export function BudgetCard({
  periodeStart,
  label,
  spent,
  budget,
  gajian,
  onGajianChange,
}: {
  periodeStart: string;
  label: string;
  spent: number;
  budget: number | undefined;
  gajian: number;
  onGajianChange: (gajian: number) => void;
}) {
  const [value, setValue] = useState(budget ? String(budget) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pct = budget ? (spent / budget) * 100 : 0;
  const over = budget !== undefined && spent > budget;

  function save() {
    const nominal = Number(value);
    startTransition(async () => {
      try {
        await setBudget(periodeStart, nominal);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan budget");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget {label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div role="group" aria-label="Tanggal gajian budget" className="flex gap-1">
          {GAJIAN_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={gajian === g}
              onClick={() => onGajianChange(g)}
              className={`h-9 rounded-md border px-3 text-sm ${
                gajian === g
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Tgl {g}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="number"
            min={0}
            step={10000}
            placeholder="Nominal budget (Rp)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="sm:max-w-xs"
          />
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan budget"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        {budget ? (
          <>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full ${over ? "bg-red-500" : "bg-slate-900"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="text-slate-600">
                Terpakai {rupiah.format(spent)} ({Math.round(pct)}%)
              </span>
              <span className={over ? "font-medium text-red-600" : "font-medium text-slate-900"}>
                {over ? `Lebih ${rupiah.format(spent - budget)}` : `Sisa ${rupiah.format(budget - spent)}`}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">Belum ada budget untuk periode ini.</p>
        )}
      </CardContent>
    </Card>
  );
}
