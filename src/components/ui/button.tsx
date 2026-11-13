import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  default: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-100",
  ghost: "text-slate-700 hover:bg-slate-100",
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
