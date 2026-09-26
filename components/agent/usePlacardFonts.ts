"use client";

import { useEffect } from "react";
import { PLACARD_FONT_HREF } from "@/lib/agent/placardCanvas";

/** Load the Google Fonts the placard themes draw with (once per page). */
export function usePlacardFonts() {
  useEffect(() => {
    if (document.querySelector("link[data-placard-fonts]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = PLACARD_FONT_HREF;
    link.dataset.placardFonts = "1";
    document.head.appendChild(link);
  }, []);
}
