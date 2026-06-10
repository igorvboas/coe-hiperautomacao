'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Icon } from './icons';

type Tenant = { slug: string; name: string };

/**
 * Seletor de empresa — só para platform_admin. "Todas as empresas" mostra o
 * portfólio consolidado (RLS cross-tenant); escolher uma empresa adiciona
 * `?empresa=<slug>` — SLUG legível na URL, nunca o UUID. O server resolve para
 * tenant_id.
 */
export function CompanySelector({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('empresa') ?? '';

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('empresa', value);
    else params.delete('empresa');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="px-3 py-3">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-nav-muted mb-1.5 px-1">
        Empresa
      </label>
      <div className="relative">
        <select
          value={current}
          onChange={onChange}
          className="w-full appearance-none bg-nav-active text-white text-[13px] font-medium rounded-lg pl-3 pr-8 py-2 border border-white/10 focus:outline-none focus:border-white/30 cursor-pointer"
        >
          <option value="">Todas as empresas</option>
          {tenants.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
        <Icon.Chevron className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-nav-muted" />
      </div>
    </div>
  );
}
