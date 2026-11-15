"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useTheme } from "@/components/theme-provider";
import type { ChartHarian } from "@/lib/periode";
import type { ChartBulan, ChartKategori } from "@/lib/summary";

Highcharts.setOptions({
  lang: { thousandsSep: ".", decimalPoint: "," },
  credits: { enabled: false },
  chart: { style: { fontFamily: "inherit" }, animation: false },
});

// Warna chart default shadcn (chart-1 sampai chart-5), versi light dan dark.
const palette = {
  light: ["#e76e50", "#2a9d90", "#274754", "#e8c468", "#f4a462", "#94a3b8"],
  dark: ["#2662d9", "#2eb88a", "#e88c30", "#af57db", "#e23670", "#94a3b8"],
};

function themed(options: Highcharts.Options, dark: boolean): Highcharts.Options {
  const text = dark ? "#cbd5e1" : "#475569";
  const grid = dark ? "#1e293b" : "#e2e8f0";
  const strong = dark ? "#f8fafc" : "#0f172a";
  const base: Highcharts.Options = {
    colors: dark ? palette.dark : palette.light,
    chart: { backgroundColor: "transparent", style: { color: text } },
    legend: { itemStyle: { color: text }, itemHoverStyle: { color: strong } },
    tooltip: { backgroundColor: dark ? "#0f172a" : "#ffffff", borderColor: grid, style: { color: strong } },
  };
  if (options.chart?.type !== "pie") {
    base.xAxis = { labels: { style: { color: text } }, lineColor: grid, tickColor: grid };
    base.yAxis = { labels: { style: { color: text } }, gridLineColor: grid };
  }
  return Highcharts.merge(base, options);
}

export function KategoriChart({ data }: { data: ChartKategori[] }) {
  const dark = useTheme() === "dark";
  if (data.length === 0) return <EmptyChart />;

  const options: Highcharts.Options = {
    chart: { type: "pie", height: 260 },
    title: { text: undefined },
    tooltip: { pointFormat: "<b>Rp {point.y:,.0f}</b> ({point.percentage:.1f}%)" },
    legend: { align: "center", verticalAlign: "bottom", itemStyle: { fontSize: "12px", fontWeight: "normal" } },
    plotOptions: {
      pie: {
        innerSize: "55%",
        dataLabels: { enabled: false },
        showInLegend: true,
        borderWidth: 0,
        borderRadius: 0,
      },
    },
    series: [{ type: "pie", name: "Pengeluaran", data }],
  };

  return <HighchartsReact highcharts={Highcharts} options={themed(options, dark)} />;
}

export function BulananChart({ data }: { data: ChartBulan[] }) {
  const dark = useTheme() === "dark";
  if (data.length === 0) return <EmptyChart />;

  const options: Highcharts.Options = {
    chart: { type: "column", height: 260 },
    title: { text: undefined },
    legend: { enabled: false },
    xAxis: { categories: data.map((d) => d.label), labels: { style: { fontSize: "11px" } } },
    yAxis: {
      title: { text: undefined },
      labels: { formatter: function () { return `${Highcharts.numberFormat(Number(this.value) / 1000, 0)}rb`; } },
    },
    tooltip: { pointFormat: "<b>Rp {point.y:,.0f}</b>" },
    plotOptions: { column: { borderRadius: 0, color: (dark ? palette.dark : palette.light)[0] } },
    series: [{ type: "column", name: "Pengeluaran", data: data.map((d) => d.y) }],
  };

  return <HighchartsReact highcharts={Highcharts} options={themed(options, dark)} />;
}

export function HarianChart({ labels, values, trend }: ChartHarian) {
  const dark = useTheme() === "dark";
  if (values.every((v) => v === 0)) return <EmptyChart />;

  const c = dark ? palette.dark : palette.light;
  const options: Highcharts.Options = {
    chart: { height: 260 },
    title: { text: undefined },
    legend: { align: "center", verticalAlign: "bottom", itemStyle: { fontSize: "12px", fontWeight: "normal" } },
    xAxis: {
      categories: labels,
      tickInterval: Math.ceil(labels.length / 8),
      labels: { style: { fontSize: "10px" } },
    },
    yAxis: {
      title: { text: undefined },
      labels: { formatter: function () { return `${Highcharts.numberFormat(Number(this.value) / 1000, 0)}rb`; } },
    },
    tooltip: { shared: true, pointFormat: "{series.name}: <b>Rp {point.y:,.0f}</b><br/>" },
    plotOptions: { column: { borderRadius: 0 }, spline: { marker: { enabled: false } } },
    series: [
      { type: "column", name: "Pengeluaran harian", data: values, color: c[0] },
      { type: "spline", name: "Tren (rata-rata 7 hari)", data: trend, color: c[1], lineWidth: 2 },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={themed(options, dark)} />;
}

export function TopKategoriChart({ data }: { data: ChartKategori[] }) {
  const dark = useTheme() === "dark";
  if (data.length === 0) return <EmptyChart />;

  const options: Highcharts.Options = {
    chart: { type: "column", height: 260 },
    title: { text: undefined },
    legend: { enabled: false },
    xAxis: { categories: data.map((d) => d.name), labels: { style: { fontSize: "11px" } } },
    yAxis: {
      title: { text: undefined },
      labels: { formatter: function () { return `${Highcharts.numberFormat(Number(this.value) / 1000, 0)}rb`; } },
    },
    tooltip: { pointFormat: "<b>Rp {point.y:,.0f}</b>" },
    plotOptions: { column: { borderRadius: 0, colorByPoint: true } },
    series: [{ type: "column", name: "Pengeluaran", data: data.map((d) => d.y) }],
  };

  return <HighchartsReact highcharts={Highcharts} options={themed(options, dark)} />;
}

function EmptyChart() {
  return <p className="py-10 text-center text-sm text-slate-500">Belum ada data untuk grafik.</p>;
}
