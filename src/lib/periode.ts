import type { Transaction } from "@/lib/types";
import { isPengeluaran } from "@/lib/summary";

export type Mode = "bulan" | "gajian" | "tanggal";
export type SearchParams = Record<string, string | string[] | undefined>;

export const GAJIAN_OPTIONS = [23, 24, 25] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type Periode = {
  mode: Mode;
  bulan: string;
  gajian: number;
  start: string;
  end: string;
  label: string;
};

export type ChartHarian = {
  labels: string[];
  values: number[];
  trend: number[];
};

const tanggalFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const hariFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

export function shiftBulan(bulan: string, months: number): string {
  const [year, month] = bulan.split("-").map(Number);
  return toIso(new Date(Date.UTC(year, month - 1 + months, 1))).slice(0, 7);
}

// Label pembanding untuk setiap mode filter.
export const REFERENSI_LABEL: Record<Mode, string> = {
  bulan: "vs bulan lalu",
  gajian: "vs bulan gajian sebelumnya",
  tanggal: "vs kemarin",
};

// Periode acuan: bulan lalu (mode bulan), periode gajian bulan sebelumnya (mode gajian), atau kemarin (mode tanggal).
export function resolveReferensi(params: { mode: Mode; bulan: string; gajian: number; tanggal: string }): Periode {
  if (params.mode === "tanggal") {
    return resolvePeriode({ mode: "tanggal", tanggal: addDays(params.tanggal, -1) });
  }
  return resolvePeriode({
    mode: params.mode,
    bulan: shiftBulan(params.bulan, -1),
    gajian: String(params.gajian),
  });
}

export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function currentBulan(): string {
  return todayIso().slice(0, 7);
}

export function resolvePeriode(params: SearchParams): Periode {
  const modeParam = first(params.mode);
  const mode: Mode = modeParam === "gajian" || modeParam === "tanggal" ? modeParam : "bulan";
  const bulanParam = first(params.bulan);
  const bulan = bulanParam && /^\d{4}-\d{2}$/.test(bulanParam) ? bulanParam : currentBulan();
  const gajianParam = Number(first(params.gajian));
  const gajian = (GAJIAN_OPTIONS as readonly number[]).includes(gajianParam) ? gajianParam : 25;

  const [year, month] = bulan.split("-").map(Number);
  // Date.UTC memakai bulan 1-based di sini, sehingga menghasilkan bulan berikutnya.
  const nextMonth = toIso(new Date(Date.UTC(year, month, 1)));

  if (mode === "tanggal") {
    const tanggalParam = first(params.tanggal);
    const tanggal = tanggalParam && ISO_DATE.test(tanggalParam) ? tanggalParam : todayIso();
    return {
      mode,
      bulan: tanggal.slice(0, 7),
      gajian,
      start: tanggal,
      end: addDays(tanggal, 1),
      label: tanggalFmt.format(parseIso(tanggal)),
    };
  }

  if (mode !== "gajian") {
    const start = `${bulan}-01`;
    const end = nextMonth;
    return {
      mode: "bulan",
      bulan,
      gajian,
      start,
      end,
      label: `${tanggalFmt.format(parseIso(start))} – ${tanggalFmt.format(parseIso(addDays(end, -1)))}`,
    };
  }

  const start = `${bulan}-${String(gajian).padStart(2, "0")}`;
  const end = toIso(new Date(Date.UTC(year, month, gajian)));
  return {
    mode,
    bulan,
    gajian,
    start,
    end,
    label: `${tanggalFmt.format(parseIso(start))} – ${tanggalFmt.format(parseIso(addDays(end, -1)))}`,
  };
}

export function inPeriode(t: Transaction, periode: Periode): boolean {
  const tanggal = t.tanggal.slice(0, 10);
  return tanggal >= periode.start && tanggal < periode.end;
}

export function buildChartHarian(transactions: Transaction[], periode: Periode, owners: string[]): ChartHarian {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (!isPengeluaran(t, owners)) continue;
    const tanggal = t.tanggal.slice(0, 10);
    totals.set(tanggal, (totals.get(tanggal) ?? 0) + t.total);
  }

  const days: string[] = [];
  for (let day = periode.start; day < periode.end; day = addDays(day, 1)) {
    days.push(day);
  }

  const values = days.map((day) => totals.get(day) ?? 0);
  const trend = values.map((_, i) => {
    const window = values.slice(Math.max(0, i - 6), i + 1);
    return Math.round(window.reduce((sum, v) => sum + v, 0) / window.length);
  });

  return {
    labels: days.map((day) => hariFmt.format(parseIso(day))),
    values,
    trend,
  };
}
