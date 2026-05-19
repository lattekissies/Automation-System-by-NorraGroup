"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Megaphone, RefreshCw, Clock, CheckCircle2, XCircle, ExternalLink, Eye } from "lucide-react";

interface Submission {
  id: string;
  creator_id: string;
  post_link: string;
  account_link: string;
  screenshot_url: string;
  views_claimed: number;
  status: string;
  reward_amount: number;
  created_at: string;
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

export default function PromotionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("promotion_submissions").select("*").order("created_at", { ascending: false });
    setSubmissions((data ?? []) as Submission[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string, rewardAmount?: number) => {
    const update: any = { status };
    if (rewardAmount !== undefined) update.reward_amount = rewardAmount;
    await supabase.from("promotion_submissions").update(update).eq("id", id);
    fetchData();
  };

  const filtered = filter === "all" ? submissions : submissions.filter(s => s.status === filter);
  const totalViews = submissions.reduce((s, sub) => s + Number(sub.views_claimed || 0), 0);
  const totalRewards = submissions.reduce((s, sub) => s + Number(sub.reward_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <motion.div {...fadeUp(0)} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Submissions", value: submissions.length,                color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)"  },
          { label: "Pending Review",    value: submissions.filter(s=>s.status==="pending").length, color: "#d97706", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
          { label: "Total Views",       value: totalViews.toLocaleString(),        color: "#0f172a", bg: "rgba(15,23,42,0.04)",   border: "rgba(15,23,42,0.1)"    },
          { label: "Total Rewards",     value: formatIDR(totalRewards),            color: "#059669", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)"  },
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
              <Megaphone className="w-4 h-4 text-primary" /> Promotion Submissions
            </h3>
            <p className="text-xs text-foreground/40 mt-0.5">{filtered.length} submission</p>
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
            {filtered.map(s => {
              const st = statusColors[s.status] ?? statusColors.pending;
              const Icon = st.icon;
              return (
                <div key={s.id} className="p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid rgba(96,165,250,0.1)" }}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium" style={{ background: st.bg, color: st.text }}>
                          <Icon className="w-3 h-3" /> {st.label}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-foreground/50">
                          <Eye className="w-3 h-3" /> {Number(s.views_claimed).toLocaleString()} views
                        </span>
                        {Number(s.reward_amount) > 0 && (
                          <span suppressHydrationWarning className="text-xs font-semibold text-green-600">{formatIDR(Number(s.reward_amount))}</span>
                        )}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <a href={s.post_link} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1">
                          Post Link <ExternalLink className="w-3 h-3" />
                        </a>
                        <a href={s.account_link} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1">
                          Account <ExternalLink className="w-3 h-3" />
                        </a>
                        {s.screenshot_url && (
                          <a href={s.screenshot_url} target="_blank" rel="noreferrer" className="text-[11px] text-foreground/40 hover:underline flex items-center gap-1">
                            Screenshot <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] text-foreground/30">{fmtDate(s.created_at)}</p>
                    </div>
                    {s.status === "pending" && (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => {
                          const reward = prompt("Masukkan jumlah reward (contoh: 50000):");
                          if (reward !== null && !isNaN(Number(reward))) {
                            updateStatus(s.id, "approved", Number(reward));
                          }
                        }} className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white" style={{ background: "#059669" }}>Approve & Reward</button>
                        <button onClick={() => updateStatus(s.id, "rejected")} className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white" style={{ background: "#dc2626" }}>Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-foreground/30 py-10 text-sm">Tidak ada submission.</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
}
