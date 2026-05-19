"use client";

import { useCallback, useEffect, useState } from "react";

export const STORAGE_KEY = "norraagent_stats_baseline";

export interface StatsBaseline {
  total_codes: number;
  unused_codes: number;
  used_codes: number;
  total_users: number;
  activated_users: number;
  total_payments: number;
  total_revenue: number;
  bug_reports: number;
  creator_apps: number;
  licensed_devices: number;
  avg_order_value: number;
  voucher_payments: number;
  full_price_payments: number;
  total_discount_given: number;
  revenue_last_7d: number;
  new_users_7d: number;
  reset_at: string; // ISO date string
}

export function useStatsBaseline() {
  const [baseline, setBaseline] = useState<StatsBaseline | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setBaseline(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
  }, []);

  /** Save current stats as the new baseline (reset point) */
  const saveBaseline = useCallback((stats: Omit<StatsBaseline, "reset_at">) => {
    const entry: StatsBaseline = { ...stats, reset_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    setBaseline(entry);
  }, []);

  /** Clear the baseline → show real cumulative numbers again */
  const clearBaseline = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setBaseline(null);
  }, []);

  /** Apply baseline offset to a raw stats object */
  const applyBaseline = useCallback(
    (raw: Omit<StatsBaseline, "reset_at">): Omit<StatsBaseline, "reset_at"> => {
      if (!baseline) return raw;
      return {
        total_codes:          Math.max(0, raw.total_codes          - baseline.total_codes),
        unused_codes:         Math.max(0, raw.unused_codes         - baseline.unused_codes),
        used_codes:           Math.max(0, raw.used_codes           - baseline.used_codes),
        total_users:          Math.max(0, raw.total_users          - baseline.total_users),
        activated_users:      Math.max(0, raw.activated_users      - baseline.activated_users),
        total_payments:       Math.max(0, raw.total_payments       - baseline.total_payments),
        total_revenue:        Math.max(0, raw.total_revenue        - baseline.total_revenue),
        bug_reports:          Math.max(0, raw.bug_reports          - baseline.bug_reports),
        creator_apps:         Math.max(0, raw.creator_apps         - baseline.creator_apps),
        licensed_devices:     Math.max(0, raw.licensed_devices     - baseline.licensed_devices),
        avg_order_value:      raw.total_payments - baseline.total_payments > 0
                                ? (raw.total_revenue - baseline.total_revenue) /
                                  (raw.total_payments - baseline.total_payments)
                                : 0,
        voucher_payments:     Math.max(0, raw.voucher_payments     - baseline.voucher_payments),
        full_price_payments:  Math.max(0, raw.full_price_payments  - baseline.full_price_payments),
        total_discount_given: Math.max(0, raw.total_discount_given - baseline.total_discount_given),
        revenue_last_7d:      raw.revenue_last_7d,  // 7d window is always relative
        new_users_7d:         raw.new_users_7d,     // 7d window is always relative
      };
    },
    [baseline],
  );

  return { baseline, saveBaseline, clearBaseline, applyBaseline };
}
