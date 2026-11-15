"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

const triggerClass =
  "flex h-10 w-full items-center justify-start gap-2 rounded-md border border-slate-200 bg-white px-3 text-left text-sm font-normal text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400";
const popoverClass = "absolute left-0 z-20 mt-1 rounded-md border border-slate-200 bg-white shadow-md";

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const monthFmt = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const monthShortFmt = new Intl.DateTimeFormat("id-ID", { month: "short" });

const pad = (n: number) => String(n).padStart(2, "0");

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function useDismiss(ref: RefObject<HTMLElement | null>, onDismiss: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onDismiss, active]);
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, () => setOpen(false), open);
  const selected = fromIsoDate(value);

  return (
    <div ref={ref} className="relative">
      <span className="mb-1 block text-xs text-slate-600">{label}</span>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={triggerClass}>
        <CalendarDays className="size-4 text-slate-500" aria-hidden />
        {dateFmt.format(selected)}
      </button>
      {open && (
        <div className={popoverClass}>
          <Calendar
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              if (!d) return;
              onChange(toIsoDate(d));
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function MonthField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (yyyyMm: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, () => setOpen(false), open);
  const [y, m] = value.split("-").map(Number);

  function toggle() {
    if (!open) setYear(y);
    setOpen(!open);
  }

  return (
    <div ref={ref} className="relative">
      <span className="mb-1 block text-xs text-slate-600">{label}</span>
      <button type="button" aria-expanded={open} onClick={toggle} className={triggerClass}>
        <CalendarDays className="size-4 text-slate-500" aria-hidden />
        {monthFmt.format(new Date(y, m - 1, 1))}
      </button>
      {open && (
        <div className={`${popoverClass} w-64`}>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Tahun sebelumnya"
              onClick={() => setYear(year - 1)}
              className="rounded-md p-1.5 hover:bg-slate-100"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="text-sm font-semibold text-slate-900">{year}</span>
            <button
              type="button"
              aria-label="Tahun berikutnya"
              onClick={() => setYear(year + 1)}
              className="rounded-md p-1.5 hover:bg-slate-100"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, i) => {
              const active = year === y && i + 1 === m;
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onChange(`${year}-${pad(i + 1)}`);
                    setOpen(false);
                  }}
                  className={`rounded-md px-2 py-2 text-sm capitalize ${
                    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {monthShortFmt.format(new Date(year, i, 1))}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
