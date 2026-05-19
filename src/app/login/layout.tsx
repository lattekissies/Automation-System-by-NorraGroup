import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login · NorraClip Dashboard",
  description: "Sign in as administrator",
};

// Login page has its own layout — no Sidebar or Header
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
