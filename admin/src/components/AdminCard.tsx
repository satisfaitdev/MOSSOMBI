import React from 'react';

interface AdminCardProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export default function AdminCard({ title, description, children, footer, className = "" }: AdminCardProps) {
    return (
        <div className={`glass-card rounded-2xl overflow-hidden group transition-all duration-300 hover:border-zinc-700/50 ${className}`}>
            <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">{title}</h3>
                        {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-all">
                        <span className="text-lg">⊕</span>
                    </div>
                </div>

                <div className="relative">
                    {children}
                </div>
            </div>

            {footer && (
                <div className="px-6 py-4 bg-zinc-900/30 border-t border-zinc-800/50">
                    {footer}
                </div>
            )}
        </div>
    );
}
