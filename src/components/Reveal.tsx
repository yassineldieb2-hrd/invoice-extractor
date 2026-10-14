"use client";

import { createElement, useEffect, useState } from "react";

/**
 * Fades/rises its content in once when it scrolls into view.
 * Content is only hidden while <html> has the "js-reveal" class (set by an inline
 * script in layout.tsx), so it stays visible if scripts or IntersectionObserver fail.
 */
export function Reveal({
  as = "div",
  className = "",
  delay = 0,
  children,
  ...rest
}: {
  as?: string;
  className?: string;
  delay?: number;
  children?: React.ReactNode;
} & Record<string, unknown>) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("reveal-ready");
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el]);

  return createElement(
    as,
    {
      ref: setEl,
      className: `reveal ${inView ? "is-in" : ""} ${className}`,
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
      ...rest,
    },
    children,
  );
}

/** Returns the id of the section currently in the middle band of the viewport. */
export function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = key
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
  return active;
}

/** True once the page has scrolled past a few pixels. */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > offset);
    const t = setTimeout(on, 0);
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", on);
    };
  }, [offset]);
  return scrolled;
}
