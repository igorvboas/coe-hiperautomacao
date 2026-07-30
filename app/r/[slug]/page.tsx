import { notFound } from 'next/navigation';
import { fetchPublicTenantBySlug } from '@/lib/tenants/queries';
import { brandingCss } from '@/lib/branding/theme';
import { PublicForm } from './PublicForm';

export const metadata = {
  title: 'Registrar Oportunidade',
};

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await fetchPublicTenantBySlug(slug);
  if (!tenant) notFound();

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY ?? '';
  const enableTurnstile = !!siteKey && !!turnstileSecret;
  if (!enableTurnstile) {
    // Não passar a siteKey ao cliente quando a secret não existir — assim o
    // widget não será renderizado e evitamos erros de origem/iframe quando uma
    // chave placeholder estiver presente sem a secret correspondente.
    console.warn('Turnstile desabilitado — siteKey ou TURNSTILE_SECRET_KEY ausente.');
  }

  // Identidade visual da empresa (/configuracoes) também no formulário público:
  // aqui o tenant vem do SLUG da URL, não da sessão — quem preenche é anônimo.
  const themeCss = brandingCss(tenant.brandColor);

  return (
    <>
      {themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}
      <PublicForm tenant={tenant} siteKey={enableTurnstile ? siteKey : ''} />
    </>
  );
}
