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

  return <PublicForm tenant={tenant} />;
}
