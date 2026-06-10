-- =============================================================================
-- 0015_platform_admin_role.sql — Adiciona role de super-admin de plataforma
-- =============================================================================
-- CONTEXTO: até aqui `tenant_role` tinha só ('member', 'tenant_admin'), ambos
-- ESCOPADOS A UM TENANT. O que falta para produtizar é um SUPER-ADMIN DE
-- PLATAFORMA (a PSW) que enxerga TODOS os tenants — para suporte, visão
-- consolidada e gestão de quem pode criar conta.
--
-- Esta migration SÓ adiciona o valor ao enum. As policies de RLS cross-tenant
-- vêm na 0016, separadas de propósito: o Postgres não deixa um valor de enum
-- recém-criado ser USADO na mesma transação em que foi adicionado. Mantendo o
-- ALTER TYPE isolado, a 0016 pode referenciá-lo sem risco.
--
-- IMPORTANTE: isto NÃO promove ninguém. Para tornar um usuário super-admin,
-- rode (com service_role / SQL editor) algo como:
--     update profiles set role = 'platform_admin' where email = 'voce@psw...';
--
-- Idempotente (`if not exists`). Pré-requisitos: 0001..0014 aplicadas.
-- =============================================================================

set session characteristics as transaction read write;
set default_transaction_read_only = off;

alter type tenant_role add value if not exists 'platform_admin';

-- =============================================================================
-- FIM 0015 — enum estendido. Aplicar 0016 em seguida para as policies.
-- =============================================================================
