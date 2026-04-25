"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Users, 
  Store, 
  Wallet, 
  AlertTriangle,
  Settings,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const primaryLinks = [
    { name: "Vue Globale", href: "/platform", icon: BarChart3 },
    { name: "Utilisateurs", href: "/platform/users", icon: Users },
    { name: "Agences & Hôtes", href: "/platform/agencies", icon: Store },
    { name: "Revenus & Wallet", href: "/platform/commissions", icon: Wallet },
    { name: "Litiges & Support", href: "/platform/disputes", icon: AlertTriangle },
    { name: "Marketing Ads", href: "/ads", icon: Zap },
  ];

  const systemLinks = [
    { name: "Modérateurs", href: "/platform/admins", icon: ShieldCheck },
    { name: "Paramètres Système", href: "/platform/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen hidden md:flex flex-col border-r border-[#27272a] bg-[#09090b]/80 backdrop-blur-xl shrink-0">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#27272a]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Mossombi<span className="text-blue-500">Staff</span></span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
        {/* Main Section */}
        <div>
          <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Opérations</p>
          <div className="space-y-1">
            {primaryLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* System Section */}
        <div>
          <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Administration</p>
          <div className="space-y-1">
            {systemLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Profile Bar */}
      <div className="p-4 border-t border-[#27272a]">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <span className="text-sm font-bold text-zinc-300">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-zinc-500 truncate">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
