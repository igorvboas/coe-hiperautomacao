'use client';

import { useState, useTransition } from 'react';
import { signIn } from './actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) setError(result.error);
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
              <h1 className="text-base font-bold">CoE Hiperautomação</h1>
              <p className="text-xs opacity-75">Gestão de Automações · PSW</p>
            </div>
          </div>
        </div>

        <form action={onSubmit} className="px-6 py-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-mut">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-pril focus:ring-2 focus:ring-pril/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wide text-mut">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-pril focus:ring-2 focus:ring-pril/20"
            />
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
            {pending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
