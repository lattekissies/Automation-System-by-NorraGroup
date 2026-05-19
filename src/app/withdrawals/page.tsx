"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Wallet, RefreshCw, Clock, CheckCircle2, XCircle, CreditCard } from "lucide-react";

interface Withdrawal {
  id: string;
  creator_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  creator_applications?: {
    email: string;
  };
}

const formatIDR = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const statusColors: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  pending:  { bg: "rgba(245,158,11,0.1)",  text: "#d97706", label: "Pending",  icon: Clock },
  approved: { bg: "rgba(16,185,129,0.1)",  text: "#059669", label: "Approved", icon: CheckCircle2 },
  rejected: { bg: "rgba(239,68,68,0.1)",   text: "#dc2626", label: "Rejected", icon: XCircle },
};

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("withdrawal_requests")
      .select(`
        *,
        creator_applications ( email )
      `)
      .order("created_at", { ascending: false });
    
    setWithdrawals((data ?? []) as Withdrawal[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("withdrawal_requests").update({ status }).eq("id", id);
    fetchData();
  };

  const filtered = filter === "all" ? withdrawals : withdrawals.filter(w => w.status === filter);
  const pendingAmount = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + Number(w.amount || 0), 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + Number(w.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <motion.div {...fadeUp(0)} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Requests",  value: withdrawals.length,           color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)"  },
          { label: "Pending Review",  value: withdrawals.filter(w=>w.status==="pending").length, color: "#d97706", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
          { label: "Pending Payout",  value: formatIDR(pendingAmount),     color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
          { label: "Total Disbursed", value: formatIDR(totalWithdrawn),    color: "#059669", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)"  },
        ].map(s => (
          <div key={s.label} className="glass-panel rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <p className="text-xs text-foreground/50 mb-1">{s.label}</p>
            <p suppressHydrationWarning className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(0.1)} className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> Withdrawal Requests
            </h3>
            <p className="text-xs text-foreground/40 mt-0.5">{filtered.length} request</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {["all","pending","approved","rejected"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
                style={filter === f
                  ? { background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.35)", color: "#2563eb" }
                  : { background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", color: "#64748b" }}>
                {f}
              </button>
            ))}
            <button onClick={fetchData} className="p-2 rounded-lg text-foreground/40 hover:text-foreground" style={{ border: "1px solid rgba(96,165,250,0.2)" }}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-foreground/40">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading...
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(w => {
              const st = statusColors[w.status] ?? statusColors.pending;
              const Icon = st.icon;
              return (
                <div key={w.id} className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: "#f8fafc", border: "1px solid rgba(96,165,250,0.1)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-500" style={{ background: "rgba(96,165,250,0.12)" }}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{w.creator_applications?.email ?? "Unknown Creator"}</p>
                      <p className="text-[11px] text-foreground/40">{fmtDate(w.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="px-3 border-l border-foreground/10 text-right">
                      <p className="text-[10px] text-foreground/40 mb-0.5">Method</p>
                      <p className="text-xs font-medium text-foreground flex items-center gap-1"><CreditCard className="w-3 h-3 text-foreground/40" /> {w.payment_method}</p>
                    </div>
                    <div className="px-3 border-l border-foreground/10 text-right">
                      <p className="text-[10px] text-foreground/40 mb-0.5">Amount</p>
                      <p suppressHydrationWarning className="text-sm font-bold text-foreground">{formatIDR(Number(w.amount))}</p>
                    </div>

                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium" style={{ background: st.bg, color: st.text }}>
                      <Icon className="w-3 h-3" /> {st.label}
                    </span>

                    {w.status === "pending" && (
                      <div className="flex gap-1.5 ml-2">
                        <button onClick={() => updateStatus(w.id, "approved")} className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white" style={{ background: "#059669" }}>Set Approved</button>
                        <button onClick={() => updateStatus(w.id, "rejected")} className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white" style={{ background: "#dc2626" }}>Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-foreground/30 py-10 text-sm">Tidak ada withdrawal request.</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
}
