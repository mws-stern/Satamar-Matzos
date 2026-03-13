// Performance caching layer for frequently accessed data
import type { Product, Customer, Order, Invoice, Payment } from "@/types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    Array.from(this.cache.keys())
      .filter(key => regex.test(key))
      .forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new DataCache();

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: "products",
  CUSTOMERS: "customers",
  ORDERS: "orders",
  INVOICES: "invoices",
  PAYMENTS: "payments",
  STATS: "stats",
  RECEIVABLES: "receivables",
  INVENTORY: "inventory",
};