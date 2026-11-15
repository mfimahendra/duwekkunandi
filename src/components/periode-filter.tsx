"use client";

import { useState } from "react";
import { DateField, MonthField } from "@/components/date-fields";
import { GAJIAN_OPTIONS, type Mode } from "@/lib/periode";

export type PeriodeState = {
  mode: Mode;
  bulan: string;
  gajian: number;
  tanggal: string;
};

const MODES: { value: Mode; label: string }[] = [
  { value: "bulan", label: "Bulan" },
  { value: "gajian", label: "Bulan Gajian" },
  { value: "tanggal", label: "Tanggal" },
];

export function PeriodeFilter({
  value,
  onApply,
}: {
  value: PeriodeState;
  onApply: (next: PeriodeState) => void;
}) {
  const [draft, setDraft] = useState(value);
  const set = (patch: Partial<PeriodeState>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(value);

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Mode periode" className="inline-flex flex-wrap rounded-lg bg-slate-100 p-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            aria-pressed={draft.mode === m.value}
            onClick={() => set({ mode: m.value })}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              draft.mode === m.value
                ? "bg-white font-medium text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {draft.mode !== "tanggal" && (
          <div className="w-full sm:w-56">
            <MonthField label="Bulan" value={draft.bulan} onChange={(bulan) => set({ bulan })} />
          </div>
        )}

        {draft.mode === "gajian" && (
          <div role="group" aria-label="Tanggal gajian" className="flex gap-1">
            {GAJIAN_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={draft.gajian === g}
                onClick={() => set({ gajian: g })}
                className={`h-10 rounded-md border px-3 text-sm ${
                  draft.gajian === g
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Tgl {g}
              </button>
            ))}
          </div>
        )}

        {draft.mode === "tanggal" && (
          <div className="w-full sm:w-56">
            <DateField label="Tanggal" value={draft.tanggal} onChange={(tanggal) => set({ tanggal })} />
          </div>
        )}

        <button
          type="button"
          disabled={!dirty}
          onClick={() => onApply(draft)}
          className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-40"
        >
          Terapkan
        </button>
      </div>
    </div>
  );
}
