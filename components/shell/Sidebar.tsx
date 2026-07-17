'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Icon } from './icons';
import { CompanySelector } from './CompanySelector';
import { ThemeToggle } from './ThemeToggle';
import type { TenantRole } from '@/lib/database.types';

const RAIL_WIDTH = 'w-16'; // recolhida — só ícones
const PANEL_WIDTH = 'w-60'; // expandida — ícones + rótulos

type SidebarProfile = {
  fullName: string | null;
  email: string;
  role: TenantRole;
  tenantName: string | null;
};

type Tenant = { slug: string; name: string };

type NavItem = {
  label: string;
  href: string;
  icon: (p: { className?: string }) => React.ReactElement;
  isActive: (pathname: string, view: string | null) => boolean;
};

const NAV: NavItem[] = [
  {
    label: 'Oportunidades',
    href: '/opportunities',
    icon: Icon.Opportunities,
    isActive: (p, view) => p.startsWith('/opportunities') && view !== 'relatorio',
  },
  {
    label: 'Relatórios',
    href: '/opportunities?view=relatorio',
    icon: Icon.Reports,
    isActive: (p, view) => p.startsWith('/opportunities') && view === 'relatorio',
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    label: 'Convites',
    href: '/admin/invites',
    icon: Icon.Invites,
    isActive: (p) => p.startsWith('/admin'),
  },
];

function initials(name: string | null, email: string): string {
  const src = name?.trim() || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

const roleLabel: Record<TenantRole, string> = {
  platform_admin: 'Administrador',
  tenant_admin: 'Admin da empresa',
  member: 'Membro',
  viewer: 'Somente leitura',
};

export function Sidebar({
  profile,
  tenants,
}: {
  profile: SidebarProfile;
  tenants: Tenant[];
}) {
  const pathname = usePathname();
  const view = useSearchParams().get('view');
  const isAdmin = profile.role === 'platform_admin';
  const [expanded, setExpanded] = useState(false);

  const label = (text: string) => (
    <span
      className={`whitespace-nowrap transition-opacity duration-150 ${
        expanded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {text}
    </span>
  );

  const renderItem = (item: NavItem) => {
    const active = item.isActive(pathname, view);
    const I = item.icon;
    return (
      <Link
        key={item.label}
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-colors ${
          active
            ? 'bg-nav-active text-white font-semibold'
            : 'text-nav-fg hover:bg-white/5'
        }`}
      >
        <I className="w-[18px] h-[18px] shrink-0" />
        {label(item.label)}
      </Link>
    );
  };

  return (
    <>
      {/* Reserva o espaço da rail recolhida no layout — o painel expandido
          flutua por cima (fixed) sem empurrar o conteúdo. */}
      <div className={`${RAIL_WIDTH} shrink-0 h-screen`} aria-hidden="true" />

      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`fixed left-0 top-0 z-40 h-screen flex flex-col bg-gradient-to-b from-nav-2 to-nav text-nav-fg overflow-hidden transition-[width] duration-200 ease-in-out ${
          expanded ? `${PANEL_WIDTH} shadow-2xl` : RAIL_WIDTH
        }`}
      >
        {/* Conteúdo interno com largura fixa (w-60) — a rail só recorta a
            largura visível via overflow-hidden acima, então nada reflow. */}
        <div className="w-60 flex flex-col h-full shrink-0">
          {/* Logo */}
          <div className="px-5 py-5 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
              <Image src="/brand/psw-icone.png" alt="PSW Digital" width={22} height={22} />
            </div>
            <div className="leading-tight">
              <div className="text-white font-bold text-[15px] tracking-tight">
                {label('PSW ')}
                <span
                  className={`font-light transition-opacity duration-150 ${
                    expanded ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  DIGITAL
                </span>
              </div>
              <div className="text-[10px] text-nav-muted">{label('CoE Hiperautomação')}</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2 flex flex-col gap-1 overflow-y-auto">
            {NAV.map(renderItem)}
            {isAdmin && (
              <>
                <div className="mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-nav-muted">
                  {label('Administração')}
                </div>
                {ADMIN_NAV.map(renderItem)}
              </>
            )}
          </nav>

          {/* Seletor de empresa (só admin, só quando expandida) */}
          {isAdmin && expanded && tenants.length > 0 && (
            <div className="border-t border-white/10">
              <CompanySelector tenants={tenants} />
            </div>
          )}

          {/* Usuário + logout */}
          <div className="border-t border-white/10 p-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-nav-active flex items-center justify-center text-white text-[12px] font-bold shrink-0">
              {initials(profile.fullName, profile.email)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-[13px] font-semibold truncate">
                {label(profile.fullName ?? profile.email)}
              </div>
              <div className="text-[11px] text-nav-muted truncate">
                {label(
                  `${profile.tenantName ? `${profile.tenantName} · ` : ''}${roleLabel[profile.role]}`,
                )}
              </div>
            </div>
            <ThemeToggle className="p-2 rounded-lg text-nav-muted hover:text-white hover:bg-white/5 transition-colors shrink-0" />
            <form action="/logout" method="post">
              <button
                type="submit"
                title="Sair"
                aria-label="Sair"
                className="p-2 rounded-lg text-nav-muted hover:text-white hover:bg-white/5 transition-colors shrink-0"
              >
                <Icon.Logout className="w-[18px] h-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
