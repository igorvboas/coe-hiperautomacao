import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/session';

/**
 * Next.js 16 Proxy (substitui o antigo middleware.ts).
 * Roda antes de cada request — refresca sessão Supabase e aplica route guard.
 *
 * Documentação: node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Roda em tudo exceto:
     *   - _next/static, _next/image (assets gerados)
     *   - favicon.ico
     *   - arquivos estáticos (svg/png/jpg/jpeg/gif/webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
