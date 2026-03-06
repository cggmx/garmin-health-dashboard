'use client';

import { LayoutDashboard, Moon, TrendingUp, Flame, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', Icon: LayoutDashboard },
  { href: '/sleep', label: 'Sueño', Icon: Moon },
  { href: '/strain', label: 'Esfuerzo', Icon: Flame },
  { href: '/trends', label: 'Tendencias', Icon: TrendingUp },
  { href: '/profile', label: 'Perfil', Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur border-t border-border safe-pb">
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
                active ? 'text-primary' : 'text-muted hover:text-secondary',
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
