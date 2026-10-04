import { describe, it, expect } from "vitest";
import { popPoints, escapePoints, applyDelta, pointsFromCounts, EMPTY_COUNTS } from "../src/core/scoring.js";

describe("tabla de puntajes", () => {
  it("Soltar: explotar difícil -1, positiva +2, neutral +5", () => {
    expect(popPoints("soltar", "neg")).toBe(-1);
    expect(popPoints("soltar", "pos")).toBe(2);
    expect(popPoints("soltar", "neu")).toBe(5);
  });
  it("Soltar: dejar ir difícil +1, positiva -1", () => {
    expect(escapePoints("soltar", "neg")).toBe(1);
    expect(escapePoints("soltar", "pos")).toBe(-1);
  });
  it("Explotar: difícil +3, positiva -1, neutral +5; escapar no puntúa", () => {
    expect(popPoints("explotar", "neg")).toBe(3);
    expect(popPoints("explotar", "pos")).toBe(-1);
    expect(popPoints("explotar", "neu")).toBe(5);
    for (const t of ["neg", "pos", "neu"]) expect(escapePoints("explotar", t)).toBe(0);
  });
  it("Zen no puntúa", () => {
    for (const t of ["neg", "pos", "neu"]) { expect(popPoints("zen", t)).toBe(0); expect(escapePoints("zen", t)).toBe(0); }
  });
});

describe("applyDelta", () => {
  it("nunca baja de 0 y devuelve lo realmente aplicado", () => {
    expect(applyDelta(0, -1)).toEqual({ score: 0, applied: 0 });
    expect(applyDelta(3, -1)).toEqual({ score: 2, applied: -1 });
    expect(applyDelta(3, 2)).toEqual({ score: 5, applied: 2 });
  });
});

describe("pointsFromCounts (validación del lado servidor)", () => {
  it("cuenta ganados y perdidos brutos", () => {
    const c = { ...EMPTY_COUNTS(), popNeg: 2, popPos: 3, popNeu: 1, relNeg: 4, relPos: 1 };
    const r = pointsFromCounts("soltar", c);
    expect(r.earned).toBe(3 * 2 + 1 * 5 + 4 * 1);
    expect(r.lost).toBe(2 * 1 + 1 * 1);
  });
});
