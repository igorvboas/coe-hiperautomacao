import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/database.types';

/**
 * Refresca a sessão Supabase e aplica route guard.
 * Chamado pelo middleware.ts da raiz a cada request.
 *
 * Regras:
 *   • Sem sessão + rota não-pública → redirect /login
 *   • Com sessão + /login|/signup → redirect /opportunities
 *   • Caso contrário              → segue
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca a sessão (também valida o JWT contra o servidor Auth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    path === '/login' ||
    // Cadastro por convite: PRECISA ser público — quem vem criar a conta é, por
    // definição, anônimo. A trava não é o guard e sim o trigger handle_new_user
    // (0022), que rejeita e-mail sem convite pendente na allowlist.
    path === '/signup' ||
    path.startsWith('/_next') ||
    path === '/favicon.ico' ||
    path === '/' ||
    path.startsWith('/r/'); // formulário público por tenant slug

  // Server Actions respondem num protocolo próprio (POST + header `next-action`).
  // Redirecionar esse POST pra /login devolve HTML pro client da action → throw
  // no startTransition → error boundary "Erro crítico". Deixa passar: as actions
  // já checam getUser() e retornam { ok: false, error: 'Sessão expirada.' }.
  const isServerAction =
    request.method === 'POST' && request.headers.has('next-action');

  // Sem sessão tentando acessar rota protegida
  if (!user && !isPublic && !isServerAction) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Já logado tentando ir pra /login ou /signup
  if (user && (path === '/login' || path === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/opportunities';
    return NextResponse.redirect(url);
  }

  // Sem sessão na home → manda pra login pra simplificar UX
  if (!user && path === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Já logado e veio na home → vai pra listagem
  if (user && path === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/opportunities';
    return NextResponse.redirect(url);
  }

  return response;
}
