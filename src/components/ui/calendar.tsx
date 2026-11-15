"use client";

import { DayPicker } from "react-day-picker";
import { id } from "react-day-picker/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function Chevron({ orientation }: { orientation?: "up" | "down" | "left" | "right" }) {
  const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
  return <Icon className="size-4" aria-hidden />;
}

export function Calendar({
  selected,
  onSelect,
  defaultMonth,
  className,
}: {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  defaultMonth?: Date;
  className?: string;
}) {
  return (
    <DayPicker
      mode="single"
      locale={id}
      selected={selected}
      onSelect={onSelect}
      defaultMonth={defaultMonth}
      showOutsideDays
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium text-slate-900",
        nav: "absolute inset-x-3 top-3 flex items-center justify-between",
        button_previous:
          "inline-flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50",
        button_next:
          "inline-flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex-1 text-center text-[0.8rem] font-normal text-slate-500",
        week: "mt-2 flex w-full",
        day: "relative flex-1 p-0 text-center text-sm",
        day_button:
          "inline-flex size-9 items-center justify-center rounded-md font-normal text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 aria-selected:bg-slate-900 aria-selected:text-white aria-selected:hover:bg-slate-800 disabled:text-slate-300 disabled:hover:bg-transparent",
        today: "[&>button]:ring-1 [&>button]:ring-slate-300",
        outside: "[&>button]:text-slate-400",
        hidden: "invisible",
      }}
      components={{ Chevron }}
    />
  );
}
