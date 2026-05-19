"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Users, Clock, CheckCircle2, XCircle, RefreshCw, ExternalLink } from "lucide-react";

interface Creator {
  id: string;
  email: string;
  social_link: string;
  status: string;
  created_at: string;
  total_earned: number;
  balance: number;
  avatar_url: string;
}

const formatIDR = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

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

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("creator_applications").select("*").order("created_at", { ascending: false });
    setCreators((data ?? []) as Creator[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("creator_applications").update({ status }).eq("id", id);
    fetchData();
  };

  const filtered = filter === "all" ? creators : creators.filter(c => c.status === filter);
  const pending = creators.filter(c => c.status === "pending").length;
  const approved = creators.filter(c => c.status === "approved").length;
  const totalEarned = creators.reduce((s, c) => s + Number(c.total_earned || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <motion.div {...fadeUp(0)} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Creators", value: creators.length, color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" },
          { label: "Pending",        value: pending,          color: "#d97706", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
          { label: "Approved",       value: approved,         color: "#059669", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)"  },
          { label: "Total Earned",   value: formatIDR(totalEarned), color: "#0f172a", bg: "rgba(15,23,42,0.04)", border: "rgba(15,23,42,0.1)" },
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
              <Users className="w-4 h-4 text-primary" /> Creator Applications
            </h3>
            <p className="text-xs text-foreground/40 mt-0.5">{filtered.length} kreator</p>
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
            <button onClick={fetchData} className="p-2 rounded-lg text-foreground/40 hover:text-foreground transition-colors" style={{ border: "1px solid rgba(96,165,250,0.2)" }}>
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
            {filtered.map(c => {
              const st = statusColors[c.status] ?? statusColors.pending;
              const Icon = st.icon;
              return (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid rgba(96,165,250,0.1)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      {c.email?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.email}</p>
                      <a href={c.social_link} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1">
                        {c.social_link} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right">
                      <p className="text-xs text-foreground/40">Balance</p>
                      <p suppressHydrationWarning className="text-xs font-semibold text-foreground">{formatIDR(Number(c.balance))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground/40">Earned</p>
                      <p suppressHydrationWarning className="text-xs font-semibold text-foreground">{formatIDR(Number(c.total_earned))}</p>
                    </div>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium" style={{ background: st.bg, color: st.text }}>
                      <Icon className="w-3 h-3" /> {st.label}
                    </span>
                    {c.status === "pending" && (
                      <div className="flex gap-1.5">
                        <button onClick={() => updateStatus(c.id, "approved")} className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white" style={{ background: "#059669" }}>Approve</button>
                        <button onClick={() => updateStatus(c.id, "rejected")} className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white" style={{ background: "#dc2626" }}>Reject</button>
                      </div>
                    )}
                    <span className="text-[10px] text-foreground/30">{fmtDate(c.created_at)}</span>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-foreground/30 py-10 text-sm">Tidak ada data.</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
}
