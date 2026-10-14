"use client";

import { useEffect, useMemo, useState } from "react";

// 5x7 dot-matrix glyphs. Only the letters the app actually shows.
const GLYPHS: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};

export type LedTone = "ok" | "warn" | "bad";

const CHARS = 4;
const COLS = CHARS * 6 - 1; // 5 columns per letter + 1 blank between letters
const ROWS = 7;
// Same geometry as the mockup's SVG: 12px beads on a 15px pitch, rx 3, scaled 1.2.
const PITCH = 15;
const BEAD = 12;
const ORIGIN = 10;

function render(text: string): boolean[] {
  const cells = new Array<boolean>(COLS * ROWS).fill(false);
  const padded = text.padEnd(CHARS, " ").slice(0, CHARS);
  [...padded].forEach((ch, ci) => {
    const glyph = GLYPHS[ch] ?? GLYPHS[" "];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < 5; c++) {
        if (glyph[r][c] === "#") cells[r * COLS + ci * 6 + c] = true;
      }
    }
  });
  return cells;
}

export default function LedDisplay({ text, tone = "ok", busy = false }: { text: string; tone?: LedTone; busy?: boolean }) {
  const target = useMemo(() => render(text), [text]);
  const [noise, setNoise] = useState<{ text: string; cells: boolean[] } | null>(null);
  const [sweep, setSweep] = useState(-1);

  // When the word changes, flicker for a moment and settle on the new word.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      if (frame > 7) {
        setNoise(null);
        clearInterval(id);
        return;
      }
      const settle = frame / 8;
      setNoise({ text, cells: target.map((on) => (Math.random() < settle ? on : Math.random() < 0.3)) });
    }, 40);
    return () => clearInterval(id);
  }, [target, text]);

  // While the model is reading, a bright column sweeps across the board.
  useEffect(() => {
    if (!busy || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let col = 0;
    const id = setInterval(() => {
      setSweep(col);
      col = (col + 1) % (COLS + 4);
    }, 70);
    return () => {
      clearInterval(id);
      setSweep(-1);
    };
  }, [busy]);

  const cells = noise && noise.text === text ? noise.cells : target;
  const [c1, c2] = tone === "bad" ? ["dot-b1", "dot-b2"] : tone === "warn" ? ["dot-w1", "dot-w2"] : ["dot-p1", "dot-p2"];
  const activeSweep = busy ? sweep : -1;

  return (
    <svg
      role="img"
      aria-label={`Status: ${text.trim()}`}
      className="w-full h-auto max-w-full drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]"
      viewBox="0 0 480 160"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="scale(1.2) translate(10, 8)">
        {cells.map((on, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const lit = on || (activeSweep >= 0 && (col === activeSweep || col === activeSweep - 1));
          if (!lit) return null;
          return (
            <rect
              key={i}
              className={(row + col) % 2 ? c1 : c2}
              x={ORIGIN + col * PITCH}
              y={ORIGIN + row * PITCH}
              width={BEAD}
              height={BEAD}
              rx={3}
            />
          );
        })}
      </g>
    </svg>
  );
}
