"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { setTheme, useTheme, type Theme } from "@/lib/theme";

/** Light / Dark switch for the footer. The choice is saved and applies to every page. */
export default function ThemeSwitch({ className }: { className?: string }) {
  const theme = useTheme();
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];
  return (
    <div role="radiogroup" aria-label="Colour theme" className={cn("inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1", className)}>
      {options.map(({ value, label, icon: Icon }) => {
        const on = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition",
              on ? "bg-[#ffffff] text-[#000000] shadow-sm" : "text-slate-400 hover:text-[#ffffff]"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
          </button>
        );
      })}
    </div>
  );
}
