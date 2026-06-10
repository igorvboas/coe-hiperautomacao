import { redirect } from 'next/navigation';
import { getCurrentProfile, isPlatformAdmin } from '@/lib/auth/roles';

/**
 * Guard de toda a área /admin: só super-admin de plataforma (PSW) entra.
 * Defesa em profundidade — o RLS já bloqueia os dados, mas aqui evitamos
 * renderizar UI de admin para quem não é.
 */
export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const profile = await getCurrentProfile();
  if (!isPlatformAdmin(profile)) redirect('/opportunities');

  return <>{children}</>;
}
