import type { Transaction } from "@/lib/types";
import { isPengeluaran } from "@/lib/summary";

export type Mode = "bulan" | "gajian" | "rentang";
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

export function currentBulan(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

export function resolvePeriode(params: SearchParams): Periode {
  const modeParam = first(params.mode);
  const mode: Mode = modeParam === "gajian" || modeParam === "rentang" ? modeParam : "bulan";
  const bulanParam = first(params.bulan);
  const bulan = bulanParam && /^\d{4}-\d{2}$/.test(bulanParam) ? bulanParam : currentBulan();
  const gajianParam = Number(first(params.gajian));
  const gajian = (GAJIAN_OPTIONS as readonly number[]).includes(gajianParam) ? gajianParam : 25;

  const [year, month] = bulan.split("-").map(Number);
  // Date.UTC memakai bulan 1-based di sini, sehingga menghasilkan bulan berikutnya.
  const nextMonth = toIso(new Date(Date.UTC(year, month, 1)));

  if (mode === "rentang") {
    const dari = first(params.dari);
    const sampai = first(params.sampai);
    if (dari && sampai && ISO_DATE.test(dari) && ISO_DATE.test(sampai) && sampai >= dari) {
      const start = dari;
      const end = addDays(sampai, 1);
      return {
        mode,
        bulan,
        gajian,
        start,
        end,
        label: `${tanggalFmt.format(parseIso(start))} – ${tanggalFmt.format(parseIso(sampai))}`,
      };
    }
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

export function buildChartHarian(transactions: Transaction[], periode: Periode): ChartHarian {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (!isPengeluaran(t)) continue;
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
