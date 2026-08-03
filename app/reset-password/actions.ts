'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ResetPasswordResult = { error: string } | void;

const MIN_LENGTH = 8;

/**
 * Grava a nova senha. Só funciona com a sessão de recuperação já estabelecida
 * pelo /auth/callback — `updateUser` roda no contexto do usuário autenticado,
 * então não existe caminho para trocar a senha de outra conta.
 */
export async function resetPassword(
  formData: FormData
): Promise<ResetPasswordResult> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('password_confirm') ?? '');

  if (password.length < MIN_LENGTH) {
    return { error: `A senha deve ter ao menos ${MIN_LENGTH} caracteres.` };
  }
  if (password !== confirm) {
    return { error: 'As senhas não conferem.' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: 'Link expirado ou já utilizado. Solicite uma nova recuperação de senha.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Causas típicas: senha fraca (política do projeto), senha igual à anterior,
    // sessão de recovery expirada.
    return {
      error:
        'Não foi possível atualizar a senha. Tente uma senha diferente ou solicite um novo link.',
    };
  }

  // Invalida as demais sessões — se o link vazou/foi usado num dispositivo
  // alheio, só o navegador atual continua logado após a troca.
  await supabase.auth.signOut({ scope: 'others' });

  redirect('/opportunities');
}
