"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, Building2, Percent, LineChart } from 'lucide-react';

interface NavItemProps {
    href: string;
    label: string;
    icon: React.ReactNode;
    isActive?: boolean;
}

const NavItem = ({ href, label, icon, isActive }: NavItemProps) => (
    <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${isActive
            ? 'bg-blue-600/15 text-blue-400 font-medium border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent'
            }`}
    >
        <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </span>
        <span className="text-sm tracking-wide">{label}</span>
    </Link>
);

export default function SidebarNav() {
    const pathname = usePathname();

    // Fix: Ensure pathname is treated as a string and handle potential undefined gracefully
    const currentPath = pathname || "/";

    return (
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto relative">
            <NavItem 
                href="/" 
                label="Overview" 
                icon={<LayoutDashboard size={18} />} 
                isActive={currentPath === "/"} 
            />
            <NavItem 
                href="/ads" 
                label="Ads Manager" 
                icon={<Megaphone size={18} />} 
                isActive={currentPath.startsWith("/ads")} 
            />
            
            <div className="pt-8 pb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-800"></span> Platform
            </div>
            
            <NavItem 
                href="/platform/agencies" 
                label="Agencies" 
                icon={<Building2 size={18} />} 
                isActive={currentPath.startsWith("/platform/agencies")} 
            />
            <NavItem 
                href="/platform/commissions" 
                label="Commissions" 
                icon={<Percent size={18} />} 
                isActive={currentPath.startsWith("/platform/commissions")} 
            />
            <NavItem 
                href="/platform/analytics" 
                label="Analytics" 
                icon={<LineChart size={18} />} 
                isActive={currentPath.startsWith("/platform/analytics")} 
            />
        </nav>
    );
}
