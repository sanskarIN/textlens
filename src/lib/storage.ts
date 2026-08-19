export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type StorageMode = "native" | "memory" | "unavailable";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function browserStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function installStorageFallback(): StorageMode {
  const native = browserStorage();
  if (native && storageIsWritable(native)) return "native";

  const memory = new MemoryStorage();
  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: memory,
    });
    return "memory";
  } catch {
    return "unavailable";
  }
}

export function readStorageItem(key: string, storage: StorageLike | null = browserStorage()): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorageItem(
  key: string,
  value: string,
  storage: StorageLike | null = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(key: string, storage: StorageLike | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function storageIsWritable(storage: StorageLike): boolean {
  const key = "textlens.storage.probe";
  let previous: string | null = null;
  try {
    previous = storage.getItem(key);
    storage.setItem(key, "1");
    if (previous === null) storage.removeItem(key);
    else storage.setItem(key, previous);
    return true;
  } catch {
    try {
      if (previous === null) storage.removeItem(key);
      else storage.setItem(key, previous);
    } catch {
      // Nothing else can be recovered from a blocked storage implementation.
    }
    return false;
  }
}
