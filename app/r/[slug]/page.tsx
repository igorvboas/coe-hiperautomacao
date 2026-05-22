import { notFound } from 'next/navigation';
import { fetchPublicTenantBySlug } from '@/lib/tenants/queries';
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

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    // Em prod, env DEVE estar setada. Sem chave, formulário não consegue gerar
    // token Turnstile — melhor falhar visível do que renderizar form quebrado.
    throw new Error(
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY ausente — configurar no Vercel env.',
    );
  }

  return <PublicForm tenant={tenant} siteKey={siteKey} />;
}
