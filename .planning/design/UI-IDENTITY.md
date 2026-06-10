# UI Identity — CoE Hiperautomação (v0.3 produtização)

> **Contrato visual da Frente 3 (rebuild do front).** Extraído da referência
> enviada pelo PO em 2026-06-09 (print de 4 telas: lista, detalhe, wizard,
> relatórios). **Substitui `_giba_wsi-dashboard.html`** como referência visual
> — decisão explícita do PO (CLAUDE.md regra nº2). O modelo de dados/score do
> `_giba` continua valendo; o que muda é a **casca visual e o layout**.
>
> Cores marcadas com ≈ são leituras aproximadas do print — confirmar/ajustar
> com o PO antes de travar os tokens.

---

## 1. Conceito

SaaS dashboard **moderno, limpo e corporativo**: sidebar escura fixa à
esquerda + área de conteúdo clara. Densidade média, muito respiro (whitespace),
cantos arredondados, sombras suaves. Sensação de "produto sério", não de
ferramenta interna improvisada. Inspiração: Linear / Vercel / dashboards shadcn.

Mudança estrutural vs. front atual: **sai** a topbar gradiente roxa full-width;
**entra** a sidebar de navegação + header de página interno.

---

## 2. Paleta (mapeada para `@theme` do Tailwind v4 em `app/globals.css`)

### Navegação (sidebar)
| Token | Valor ≈ | Uso |
|---|---|---|
| `--color-nav` | `#16213e` → `#1a2744` (gradiente vertical sutil) | fundo da sidebar |
| `--color-nav-fg` | `#e2e8f0` | texto/ícone de item inativo |
| `--color-nav-muted` | `#94a3b8` | labels de seção, texto secundário |
| `--color-nav-active-bg` | `rgba(255,255,255,.08)` | fundo do item ativo (pill) |
| `--color-nav-active-fg` | `#ffffff` | texto/ícone do item ativo |

### Marca / ações
| Token | Valor ≈ | Uso |
|---|---|---|
| `--color-primary` | `#16a34a` (green-600) | botão primário ("Nova Oportunidade"), ações positivas, deltas ↑ |
| `--color-primary-hover` | `#15803d` (green-700) | hover do primário |
| `--color-dark` | `#1e293b` (slate-800) | botão escuro ("Ações", "Próximo") |
| `--color-pri` | `#1a3c6e` (mantém) | acento navy, links, headers de gráfico |

> Nota: o `--color-acc #00a878` atual é um verde-azulado. A referência usa um
> verde mais "puro" (≈ green-600). Sugestão: redefinir o primário para
> `#16a34a` e manter `acc` como secundário, OU alinhar `acc → #16a34a`. Decidir
> com o PO.

### Superfícies & texto
| Token | Valor ≈ | Uso |
|---|---|---|
| `--color-bg` | `#f8fafc` (slate-50) | fundo da área de conteúdo |
| `--color-wh` | `#ffffff` | cards, tabela, header |
| `--color-bdr` | `#e2e8f0` (slate-200) | bordas de card/tabela |
| `--color-txt` | `#0f172a` (slate-900) | títulos, números KPI |
| `--color-mut` | `#64748b` (slate-500) | labels, subtítulos, texto secundário |

### Badges semânticos (status / tipo / prioridade)
Padrão: **bg tinta-50 + texto tinta-600/700**, pill arredondado, 11px bold.

| Semântica | bg ≈ | texto ≈ |
|---|---|---|
| Incidente / alta / negativo | `#fee2e2` | `#dc2626` |
| Melhoria / info / "Novo" | `#dbeafe` | `#2563eb` |
| Dúvida / média / atenção | `#fef3c7` | `#d97706` |
| Treinamento / neutro-verde | `#ccfbf1` | `#0d9488` |
| Concluído / sucesso | `#dcfce7` | `#16a34a` |
| Baixa / neutro | `#f1f5f9` | `#475569` |

Mapeamento sugerido para `request_type` (badge "Tipo"):
`incidente → vermelho`, `melhoria_automacao → azul`, `duvidas_terceiros → âmbar`,
`nova_oportunidade → verde`, `treinamento → teal`.

---

## 3. Tipografia

- **Família:** sans geométrica (Inter / Geist). O atual `Segoe UI` funciona,
  mas para "cara de produto" sugiro **Inter** via `next/font`.
