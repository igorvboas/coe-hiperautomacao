'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Icon } from './icons';
import { CompanySelector } from './CompanySelector';

type SidebarProfile = {
  fullName: string | null;
  email: string;
  role: 'member' | 'tenant_admin' | 'platform_admin';
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

const roleLabel: Record<SidebarProfile['role'], string> = {
  platform_admin: 'Administrador',
  tenant_admin: 'Admin da empresa',
  member: 'Membro',
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
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-gradient-to-b from-nav-2 to-nav text-nav-fg">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-black text-white text-sm shrink-0">
          PSW
        </div>
        <div className="leading-tight">
          <div className="text-white font-bold text-[15px] tracking-tight">
            PSW <span className="font-light">DIGITAL</span>
          </div>
          <div className="text-[10px] text-nav-muted">CoE Hiperautomação</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-1 overflow-y-auto">
        {NAV.map(renderItem)}
        {isAdmin && (
          <>
            <div className="mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-nav-muted">
              Administração
            </div>
            {ADMIN_NAV.map(renderItem)}
          </>
        )}
      </nav>

      {/* Seletor de empresa (só admin) */}
      {isAdmin && tenants.length > 0 && (
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
            {profile.fullName ?? profile.email}
          </div>
          <div className="text-[11px] text-nav-muted truncate">
            {roleLabel[profile.role]}
          </div>
        </div>
        <form action="/logout" method="post">
          <button
            type="submit"
            title="Sair"
            aria-label="Sair"
            className="p-2 rounded-lg text-nav-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <Icon.Logout className="w-[18px] h-[18px]" />
          </button>
        </form>
      </div>
    </aside>
  );
}
