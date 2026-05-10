import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface AdminCardProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export default function AdminCard({ title, description, children, footer, className = "", icon }: AdminCardProps) {
    return (
        <div className={`relative group ${className}`}>
            {/* Animated Glow Behind Card */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-blue-500/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"></div>
            
            <div className="relative glass-card rounded-3xl overflow-hidden transition-all duration-500 h-full flex flex-col">
                <div className="p-8 flex-1">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                {icon && <div className="text-blue-400">{icon}</div>}
                                <h3 className="text-xl font-bold text-zinc-100 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all duration-300">
                                    {title}
                                </h3>
                            </div>
                            {description && <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">{description}</p>}
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-blue-400 group-hover:border-blue-500/30 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 rotate-0 group-hover:rotate-12">
                            <Sparkles size={20} />
                        </div>
                    </div>

                    <div className="relative z-10">
                        {children}
                    </div>
                </div>

                {footer && (
                    <div className="px-8 py-5 bg-zinc-900/40 border-t border-zinc-800/50 backdrop-blur-md">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
