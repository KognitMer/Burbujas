import { describe, it, expect, beforeEach, vi } from "vitest";

function fakeLS(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _m: m };
}
let mod;
beforeEach(async () => {
  vi.resetModules();
  globalThis.localStorage = fakeLS({
    "kognit-bubbles-mode": "explotar", "kognit-bubbles-speed-v3": "2", "kognit-bubbles-music": "kalimba",
    "kognit-bubbles-best-v3-soltar": "41", "kognit-bubbles-breath": "0"
  });
  mod = await import("../src/core/storage.js");
});

describe("storage", () => {
  it("migra las claves del prototipo sin borrarlas", () => {
    expect(mod.migrate()).toBe(true);
    expect(mod.settings.get()).toMatchObject({ mode: "explotar", speed: 2, music: "kalimba", breath: false });
    expect(mod.bests.get("soltar")).toBe(41);
    expect(globalThis.localStorage.getItem("kognit-bubbles-mode")).toBe("explotar");
  });
  it("migra una sola vez", () => { mod.migrate(); expect(mod.migrate()).toBe(false); });
  it("usa el prefijo kognit.burbujas.", () => {
    mod.store.set("x", 1);
    expect(globalThis.localStorage.getItem("kognit.burbujas.x")).toBe("1");
  });
  it("funciona en memoria si localStorage falla", async () => {
    vi.resetModules();
    globalThis.localStorage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() {} };
    const m = await import("../src/core/storage.js");
    m.store.set("a", 5);
    expect(m.store.get("a", 0)).toBe(5);
  });
});
