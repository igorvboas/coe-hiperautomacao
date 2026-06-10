'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { signUp } from './actions';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result && 'error' in result) setError(result.error);
      else if (result && 'ok' in result) setDone(true);
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-pri to-pril text-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center font-black">
              FG
            </div>
            <div>
              <h1 className="text-base font-bold">Criar conta</h1>
              <p className="text-xs opacity-75">CoE Hiperautomação · PSW</p>
            </div>
          </div>
        </div>

        {done ? (
          <div className="px-6 py-8 text-center flex flex-col gap-3">
            <div className="text-3xl">✉️</div>
            <p className="text-sm text-slate-700">
              Conta criada! Verifique seu e-mail para confirmar o cadastro e
              depois faça login.
            </p>
            <Link
              href="/login"
              className="mt-2 text-sm font-semibold text-pri hover:underline"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <form action={onSubmit} className="px-6 py-6 flex flex-col gap-4">
            <p className="text-xs text-mut">
              Use o e-mail que foi liberado pelo administrador da sua empresa.
            </p>

            <div>
              <label
                htmlFor="full_name"
                className="text-xs font-bold uppercase tracking-wide text-mut"
              >
                Nome completo
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                autoFocus
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-pril focus:ring-2 focus:ring-pril/20"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wide text-mut"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-pril focus:ring-2 focus:ring-pril/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wide text-mut"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-pril focus:ring-2 focus:ring-pril/20"
              />
              <p className="mt-1 text-[11px] text-mut">Mínimo de 8 caracteres.</p>
            </div>

            {error && (
              <div
                role="alert"
                className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 bg-pri hover:bg-pril text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {pending ? 'Criando...' : 'Criar conta'}
            </button>

            <p className="text-center text-xs text-mut">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold text-pri hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
