"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Share2,
  AlertTriangle,
  TrendingUp,
  Newspaper,
  Lock,
} from "lucide-react";

const nav = [
  { href: "/",           label: "Dashboard",      icon: LayoutDashboard },
  { href: "/upload",     label: "Upload",          icon: Upload },
  { href: "/overlap",    label: "Overlap Graph",   icon: Share2 },
  { href: "/pledge",     label: "Pledge Alerts",   icon: AlertTriangle },
  { href: "/technical",  label: "Technical Health",icon: TrendingUp },
  { href: "/macro",      label: "Macro & News",    icon: Newspaper },
  { href: "/fno",        label: "F&O Ban",         icon: Lock },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-lg font-bold text-gray-900 tracking-tight">FolioSync</span>
        <p className="text-xs text-gray-400 mt-0.5">Indian Portfolio Intelligence</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={15} className={active ? "text-green-600" : "text-gray-400"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Portfolio summary pill */}
      <div className="mx-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Portfolio</p>
        <p className="text-base font-bold text-gray-900">₹5,00,000</p>
        <p className="text-xs text-green-600 font-medium">+₹12,400 today</p>
      </div>
    </aside>
  );
}
