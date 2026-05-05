import Link from 'next/link';
import { ElementType } from 'react';

export function MegaMenuItem({ href, icon: Icon, title, description, isActive }: { href: string, icon: ElementType, title: string, description: string, isActive?: boolean }) {
    return (
        <Link href={href} className={`flex items-start gap-4 p-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
            <div className={`p-2.5 rounded-lg flex-shrink-0 transition-all duration-300 ${isActive ? 'bg-[var(--color-hospital-blue)] text-white shadow-md scale-105' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-[var(--color-hospital-blue)] dark:group-hover:text-blue-400 group-hover:scale-105'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <div className="flex flex-col">
                <span className={`text-[13px] font-bold tracking-tight mb-0.5 ${isActive ? 'text-[var(--color-hospital-blue)] dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--color-hospital-blue)] dark:group-hover:text-blue-400 transition-colors'}`}>
                    {title}
                </span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-[1.3] line-clamp-2">
                    {description}
                </span>
            </div>
        </Link>
    );
}