- **Base:** subir de 13px → **14px** (a referência respira mais).
- Escala:
  | Uso | Tamanho/peso |
  |---|---|
  | Título de página ("Oportunidades") | 24–28px / 700 |
  | Subtítulo de página | 13–14px / 400, `mut` |
  | Número KPI ("61") | 30–36px / 700 |
  | Label de KPI/card | 12–13px / 500, `mut` |
  | Header de tabela | 11px / 700, uppercase, tracking wide, `mut` |
  | Célula de tabela | 13–14px / 400–500 |
  | Badge | 11px / 700 |
  | Delta (+12%) | 12px / 600, verde |

---

## 4. Espaçamento, raio, sombra

- **Raio:** cards/botões `rounded-xl` (12px); pills/badges `rounded-full`;
  inputs `rounded-lg` (8px).
- **Sombra:** cards `shadow-sm` (sutil); sidebar sem sombra; modais `shadow-xl`.
- **Bordas:** 1px `bdr` em cards/tabela; sidebar sem borda (contraste pela cor).
- **Padding:** cards `p-5`; células de tabela `px-4 py-3`; conteúdo da página
  `px-6 py-6` (ou `px-8` em telas largas).
- **Gaps:** grid de KPIs `gap-4`; seções verticais `gap-6`.

---

## 5. Shell de layout

```
┌───────────┬──────────────────────────────────────────────┐
│  SIDEBAR  │  HEADER DE PÁGINA (título + ações à direita)   │
│  (fixa    │ ─────────────────────────────────────────────│
│   ~240px) │  [search] [Filtros] [+ Nova Oportunidade]      │
│           │ ─────────────────────────────────────────────│
│  logo     │  KPI  KPI  KPI  KPI   (grid 4 col)             │
│  nav…     │ ─────────────────────────────────────────────│
│           │  CONTEÚDO (tabela / cards / kanban / charts)   │
│  ─────    │                                                │
│  user ▾   │                                                │
└───────────┴──────────────────────────────────────────────┘
```

- **Sidebar:** largura ~240px, altura total, `fixed`/`sticky`. Topo: logo
  "PSW DIGITAL" (marca em quadradinho arredondado + wordmark). Meio: lista de
  nav com ícone+label. Rodapé: avatar + nome + "Administrador" + chevron
  (menu de conta/logout).
- **Nav items (ref.):** Dashboard, Oportunidades, Solicitantes, Relatórios,
  Automações, Configurações. Item ativo = pill com `nav-active-bg` + texto
  branco. (Adaptar à navegação real do app; ver §8.)
- **Conteúdo:** rola independente; max-width opcional em telas muito largas.

---

## 6. Componentes (specs)

### 6.1 Sidebar nav item
Ícone 18px + label 14px, `px-3 py-2`, `rounded-lg`, gap-3. Inativo: `nav-fg`,
hover `nav-active-bg/50`. Ativo: `nav-active-bg` + `nav-active-fg`.

### 6.2 Header de página
Linha flex: à esquerda título (700) + subtítulo (`mut`); à direita ícones
(sino, engrenagem) e/ou botões de ação. `mb-6`.

### 6.3 Barra de busca + ações
Input de busca à esquerda (ícone lupa interno, `rounded-lg`, borda `bdr`,
placeholder `mut`), à direita "Filtros" (botão branco c/ borda + ícone) e
primário verde "+ Nova Oportunidade".

### 6.4 KPI card
`bg-wh rounded-xl border p-5 shadow-sm`. Linha topo: label (`mut`, 12px) +
ícone tintado num quadradinho `rounded-lg` (canto sup. direito). Número grande
(700). Abaixo: delta verde "+12% este mês". Grid `grid-cols-4 gap-4`
(responsivo: 2 col em md, 1 col em sm).

### 6.5 Tabela de dados
- Header: `bg-slate-50`, texto 11px uppercase `mut` bold.
- Linhas: borda-topo `bdr`, `px-4 py-3`, hover `bg-slate-50/60`.
- Colunas (ref.): ID, Tipo (badge), Solicitante (avatar+nome), Área/Subárea,
  Classificação, Status (badge), Score (número), Prioridade (badge), Ações
  ("Ver" link `primary`).
