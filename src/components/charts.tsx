"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { ChartHarian } from "@/lib/periode";
import type { ChartBulan, ChartKategori } from "@/lib/summary";

Highcharts.setOptions({
  lang: { thousandsSep: ".", decimalPoint: "," },
  credits: { enabled: false },
  chart: { style: { fontFamily: "inherit" }, animation: false },
});

const palette = ["#0f172a", "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d", "#94a3b8"];

export function KategoriChart({ data }: { data: ChartKategori[] }) {
  if (data.length === 0) return <EmptyChart />;

  const options: Highcharts.Options = {
    chart: { type: "pie", height: 260, backgroundColor: "transparent" },
    title: { text: undefined },
    colors: palette,
    tooltip: { pointFormat: "<b>Rp {point.y:,.0f}</b> ({point.percentage:.1f}%)" },
    legend: { align: "center", verticalAlign: "bottom", itemStyle: { fontSize: "12px", fontWeight: "normal" } },
    plotOptions: {
      pie: {
        innerSize: "55%",
        dataLabels: { enabled: false },
        showInLegend: true,
        borderWidth: 0,
      },
    },
    series: [{ type: "pie", name: "Pengeluaran", data }],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

export function BulananChart({ data }: { data: ChartBulan[] }) {
  if (data.length === 0) return <EmptyChart />;

  const options: Highcharts.Options = {
    chart: { type: "column", height: 260, backgroundColor: "transparent" },
    title: { text: undefined },
    legend: { enabled: false },
    xAxis: { categories: data.map((d) => d.label), labels: { style: { fontSize: "11px" } } },
    yAxis: {
      title: { text: undefined },
      labels: { formatter: function () { return `${Highcharts.numberFormat(Number(this.value) / 1000, 0)}rb`; } },
    },
    tooltip: { pointFormat: "<b>Rp {point.y:,.0f}</b>" },
    plotOptions: { column: { borderRadius: 4, color: "#2563eb" } },
    series: [{ type: "column", name: "Pengeluaran", data: data.map((d) => d.y) }],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

export function HarianChart({ labels, values, trend }: ChartHarian) {
  if (values.every((v) => v === 0)) return <EmptyChart />;

  const options: Highcharts.Options = {
    chart: { height: 260, backgroundColor: "transparent" },
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
    plotOptions: { column: { borderRadius: 2 }, spline: { marker: { enabled: false } } },
    series: [
      { type: "column", name: "Pengeluaran harian", data: values, color: "#94a3b8" },
      { type: "spline", name: "Tren (rata-rata 7 hari)", data: trend, color: "#2563eb", lineWidth: 2 },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

export function TopKategoriChart({ data }: { data: ChartKategori[] }) {
  if (data.length === 0) return <EmptyChart />;

  const options: Highcharts.Options = {
    chart: { type: "column", height: 260, backgroundColor: "transparent" },
    title: { text: undefined },
    colors: palette,
    legend: { enabled: false },
    xAxis: { categories: data.map((d) => d.name), labels: { style: { fontSize: "11px" } } },
    yAxis: {
      title: { text: undefined },
      labels: { formatter: function () { return `${Highcharts.numberFormat(Number(this.value) / 1000, 0)}rb`; } },
    },
    tooltip: { pointFormat: "<b>Rp {point.y:,.0f}</b>" },
    plotOptions: { column: { borderRadius: 4, colorByPoint: true } },
    series: [{ type: "column", name: "Pengeluaran", data: data.map((d) => d.y) }],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

function EmptyChart() {
  return <p className="py-10 text-center text-sm text-slate-500">Belum ada data untuk grafik.</p>;
}
