'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type SignInResult = { error: string } | void;

export async function signIn(formData: FormData): Promise<SignInResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Informe e-mail e senha.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Não expor detalhes (rate limit, user not found, etc.) — mensagem genérica
    return { error: 'E-mail ou senha incorretos.' };
  }

  // redirect() em Server Action joga um erro especial — não envolva em try/catch
  redirect('/opportunities');
}