- Rodapé: "Mostrando X a Y de Z" (`mut`) + paginação (botões `‹ 1 ›`).

### 6.6 Badge / pill
`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold` +
cores da tabela §2.

### 6.7 Botões
- **Primário:** `bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-hover`.
- **Escuro:** `bg-dark text-white …` (ações secundárias importantes / "Próximo").
- **Outline:** `bg-wh border border-bdr text-txt …` ("Filtros", "Editar", "Anterior").
- **Ghost/link:** texto `primary` sem fundo ("Ver", "Voltar").

### 6.8 Avatar
Círculo 28–32px, `bg-nav` (navy) com inicial branca, ou foto. Usado na tabela
(solicitante) e no rodapé da sidebar.

### 6.9 Wizard (Nova Oportunidade)
- **Stepper vertical** à esquerda: círculo numerado + label. Concluído = verde
  com ✓; ativo = `dark` preenchido; futuro = `bg-slate-200 text-mut`.
- **Cards selecionáveis** (escolha de tipo): grid de cards `rounded-xl border p-4`
  com ícone, título (600) e descrição (`mut`). Selecionado = borda `primary`/`dark`
  2px + leve `bg`. Ícones grandes no topo de cada card.
- **Rodapé:** "Cancelar" (ghost, esquerda) · "Anterior" (outline) + "Próximo"
  (dark, direita).

### 6.10 Detalhe da oportunidade
- Header: "#0003 · Título" (700) + "Editar" (outline) + "Ações ▾" (dark).
  Link "‹ Voltar".
- **Tabs verticais** à esquerda (Visão geral / Histórico / Anexos / Comentários):
  item ativo = pill `bg-slate-100`.
- **Grid de info-cards** (`bg-slate-50 rounded-lg p-4`): label `mut` 12px +
  valor 14px. Ex.: Solicitante (avatar+nome+email), Área/Subárea, Classificação
  (com ícone tintado), Frequência, Volume, Tempo, Sistemas, Data, Status.
- Seção "Descrição" full-width abaixo.

### 6.11 Relatórios (charts)
- KPI row (4): Total, Taxa de Conclusão %, Tempo Médio, Score Médio + deltas.
- Header com "Últimos 30 dias ▾" (select) + "Exportar" (outline c/ ícone).
- **Donut** "por classificação" + legenda colorida (cores dos badges).
- **Barras horizontais** "por área" (tons de azul `pri`).
- **Linha** "Evolução" (2 séries: Novas / Concluídas).
- **Lib sugerida:** `recharts` (ou o chart do shadcn que o encapsula).

---

## 7. Notas por tela (posicionamento)

1. **Lista:** header → busca/ações → 4 KPIs → tabela → paginação.
2. **Detalhe:** header+ações → (tabs verticais | grid de info-cards) → descrição.
3. **Wizard:** (stepper vertical | pergunta + cards selecionáveis) → rodapé nav.
4. **Relatórios:** header+filtros → 4 KPIs → (donut | barras) → linha full-width.

---

## 8. Adaptações ao app real (não copiar a ref. cegamente)

- A nav da referência tem "Solicitantes" e "Automações" que **podem não existir**
  ainda. Mapear para as rotas reais: Dashboard, Oportunidades, Relatórios,
  (Admin/Convites — só `platform_admin`), Configurações.
- **Camada admin (`platform_admin`):** a sidebar deve ganhar um **seletor de
  empresa** ("Empresa: Todas ▾") no topo do conteúdo OU no rodapé da sidebar,
  para o super-admin filtrar/trocar de tenant. (Definir com o PO — pergunta em
  aberto da Frente 3.)
- Manter o **score de 5 fatores** e os campos do modelo v0.2; a UI muda, o
  domínio não.
- pt-BR na UI; código em inglês (CLAUDE.md).

---

## 9. Próximos passos sugeridos

1. PO confirma/ajusta os tokens ≈ (principalmente o verde primário e o navy).
2. Atualizar `@theme` em `app/globals.css` com os tokens novos.
3. Construir o **shell** (sidebar + layout) primeiro — é a mudança estrutural.
4. Migrar tela a tela: Lista → Detalhe → Wizard → Relatórios.
5. (Opcional) Gerar um mockup HTML estático fiel à referência como "contrato"
   navegável antes de tocar nos componentes React (`/gsd-sketch`).
```
