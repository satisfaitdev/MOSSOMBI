"use client";

import { Bell, Search, Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-10 shrink-0">
      {/* Mobile Menu Trigger */}
      <div className="flex items-center gap-4 md:hidden">
        <button className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <span className="text-white font-bold text-sm">M</span>
        </div>
      </div>

      {/* Search Bar - Hidden on small mobile */}
      <div className="hidden sm:flex flex-1 max-w-md items-center relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3" />
        <input 
          type="text" 
          placeholder="Rechercher un utilisateur, une agence, une course (ID)..." 
          className="w-full h-10 bg-zinc-900 border border-[#27272a] rounded-lg pl-10 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto sm:ml-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Système Opérationnel
        </div>
        
        <button className="relative p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,1)]"></span>
        </button>
      </div>
    </header>
  );
}
