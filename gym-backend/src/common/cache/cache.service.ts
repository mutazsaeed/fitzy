/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

type Jsonish = string | number | boolean | null | Jsonish[] | { [k: string]: Jsonish };

interface Entry {
  expiresAt: number; // epoch ms
  value: unknown;
}

@Injectable()
export class InMemoryCacheService {
  private store = new Map<string, Entry>();

  /** Get cached value if not expired, else undefined */
  get<T = unknown>(key: string): T | undefined {
    const ent = this.store.get(key);
    if (!ent) return undefined;
    if (ent.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return ent.value as T;
  }

  /** Set value with TTL (ms). Default 60s */
  set(key: string, value: unknown, ttlMs = 60_000): void {
    this.store.set(key, { value, expiresAt: Date.now() + Math.max(1, ttlMs) });
  }

  /** Delete a key (optional) */
  del(key: string): void {
    this.store.delete(key);
  }

  /** Build stable cache key from namespace + params */
  static key(ns: string, params: Jsonish): string {
    return `${ns}:${stableStringify(params)}`;
  }
}

/** Deterministic stringify for objects/arrays (stable keys) */
function stableStringify(v: Jsonish): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  const obj = v as { [k: string]: Jsonish };
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}
