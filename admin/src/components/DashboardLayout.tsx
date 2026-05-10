import React from 'react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import SidebarNav from './SidebarNav';
import { AuthUser } from '@/lib/auth';
import { Bell, Settings, Search } from 'lucide-react';

export default function DashboardLayout({ children, user }: { children: React.ReactNode; user?: AuthUser }) {
    return (
        <div className="flex min-h-screen bg-black text-zinc-100 selection:bg-blue-500/30 font-sans">
            {/* Minimal Modern Sidebar */}
            <aside className="fixed inset-y-4 left-4 w-64 glass rounded-3xl border border-zinc-800/50 hidden md:flex flex-col z-50 shadow-2xl">
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            <span className="text-white font-bold text-sm tracking-wider">M</span>
                        </div>
                        <div>
                            <h1 className="font-bold tracking-tight text-lg leading-tight">Mossombi</h1>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4">
                    <div className="h-[1px] w-full bg-gradient-to-r from-zinc-800/0 via-zinc-800 to-zinc-800/0"></div>
                </div>

                <SidebarNav />

                <div className="p-4 mt-auto">
                    <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800/50 backdrop-blur-md transition-all hover:border-zinc-700/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-200 shadow-inner">
                                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="text-sm font-semibold truncate text-zinc-200">{user?.full_name || user?.email}</p>
                                <p className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">{user?.role || 'System Admin'}</p>
                            </div>
                            <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                                <Settings size={16} />
                            </button>
                        </div>
                        <LogoutButton />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-[18rem] min-h-screen flex flex-col relative z-10">
                {/* Modern Top Header */}
                <header className="h-20 sticky top-0 z-40 flex items-center justify-between px-8 backdrop-blur-xl bg-black/40 border-b border-zinc-800/30">
                    <div className="flex items-center gap-3 text-sm font-medium">
                        <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs tracking-wider uppercase">
                            Environment
                        </div>
                        <span className="text-zinc-600">/</span>
                        <span className="text-zinc-200 tracking-wide">Production</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search anything... (⌘K)" 
                                className="pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all w-64 placeholder:text-zinc-600"
                            />
                        </div>
                        <div className="w-[1px] h-6 bg-zinc-800"></div>
                        <div className="relative group cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-zinc-700 transition-all">
                                <Bell size={18} />
                            </div>
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-8 pb-20 max-w-[1600px] w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    {children}
                </div>
            </main>
        </div>
    );
}

