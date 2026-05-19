"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, LogOut, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/":             { title: "Overview",          description: "CEO analytics dashboard"        },
  "/transactions": { title: "Transactions",       description: "Lynk.id payment events"        },
  "/codes":        { title: "Activation Codes",   description: "Code inventory & status"       },
  "/bugs":         { title: "Bug Reports",        description: "User-submitted bug reports"    },
  "/creators":     { title: "Creators",           description: "Creator program management"    },
  "/promotions":   { title: "Promotions",         description: "Promotion submissions"         },
  "/withdrawals":  { title: "Withdrawals",        description: "Withdrawal requests"           },
};

export default function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const meta     = pageMeta[pathname] ?? { title: "Dashboard", description: "" };

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header
      className="h-14 sticky top-0 z-30 flex items-center justify-between px-6"
      style={{
        background: "rgba(241,245,249,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(15,23,42,0.07)",
      }}
    >
      {/* ── Left: Breadcrumb ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground/30 flex items-center gap-1 font-medium">
          AutoFlow <ChevronRight className="w-3 h-3" />
        </span>
        <motion.div key={pathname} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-sm font-bold text-foreground/90 leading-none">{meta.title}</h2>
          <p className="text-[11px] mt-0.5 text-foreground/40 font-medium">{meta.description}</p>
        </motion.div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-2">
        {/* Date / Time */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground/50"
          style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
        >
          <Calendar className="w-3.5 h-3.5 text-foreground/35" />
          <span>{dateStr}</span>
          <span className="text-foreground/30">·</span>
          <span suppressHydrationWarning className="font-semibold text-foreground/60">{timeStr}</span>
        </div>

        <div className="w-px h-5" style={{ background: "rgba(15,23,42,0.08)" }} />

        {/* Notification */}
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-white/80"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-foreground/45" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </button>

        {/* Admin */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)" }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-extrabold shrink-0"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
            >
              A
            </div>
            <span className="text-xs font-semibold text-foreground/60 hidden sm:block">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg text-foreground/35 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
