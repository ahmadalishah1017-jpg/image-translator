import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store usable from any client component.
 * Falls back to in-memory state when storage is unavailable (private mode, quota, blocked cookies).
 */
export function createLocalStore<T>(key: string, fallback: T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  function get(): T {
    if (cache !== undefined) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      cache = fallback;
    }
    return cache;
  }

  /** Returns false if the value couldn't be persisted (it is still kept in memory). */
  function set(next: T | ((prev: T) => T)): boolean {
    cache = typeof next === "function" ? (next as (prev: T) => T)(get()) : next;
    let persisted = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      persisted = false;
    }
    listeners.forEach((l) => l());
    return persisted;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = undefined;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, get, () => fallback);
  }

  return { get, set, useValue };
}
