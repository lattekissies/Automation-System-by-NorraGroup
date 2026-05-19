"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, Key,
  Bug, Users, Megaphone, Wallet, Zap,
} from "lucide-react";

const navGroups = [
  {
    label: "Core",
    items: [
      { name: "Overview",     href: "/",            icon: LayoutDashboard },
      { name: "Transactions", href: "/transactions", icon: ArrowLeftRight  },
      { name: "Codes",        href: "/codes",        icon: Key             },
      { name: "Bug Reports",  href: "/bugs",         icon: Bug             },
    ],
  },
  {
    label: "Affiliate",
    items: [
      { name: "Creators",    href: "/creators",   icon: Users    },
      { name: "Promotions",  href: "/promotions", icon: Megaphone },
      { name: "Withdrawals", href: "/withdrawals",icon: Wallet   },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div
      className="w-60 h-screen flex flex-col sticky top-0 z-40 shrink-0"
      style={{ background: "#fff", borderRight: "1px solid rgba(15,23,42,0.07)" }}
    >
      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(15,23,42,0.07)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
          >
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="gradient-text text-base font-extrabold leading-none tracking-tight">
              AutoFlow
            </h1>
            <p className="text-[10px] mt-0.5 text-foreground/35 font-medium tracking-wide uppercase">
              CEO Dashboard
            </p>
          </div>
        </div>

        {/* Live status */}
        <div
          className="mt-3.5 flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)" }}
        >
          <span className="dot-live shrink-0" />
          <span className="text-[11px] font-semibold text-emerald-700">Webhook Live</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] px-3 mb-1.5 text-foreground/30">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href} className="block relative">
                    {isActive && (
                      <motion.div
                        layoutId={`nav-pill-${group.label}`}
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: "rgba(59,130,246,0.07)",
                          border: "1px solid rgba(59,130,246,0.14)",
                        }}
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <motion.div
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.15 }}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl z-10 ${
                        isActive ? "text-blue-600" : "text-foreground/45 hover:text-foreground/75"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive ? "bg-blue-100" : "bg-transparent group-hover:bg-slate-100"
                        }`}
                        style={isActive ? {} : { background: "rgba(15,23,42,0.04)" }}
                      >
                        <Icon
                          className="w-3.5 h-3.5"
                          strokeWidth={isActive ? 2.5 : 2}
                          style={{ color: isActive ? "#2563eb" : undefined }}
                        />
                      </div>
                      <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                        {item.name}
                      </span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div
        className="px-4 py-4"
        style={{ borderTop: "1px solid rgba(15,23,42,0.07)" }}
      >
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: "rgba(15,23,42,0.02)" }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          >
            <span className="text-white text-[9px] font-extrabold">OK</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground/60 leading-none">
              All systems normal
            </p>
            <p className="text-[10px] text-foreground/30 mt-0.5">v1.0 · NorraClip</p>
          </div>
        </div>
      </div>
    </div>
  );
}
