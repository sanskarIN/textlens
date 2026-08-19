import { describe, expect, it } from "vitest";

import {
  readStorageItem,
  removeStorageItem,
  writeStorageItem,
  type StorageLike,
} from "./storage";

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

describe("failure-safe browser storage", () => {
  it("reads writes and removes through an available storage implementation", () => {
    const storage = memoryStorage();
    expect(writeStorageItem("key", "value", storage)).toBe(true);
    expect(readStorageItem("key", storage)).toBe("value");
    expect(removeStorageItem("key", storage)).toBe(true);
    expect(readStorageItem("key", storage)).toBeNull();
  });

  it("returns safe fallbacks when storage is unavailable", () => {
    expect(readStorageItem("key", null)).toBeNull();
    expect(writeStorageItem("key", "value", null)).toBe(false);
    expect(removeStorageItem("key", null)).toBe(false);
  });

  it("contains storage implementation exceptions", () => {
    const failing: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readStorageItem("key", failing)).toBeNull();
    expect(writeStorageItem("key", "value", failing)).toBe(false);
    expect(removeStorageItem("key", failing)).toBe(false);
  });
});
