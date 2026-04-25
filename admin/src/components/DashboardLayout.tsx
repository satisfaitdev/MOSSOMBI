import React from 'react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { AuthUser } from '@/lib/auth';

interface NavItemProps {
    href: string;
    label: string;
    icon?: React.ReactNode;
    isActive?: boolean;
}

const NavItem = ({ href, label, icon, isActive }: NavItemProps) => (
    <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
            ? 'bg-blue-600/10 text-blue-500 font-medium border border-blue-600/20'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
    >
        {icon && <span className="text-lg opacity-70 group-hover:opacity-100">{icon}</span>}
        <span className="text-sm">{label}</span>
    </Link>
);

export default function DashboardLayout({ children, user }: { children: React.ReactNode; user?: AuthUser }) {
    return (
        <div className="flex min-h-screen bg-[#09090b] text-zinc-100">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 glass border-r border-zinc-800/50 hidden md:flex flex-col z-50">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                            <span className="text-white font-bold text-xs">M</span>
                        </div>
                        <span className="font-semibold tracking-tight text-lg">Mossombi <span className="text-zinc-500 font-normal">Admin</span></span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    <NavItem href="/" label="Dashboard" icon="⊡" isActive />
                    <NavItem href="/ads" label="Ads Architecture" icon="▤" />
                    <div className="pt-6 pb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Modules</div>
                    <NavItem href="/platform/agencies" label="Agences" icon="◇" />
                    <NavItem href="/platform/commissions" label="Commissions" icon="%" />
                    <NavItem href="#" label="Statistiques" icon="◬" />
                </nav>

                <div className="p-4 border-t border-zinc-800/50">
                    <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
                                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.full_name || user?.email}</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{user?.role || 'Administrator'}</p>
                            </div>
                        </div>
                        <LogoutButton />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
                {/* Header */}
                <header className="h-16 border-b border-zinc-800/50 glass sticky top-0 z-40 flex items-center justify-between px-8">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest">
                        <span>Admin</span>
                        <span>/</span>
                        <span className="text-zinc-100">Overview</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="/"
                            className="px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
                        >
                            Accueil
                        </a>
                        <a
                            href="/platform/agencies"
                            className="px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
                        >
                            Agences
                        </a>
                        <a
                            href="/platform/commissions"
                            className="px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
                        >
                            Commissions
                        </a>
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition-colors">
                            <span className="text-xs">🔔</span>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-8 pb-16">
                    {children}
                </div>
            </main>
        </div>
    );
}
