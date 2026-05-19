"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
  color?: "primary" | "accent" | "pink" | "orange" | "success" | "danger";
}

const colorMap = {
  primary: {
    strip: "stat-strip-primary",
    iconBg: "rgba(59,130,246,0.1)",
    iconColor: "#2563eb",
    trendBg: "rgba(59,130,246,0.08)",
    trendColor: "#1d4ed8",
  },
  accent: {
    strip: "stat-strip-accent",
    iconBg: "rgba(99,102,241,0.1)",
    iconColor: "#4338ca",
    trendBg: "rgba(99,102,241,0.08)",
    trendColor: "#3730a3",
  },
  pink: {
    strip: "stat-strip-pink",
    iconBg: "rgba(15,23,42,0.06)",
    iconColor: "#334155",
    trendBg: "rgba(15,23,42,0.04)",
    trendColor: "#1e293b",
  },
  orange: {
    strip: "stat-strip-orange",
    iconBg: "rgba(249,115,22,0.1)",
    iconColor: "#c2410c",
    trendBg: "rgba(249,115,22,0.08)",
    trendColor: "#9a3412",
  },
  success: {
    strip: "stat-strip-success",
    iconBg: "rgba(16,185,129,0.1)",
    iconColor: "#059669",
    trendBg: "rgba(16,185,129,0.08)",
    trendColor: "#047857",
  },
  danger: {
    strip: "stat-strip-danger",
    iconBg: "rgba(239,68,68,0.1)",
    iconColor: "#dc2626",
    trendBg: "rgba(239,68,68,0.08)",
    trendColor: "#b91c1c",
  },
};

export default function StatCard({
  title, value, subtitle, icon: Icon,
  trend, trendUp, delay = 0, color = "primary",
}: StatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className={`glass-panel ${c.strip} rounded-2xl p-5 flex flex-col gap-3 cursor-default bg-white`}
    >
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: c.iconBg }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: c.iconColor }} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full`}
            style={{
              background: trendUp ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: trendUp ? "#059669" : "#dc2626",
            }}
          >
            {trendUp
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {trend}
          </div>
        )}
      </div>

      {/* Values */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/40 mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs mt-1.5 text-foreground/40 font-medium">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
