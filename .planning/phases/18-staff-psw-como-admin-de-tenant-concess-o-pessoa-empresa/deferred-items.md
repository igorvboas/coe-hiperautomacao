# Deferred Items — Phase 18

Itens fora do escopo do plano 18-01, descobertos durante execução, e propositalmente NÃO corrigidos (SCOPE BOUNDARY — só é escopo o que a task atual mudou).

## `npm run typecheck` — erro pré-existente em `tests/opportunities/report-strategic.test.ts`

- **Onde:** `tests/opportunities/report-strategic.test.ts:107` — `TS2322: Type 'null' is not assignable to type 'number | undefined'`.
- **Origem:** commit `aaf8e5a` ("feat(opportunities): redesign estratégico da aba Relatório"), anterior a qualquer trabalho da Phase 18.
- **Por que não foi corrigido aqui:** nenhum arquivo do plano 18-01 (`lib/database.types.ts`, `tests/schema/psw-staff-restrictive-rule.test.ts`, `tests/security/psw-staff-admin-grant.test.ts`) toca `report-strategic.test.ts` nem o código que ele exercita. É pré-existente e fora do raio da Task 2/3.
- **Impacto na Task 2:** o `<verify>` da Task 2 roda `npm run typecheck` "sai 0" como parte do gate — o comando encadeado (`npm run typecheck && npx vitest run ...`) falharia por causa deste erro alheio. Verificado isoladamente que o bloco `psw_tenant_admins` novo compila limpo (nenhum erro TS aponta para `lib/database.types.ts` nem para os arquivos desta task); o exit code não-zero do `tsc --noEmit` global vem inteiramente deste arquivo pré-existente.
- **Ação recomendada:** corrigir em uma task/fase que efetivamente toque `report-strategic.test.ts` (ou uma passada de tech-debt dedicada), não aqui.
