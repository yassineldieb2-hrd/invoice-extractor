"use client";

import { useEffect } from "react";

/** Hides Material Symbols ligature text (e.g. the word "terminal") if the icon font cannot load. */
export default function IconFontGuard() {
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    const root = document.documentElement;
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) root.classList.add("ms-missing");
    }, 3000);
    fonts
      .load('20px "Material Symbols Outlined"', "terminal")
      .then((loaded) => {
        settled = true;
        root.classList.toggle("ms-missing", loaded.length === 0);
      })
      .catch(() => {
        settled = true;
        root.classList.add("ms-missing");
      });
    return () => clearTimeout(timer);
  }, []);
  return null;
}
