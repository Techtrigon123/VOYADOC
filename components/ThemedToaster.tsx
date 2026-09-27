"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/lib/theme";

/** Sonner toasts that follow the site's light/dark theme. */
export default function ThemedToaster() {
  const theme = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: "8px",
          fontSize: "14px",
        },
      }}
      richColors
    />
  );
}
