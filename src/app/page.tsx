"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useStatsBaseline } from "@/lib/useStatsBaseline";
import StatCard from "@/components/StatCard";
import DataTable from "@/components/DataTable";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  CreditCard, Users, Key,
  Bug, Zap, RefreshCw, ArrowRight, Mail, TrendingUp, DollarSign, Gift, Star,
  RotateCcw, AlertTriangle, X, CheckCircle2,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface Stats {
  total_codes: number; unused_codes: number; used_codes: number;
  total_users: number; activated_users: number;
  total_payments: number; total_revenue: number;
  bug_reports: number; creator_apps: number; licensed_devices: number;
  avg_order_value: number;
  voucher_payments: number; full_price_payments: number;
  total_discount_given: number;
  revenue_last_7d: number;
  new_users_7d: number;
}
interface DailyRevenue  { day: string; payments: number; revenue: number; }
interface UserGrowth    { day: string; new_users: number; }
interface LynkPayment   { id: string; customer_name: string; customer_email: string; grand_total: number; voucher_code: string | null; discount: number; created_at: string; }
interface ActivationCode{ code: string; status: string; used_by: string | null; owner_email: string | null; duration_months: number; created_at: string; used_at: string | null; }

/* ─── Helpers ────────────────────────────────────────────── */
const formatIDR = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" });

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.42, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-4 py-3 rounded-xl text-xs shadow-xl">
      <p className="text-foreground/60 mb-2 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-foreground/70 capitalize">{p.name}</span>
          <span suppressHydrationWarning className="font-bold text-foreground ml-1">
            {p.name === "revenue" ? formatIDR(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Pipeline Step ─────────────────────────────────────── */
function PipelineStep({ label, count, pct, color, icon: Icon, isLast }: any) {
  return (
    <div className="flex-1 flex flex-col items-center text-center gap-1">
      <div className="w-full flex items-center justify-center mb-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </motion.div>
        {!isLast && <ArrowRight className="w-4 h-4 text-foreground/20 mx-2 shrink-0" />}
      </div>
      <p className="text-sm font-bold text-foreground">{count.toLocaleString()}</p>
      <p className="text-[10px] font-medium text-foreground/40 leading-tight">{label}</p>
      <p className="text-[10px] font-semibold" style={{ color }}>{pct}%</p>
      <div className="mt-1 h-1 w-full rounded-full bg-foreground/8">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color }}
        />
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function Home() {
  const [rawStats, setRawStats]     = useState<Stats | null>(null);
  const [dailyRev, setDailyRev]     = useState<DailyRevenue[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [payments, setPayments]     = useState<LynkPayment[]>([]);
  const [codes, setCodes]           = useState<ActivationCode[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { baseline, saveBaseline, clearBaseline, applyBaseline } = useStatsBaseline();

  // Displayed stats = raw minus baseline offset
  const stats = rawStats ? applyBaseline(rawStats) : null;

  const handleReset = () => {
    if (!rawStats) return;
    saveBaseline(rawStats);
    setShowResetConfirm(false);
  };

  const handleClear = () => {
    clearBaseline();
    setShowClearConfirm(false);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        { data: revData },
        { data: growthData },
        { data: payData },
        { data: codeData },
        { data: allCodesData },
        { count: devicesCount },
        { count: bugsCount },
        { count: creatorsCount },
      ] = await Promise.all([
        supabase.from("lynk_payments").select("created_at, grand_total, voucher_code, discount").order("created_at"),
        supabase.from("users").select("created_at, is_activated").order("created_at"),
        supabase.from("lynk_payments").select("id, customer_name, customer_email, grand_total, voucher_code, discount, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("activation_codes").select("code, status, used_by, owner_email, duration_months, created_at, used_at").order("used_at", { ascending: false, nullsFirst: false }).limit(10),
        supabase.from("activation_codes").select("status"),
        supabase.from("license_devices").select("id", { count: "exact", head: true }),
        supabase.from("bug_reports").select("id", { count: "exact", head: true }),
        supabase.from("creator_applications").select("id", { count: "exact", head: true }),
      ]);

      const payRows = revData ?? [];
      const userRows = growthData ?? [];
      const allCodesRows = allCodesData ?? [];

      const totalRev = payRows.reduce((s: number, p: any) => s + Number(p.grand_total), 0);
      const totalDisc = payRows.reduce((s: number, p: any) => s + Number(p.discount || 0), 0);
      const voucherPays = payRows.filter(p => p.voucher_code).length;
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
      const rev7d = payRows.filter(p => new Date(p.created_at) >= sevenDaysAgo).reduce((s: number, p: any) => s + Number(p.grand_total), 0);
      const users7d = userRows.filter(u => new Date(u.created_at) >= sevenDaysAgo).length;

      setRawStats({
        total_codes:      allCodesRows.length,
        unused_codes:     allCodesRows.filter((c: any) => c.status === "unused").length,
        used_codes:       allCodesRows.filter((c: any) => c.status === "used").length,
        total_users:      userRows.length,
        activated_users:  userRows.filter((u: any) => u.is_activated).length,
        total_payments:   payRows.length,
        total_revenue:    totalRev,
        avg_order_value:  payRows.length > 0 ? totalRev / payRows.length : 0,
        voucher_payments: voucherPays,
        full_price_payments: payRows.length - voucherPays,
        total_discount_given: totalDisc,
        revenue_last_7d:  rev7d,
        new_users_7d:     users7d,
        bug_reports:      bugsCount ?? 0,
        creator_apps:     creatorsCount ?? 0,
        licensed_devices: devicesCount ?? 0,
      });

      // Read baseline reset date from localStorage (if any)
      let baselineCutoff: Date | null = null;
      try {
        const stored = localStorage.getItem("norraagent_stats_baseline");
        if (stored) baselineCutoff = new Date(JSON.parse(stored).reset_at);
      } catch { /* ignore */ }

      // Group daily revenue — only after reset point
      const revPayRows = baselineCutoff
        ? payRows.filter((r: any) => new Date(r.created_at) >= baselineCutoff!)
        : payRows;
      const revMap: Record<string, { payments: number; revenue: number }> = {};
      for (const r of revPayRows) {
        const day = r.created_at.slice(0, 10);
        if (!revMap[day]) revMap[day] = { payments: 0, revenue: 0 };
        revMap[day].payments++;
        revMap[day].revenue += Number(r.grand_total);
      }
      setDailyRev(Object.entries(revMap).map(([day, v]) => ({ day: day.slice(5), ...v })));

      // Group user growth
      const growMap: Record<string, number> = {};
      for (const u of userRows) {
        const day = u.created_at.slice(0, 10);
        growMap[day] = (growMap[day] ?? 0) + 1;
      }
      setUserGrowth(Object.entries(growMap).map(([day, new_users]) => ({ day: day.slice(5), new_users })));

      // Recent Payments & Email Deliveries — filter by reset point
      const filteredPayData = baselineCutoff
        ? (payData ?? []).filter((p: any) => new Date(p.created_at) >= baselineCutoff!)
        : (payData ?? []);
      const filteredCodeData = baselineCutoff
        ? (codeData ?? []).filter((c: any) => c.used_at && new Date(c.used_at) >= baselineCutoff!)
        : (codeData ?? []);

      setPayments(filteredPayData as LynkPayment[]);
      setCodes(filteredCodeData as ActivationCode[]);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const codeDonut = [
    { name: "Available", value: stats?.unused_codes ?? 0, color: "#10b981" },
    { name: "Used",      value: stats?.used_codes   ?? 0, color: "#3b82f6" },
  ];

  const voucherDonut = [
    { name: "Full Price", value: stats?.full_price_payments ?? 0, color: "#64748b" },
    { name: "With Voucher", value: stats?.voucher_payments ?? 0, color: "#3b82f6" },
  ];

  const activationRate = stats && stats.total_users > 0
    ? Math.round((stats.activated_users / stats.total_users) * 100)
    : 0;

  const paymentColumns = [
    {
      header: "Customer", accessorKey: "customer_name",
      cell: (r: any) => (
        <div>
          <p className="text-sm font-medium text-foreground/90">{r.customer_name || "—"}</p>
          <p className="text-[10px] text-foreground/40">{r.customer_email}</p>
        </div>
      ),
    },
    {
      header: "Product / Total", accessorKey: "grand_total",
      cell: (r: any) => (
        <div>
          <p suppressHydrationWarning className="font-semibold text-foreground text-xs">{formatIDR(r.grand_total)}</p>
          <p className="text-[9px] text-foreground/30 truncate w-32" title={r.event || "Unknown"}>{r.event || "Unknown Product"}</p>
        </div>
      )
    },
    {
      header: "Voucher", accessorKey: "voucher_code",
      cell: (r: any) => r.voucher_code
        ? <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-lg text-foreground/80" style={{ background: "rgba(209,143,235,0.1)", border: "1px solid rgba(209,143,235,0.22)" }}>{r.voucher_code}</span>
        : <span className="text-foreground/25 text-xs">—</span>,
    },
    {
      header: "Date", accessorKey: "created_at",
      cell: (r: any) => <span className="text-[10px] text-foreground/40">{fmtDate(r.created_at)}</span>,
    },
  ];

  const codeColumns = [
    {
      header: "Recipient Email", accessorKey: "owner_email",
      cell: (r: any) => (
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium text-foreground/80">{r.owner_email || "Not Sent"}</span>
        </div>
      ),
    },
    {
      header: "Delivered Code", accessorKey: "code",
      cell: (r: any) => (
        <code className="text-[10px] font-mono px-1.5 py-0.5 rounded-lg text-foreground/80 tracking-wider"
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
          {r.code}
        </code>
      ),
    },
    {
      header: "Sent At", accessorKey: "used_at",
      cell: (r: any) => <span className="text-[10px] text-foreground/40">{r.used_at ? fmtDate(r.used_at) : "—"}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-foreground/60">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm">Loading CEO Analytics from Supabase…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">

      {/* ── Reset Confirm Modal ── */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              style={{ border: "1px solid rgba(15,23,42,0.08)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.1)" }}>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Reset Statistik</h3>
                  <p className="text-xs text-foreground/40 mt-0.5">Aksi ini tidak menghapus data di database</p>
                </div>
                <button onClick={() => setShowResetConfirm(false)} className="ml-auto p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-foreground/40" />
                </button>
              </div>
              <p className="text-sm text-foreground/60 leading-relaxed mb-5">
                Semua angka statistik akan dihitung <strong>mulai dari sekarang</strong>. Data lama tetap aman di Supabase — hanya tampilan yang direset.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/60 hover:bg-slate-50 border transition-colors"
                  style={{ borderColor: "rgba(15,23,42,0.1)" }}
                >
                  Batal
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #f87171, #ef4444)" }}
                >
                  Ya, Reset Sekarang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Clear Reset Confirm Modal ── */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              style={{ border: "1px solid rgba(15,23,42,0.08)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl" style={{ background: "rgba(16,185,129,0.1)" }}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Kembalikan ke Kumulatif</h3>
                  <p className="text-xs text-foreground/40 mt-0.5">Tampilkan semua data historis</p>
                </div>
                <button onClick={() => setShowClearConfirm(false)} className="ml-auto p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-foreground/40" />
                </button>
              </div>
              <p className="text-sm text-foreground/60 leading-relaxed mb-5">
                Reset point akan dihapus dan statistik akan kembali menampilkan <strong>angka total sejak awal</strong>.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/60 hover:bg-slate-50 border transition-colors"
                  style={{ borderColor: "rgba(15,23,42,0.1)" }}
                >
                  Batal
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
                >
                  Kembalikan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reset Mode Banner ── */}
      <AnimatePresence>
        {baseline && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-semibold text-red-600 text-xs">RESET MODE AKTIF</span>
                <span className="text-foreground/40 text-xs">
                  — Statistik dihitung dari{" "}
                  <strong className="text-foreground/60">
                    {new Date(baseline.reset_at).toLocaleString("id-ID", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </strong>
                </span>
              </div>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Kembali ke Kumulatif
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refresh bar */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">CEO Command Center</h2>
          <p className="text-sm text-foreground/40 mt-0.5">
            Real-time business intelligence for NorraClip
          </p>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/40">Sync: {lastRefresh.toLocaleTimeString("id-ID")}</span>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
              style={{
                background: baseline ? "rgba(239,68,68,0.1)" : "rgba(15,23,42,0.04)",
                border: baseline ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(15,23,42,0.08)",
                color: baseline ? "#ef4444" : "rgba(15,23,42,0.5)",
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Stats
            </button>
            <button onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}>
            <RefreshCw className="w-3.5 h-3.5" /> Sync Data
            </button>
        </div>
      </motion.div>

      {/* ── Key Performance Indicators ── */}
      <div>
        <h3 className="section-heading">Revenue & Growth</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Revenue" subtitle="All time payments"
            value={formatIDR(stats?.total_revenue ?? 0)}
            icon={DollarSign} trend={`+${formatIDR(stats?.revenue_last_7d ?? 0)} (7d)`} trendUp color="primary" delay={0.05} />
          
          <StatCard title="Avg Order Value" subtitle="Total Rev / Payments"
            value={formatIDR(stats?.avg_order_value ?? 0)}
            icon={TrendingUp} color="accent" delay={0.1} />
          
          <StatCard title="Total Users" subtitle={`${stats?.activated_users} activated`}
            value={(stats?.total_users ?? 0).toLocaleString()}
            icon={Users} trend={`+${stats?.new_users_7d} (7d)`} trendUp color="success" delay={0.15} />
            
          <StatCard title="Licensed Devices" subtitle="Hardware IDs"
            value={(stats?.licensed_devices ?? 0).toLocaleString()}
            icon={Zap} color="orange" delay={0.2} />
        </div>

        <h3 className="section-heading">Operations & Support</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Codes Available" subtitle={`${stats?.used_codes ?? 0} used`}
            value={(stats?.unused_codes ?? 0).toLocaleString()}
            icon={Key} color="pink" delay={0.25} />

          <StatCard title="Discounts Given" subtitle="Total nominal"
            value={formatIDR(stats?.total_discount_given ?? 0)}
            icon={Gift} color="danger" delay={0.3} />

          <StatCard title="Creator Program" subtitle="Total apps"
            value={(stats?.creator_apps ?? 0).toLocaleString()}
            icon={Star} color="accent" delay={0.35} />

          <StatCard title="Bug Reports" subtitle="Open tickets"
            value={(stats?.bug_reports ?? 0).toLocaleString()}
            icon={Bug} color="danger" delay={0.4} />

          <StatCard title="Voucher vs Full" subtitle="Payments ratio"
            value={`${stats?.voucher_payments} / ${stats?.full_price_payments}`}
            icon={CreditCard} color="primary" delay={0.45} />
        </div>
      </div>

      {/* ── Visual Analytics ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <motion.div {...fadeUp(0.5)} className="xl:col-span-3 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground">Revenue Trend (All Time)</h3>
              <p className="text-xs text-foreground/40 mt-0.5">Daily revenue and transaction volume</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-foreground/50">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Revenue (Rp)</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> Payments (Count)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dailyRev} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "rgba(15,23,42,0.4)", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis yAxisId="left" tick={{ fill: "rgba(15,23,42,0.35)", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={54}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "rgba(15,23,42,0.35)", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(59,130,246,0.15)", strokeWidth: 2, strokeDasharray: "4 4" }} />
              <Area yAxisId="left" type="monotone" dataKey="revenue"  stroke="#3b82f6" strokeWidth={3} fill="url(#gRev)"  dot={false} activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
              <Area yAxisId="right" type="monotone" dataKey="payments" stroke="#94a3b8" strokeWidth={3} fill="url(#gPay)" dot={false} activeDot={{ r: 5, fill: "#94a3b8", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeUp(0.55)} className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
              <h3 className="font-semibold text-foreground mb-1">Payment Mix</h3>
              <p className="text-xs text-foreground/40 mb-3">Voucher vs Full Price</p>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={voucherDonut} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                    dataKey="value" paddingAngle={4} strokeWidth={0}>
                    {voucherDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
                    <div className="glass-panel px-3 py-2 rounded-xl text-xs">
                      <span style={{ color: payload[0].payload.color }} className="font-bold">{payload[0].name}: </span>
                      <span>{(payload[0].value as number).toLocaleString()}</span>
                    </div>
                  ) : null} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-2">
                {voucherDonut.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-foreground/60">{item.name}</span>
                    </div>
                    <span className="font-semibold text-foreground/80">{item.value} ({Math.round(item.value / ((stats?.total_payments || 1)) * 100)}%)</span>
                    </div>
                ))}
              </div>
          </div>
          
          <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 className="font-semibold text-foreground mb-1 text-sm">Activation Funnel</h3>
              <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(15,23,42,0.04)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${activationRate}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #60a5fa, #3b82f6)" }}
                />
              </div>
              <p className="text-[11px] text-foreground/40 mt-1.5 flex justify-between">
                <span>Registration to Activation</span>
                <span className="font-semibold text-foreground/70">{activationRate}%</span>
              </p>
          </div>
        </motion.div>
      </div>

      {/* ── Recent Activity Tables ── */}
      <div className="space-y-6">
        <motion.div {...fadeUp(0.6)} className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                Recent Payments
              </h3>
              <p className="text-xs text-foreground/40 mt-1">10 transaksi terakhir yang masuk via Lynk.id</p>
            </div>
          </div>
          <DataTable columns={paymentColumns} data={payments} />
        </motion.div>

        <motion.div {...fadeUp(0.65)} className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                  <Mail className="w-4 h-4" />
                </div>
                Recent Email Deliveries
              </h3>
              <p className="text-xs text-foreground/40 mt-1">10 pengiriman kode aktivasi via email terakhir</p>
            </div>
          </div>
          {/* Only show codes that have been sent (owner_email exists) */}
          <DataTable columns={codeColumns} data={codes.filter(c => c.owner_email).slice(0, 10)} />
        </motion.div>
      </div>
    </div>
  );
}
