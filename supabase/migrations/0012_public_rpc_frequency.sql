-- =============================================================================
-- 0012_public_rpc_frequency.sql — corrige regressão latente da RPC pública
-- =============================================================================
-- Phase 10 — Plan 10-01.
--
-- CAUSA: 0011 mudou `opportunities.tempo` de `time_bucket` para `frequency_bucket`.
-- A RPC pública `create_public_opportunity` (definição LIVE, herdada de 0005, com o
-- hardening de 0007) ainda mapeava `p_tempo` no domínio ANTIGO:
--     case when p_tempo in ('pequeno','medio','grande') then p_tempo::time_bucket else null end
-- e inseria em `opportunities.tempo`. Pós-0011 isso grava NULL silencioso (valores
-- de frequência caem no else) — regressão latente do formulário público anônimo
-- (Phase 7.5). Nenhum valor de frequência válido chegava à coluna.
--
-- CORREÇÃO: recriar a função com `create or replace`, assinatura IDÊNTICA (18 params,
-- confirmada por introspecção do catálogo vivo em 2026-06-04), corpo IDÊNTICO, mudando
-- APENAS a linha de mapeamento de `p_tempo` para o domínio de frequência:
--     case when p_tempo in ('diario','semanal','quinzenal','mensal','anual')
--          then p_tempo::frequency_bucket else null end
--
-- `create or replace` com a MESMA assinatura substitui no lugar e PRESERVA os grants
-- existentes (anon, authenticated) — sem drop de overload. O grant é reafirmado ao
-- final por segurança/idempotência.
--
-- WRITE-ONLY MODE — aplicar manualmente no Supabase Cloud SQL Editor (NÃO db push).
-- Colar o conteúdo INTEIRO de uma vez. Pré-requisitos: 0001..0011 aplicadas.
-- =============================================================================

set check_function_bodies = off;

create or replace function public.create_public_opportunity(
  p_tenant_slug text,
  p_solicitante text,
  p_email text,
  p_area text,
  p_subarea text,
  p_processo text,
  p_frequencia text,
  p_volume_medio text,
  p_tempo_execucao text,
  p_num_pessoas text,
  p_ferramenta text,
  p_escopo_automacao text[],
  p_beneficios_esperados text[],
  p_esforco text,
  p_complexidade text,
  p_tempo text,
  p_objetivo smallint,
  p_formulario_extras jsonb
) returns uuid
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_tenant_id uuid;
  v_opp_id    uuid;
  v_item      text;
