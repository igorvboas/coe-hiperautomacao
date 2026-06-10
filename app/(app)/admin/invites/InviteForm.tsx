'use client';

import { useState, useTransition } from 'react';
import { createInvite } from './actions';

type TenantOption = { id: string; name: string };

export function InviteForm({ tenants }: { tenants: TenantOption[] }) {
  const [mode, setMode] = useState<'existing' | 'new'>(
    tenants.length > 0 ? 'existing' : 'new'
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createInvite(formData);
      if ('error' in result) setError(result.error);
      else {
        // limpa o form em caso de sucesso
        const form = document.getElementById('invite-form') as HTMLFormElement | null;
        form?.reset();
      }
    });
  }

  const inputCls =
    'mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-pril focus:ring-2 focus:ring-pril/20';
  const labelCls = 'text-xs font-bold uppercase tracking-wide text-mut';

  return (
    <form
      id="invite-form"
      action={onSubmit}
      className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4"
    >
      <h2 className="text-sm font-bold text-slate-800">Liberar novo e-mail</h2>

      <div>
        <label htmlFor="invite-email" className={labelCls}>
          E-mail autorizado
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="pessoa@empresa.com.br"
          className={inputCls}
        />
      </div>

      {/* Empresa: existente ou nova */}
      <div className="flex flex-col gap-2">
        <span className={labelCls}>Empresa</span>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="tenant_mode"
              value="existing"
              checked={mode === 'existing'}
              onChange={() => setMode('existing')}
              disabled={tenants.length === 0}
            />
            Existente
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="tenant_mode"
              value="new"
              checked={mode === 'new'}
              onChange={() => setMode('new')}
            />
            Nova empresa
          </label>
        </div>

        {mode === 'existing' ? (
          <select name="tenant_id" required={mode === 'existing'} className={inputCls}>
            <option value="">Selecione…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="new_company"
            type="text"
            required={mode === 'new'}
            placeholder="Nome da nova empresa"
            className={inputCls}
          />
        )}
      </div>

      <div>
        <label htmlFor="invite-role" className={labelCls}>
          Papel
        </label>
        <select id="invite-role" name="role" defaultValue="member" className={inputCls}>
          <option value="member">Membro</option>
          <option value="tenant_admin">Admin da empresa</option>
        </select>
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
        className="py-2.5 bg-pri hover:bg-pril text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
      >
        {pending ? 'Liberando...' : 'Liberar e-mail'}
      </button>
    </form>
  );
}