begin
  -- =====================================================================
  -- Defesa em profundidade: length / array / jsonb limits
  -- =====================================================================

  if length(coalesce(p_solicitante, '')) > 200 then
    raise exception 'solicitante excede 200 caracteres';
  end if;
  if length(coalesce(p_email, '')) > 200 then
    raise exception 'email excede 200 caracteres';
  end if;
  if length(coalesce(p_area, '')) > 200 then
    raise exception 'área excede 200 caracteres';
  end if;
  if length(coalesce(p_subarea, '')) > 200 then
    raise exception 'subárea excede 200 caracteres';
  end if;
  if length(coalesce(p_processo, '')) > 2000 then
    raise exception 'processo excede 2000 caracteres';
  end if;
  if length(coalesce(p_frequencia, '')) > 60 then
    raise exception 'frequência excede 60 caracteres';
  end if;
  if length(coalesce(p_volume_medio, '')) > 60 then
    raise exception 'volume médio excede 60 caracteres';
  end if;
  if length(coalesce(p_tempo_execucao, '')) > 60 then
    raise exception 'tempo de execução excede 60 caracteres';
  end if;
  if length(coalesce(p_num_pessoas, '')) > 60 then
    raise exception 'número de pessoas excede 60 caracteres';
  end if;

  if coalesce(array_length(p_escopo_automacao, 1), 0) > 20 then
    raise exception 'escopo_automacao excede 20 itens';
  end if;
  if p_escopo_automacao is not null then
    foreach v_item in array p_escopo_automacao loop
      if length(coalesce(v_item, '')) > 200 then
        raise exception 'item de escopo excede 200 caracteres';
      end if;
    end loop;
  end if;

  if coalesce(array_length(p_beneficios_esperados, 1), 0) > 20 then
    raise exception 'beneficios_esperados excede 20 itens';
  end if;
  if p_beneficios_esperados is not null then
    foreach v_item in array p_beneficios_esperados loop
      if length(coalesce(v_item, '')) > 200 then
        raise exception 'item de benefícios excede 200 caracteres';
      end if;
    end loop;
  end if;

  if p_formulario_extras is not null
     and length(p_formulario_extras::text) > 8192 then
    raise exception 'formulario_extras excede 8KB';
  end if;

  -- =====================================================================
  -- Validações originais (de 0005, mantidas)
  -- =====================================================================

  if p_solicitante is null or length(trim(p_solicitante)) < 2 then
    raise exception 'Nome do solicitante é obrigatório';
  end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido';
  end if;
  if p_area is null or length(trim(p_area)) < 2 then
    raise exception 'Área é obrigatória';
  end if;
  if p_processo is null or length(trim(p_processo)) < 3 then
    raise exception 'Descrição do processo é obrigatória';
  end if;
  if p_objetivo is null or p_objetivo < 1 or p_objetivo > 5 then
    raise exception 'Alinhamento estratégico deve estar entre 1 e 5';
  end if;

  -- =====================================================================
  -- Resolve tenant e INSERT (mantém lógica de 0005)
  -- =====================================================================

  select id into v_tenant_id
    from tenants
   where slug = p_tenant_slug and status = 'active'
   limit 1;

  if v_tenant_id is null then
    raise exception 'Tenant não encontrado ou inativo';
  end if;

  insert into opportunities (
    tenant_id, source, solicitante, email, area, subarea, processo,
    frequencia, volume_medio, tempo_execucao, num_pessoas,
    ferramenta, escopo_automacao, beneficios_esperados,
    esforco, complexidade, tempo, objetivo,
    status, formulario_extras
  ) values (
    v_tenant_id, 'formulario', trim(p_solicitante), trim(p_email),
    trim(p_area), nullif(trim(coalesce(p_subarea,'')),''),
    trim(p_processo), nullif(trim(coalesce(p_frequencia,'')),''),
    nullif(trim(coalesce(p_volume_medio,'')),''),
    nullif(trim(coalesce(p_tempo_execucao,'')),''),
    nullif(trim(coalesce(p_num_pessoas,'')),''),
    case
      when p_ferramenta in ('rpa', 'n8n', 'ambos') then p_ferramenta::automation_tool
      else null
    end,
    coalesce(p_escopo_automacao, '{}'),
    coalesce(p_beneficios_esperados, '{}'),
    case when p_esforco in ('baixo', 'medio', 'alto') then p_esforco::effort_level else null end,
    case when p_complexidade in ('baixo', 'medio', 'alto') then p_complexidade::complexity_level else null end,
    -- 0012: p_tempo agora no domínio de FREQUÊNCIA (era ('pequeno','medio','grande')::time_bucket)
    case when p_tempo in ('diario', 'semanal', 'quinzenal', 'mensal', 'anual') then p_tempo::frequency_bucket else null end,
    p_objetivo,
    'novo',
    p_formulario_extras
  )
  returning id into v_opp_id;

  return v_opp_id;
end;
$function$;

-- Reafirma os grants (idempotente; create or replace já os preserva).
grant execute on function public.create_public_opportunity(
  text, text, text, text, text, text, text, text, text, text, text,
  text[], text[], text, text, text, smallint, jsonb
) to anon, authenticated;

-- =============================================================================
-- Smoke (rodar manualmente após o apply; limpar a row depois):
--   select public.create_public_opportunity(
--     '<slug-de-tenant-ativo>', 'smoke', 'smoke@x.z', 'TI', '', 'proc smoke',
--     '', '', '', '', '', '{}'::text[], '{}'::text[],
--     'medio', 'medio', 'mensal', 3::smallint, '{}'::jsonb);
--   -- deve retornar uuid; conferir: select tempo from opportunities where solicitante='smoke';  -> 'mensal'
--   delete from opportunities where solicitante='smoke';
-- =============================================================================
