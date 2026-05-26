# PROMPT — Claude-Work (Opus 4.7) | TASK-012 — UI Polish: Dark Mode + Limpeza de Header + Abas
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Execute esta task completa.
> Projeto: LAADV Calculadora Jurídica · v1.9.0

---

## Contexto

Repositório: https://github.com/leonzordhue/calculadora_juridica.git
Arquivo alvo: `LAADV_Calculadora_Juridica_v1.html`

Três problemas identificados na v1.9.0:
1. **Dark mode não funciona** — as variáveis CSS foram criadas em TASK-008 mas as regras existentes ainda usam `#fff` e `var(--gray-bg)` hardcoded. O toggle muda o atributo do body mas o visual não muda.
2. **Header expõe métricas internas** — `Q=1.000`, `IC=1.00` e o badge `AKE/UFT-1.0` aparecem para os advogados. São métricas de engenharia interna — não devem ser visíveis.
3. **Ordem das abas errada** e **nome da plataforma** inadequado para o público.

---

## Branch
```
git checkout main
git pull origin main
git checkout -b claude/work-ui-polish
```

## Arquivos que você DEVE tocar
- `LAADV_Calculadora_Juridica_v1.html`

## Arquivos que você NÃO deve tocar
- Qualquer arquivo em `core/`, `io/`, `render/`

---

## Parte 1 — Corrigir Dark Mode

### 1.1 Problema atual

O `:root` define vars de tema escuro (`--bg-principal: #0D1B2A`) mas as regras CSS principais usam valores fixos:
- `body { background: var(--gray-bg) ... }` — `--gray-bg` nunca muda
- `.card { background: #fff }` — nunca muda
- `input, select, textarea { background: #fff }` — nunca muda
- `.tabs-nav { background: #fff }` — nunca muda

### 1.2 Solução

**Passo A — Reorganizar `:root` e adicionar `[data-tema="escuro"]`:**

Substitua o bloco `:root` atual e o `[data-tema="claro"]` por:

```css
/* Tema CLARO — padrão */
:root {
  --teal:#0B4A44;--teal-mid:#145E58;--teal-light:#1A7A72;
  --gold:#C9A93E;--gold-light:#E8C96A;
  --danger:#C0392B;--success:#27AE60;--warn:#E67E22;
  /* Tema */
  --bg-principal:#F5F7F9;
  --bg-card:#FFFFFF;
  --bg-card2:#EEF2F7;
  --bg-input:#FFFFFF;
  --txt-principal:#1A2B2A;
  --txt-detalhe:#6B7B7A;
  --txt-label:#6B7B7A;
  --border-card:#D1DBD9;
  --border-input:#D1DBD9;
  --sombra:rgba(0,0,0,.07);
}

/* Tema ESCURO */
[data-tema="escuro"] {
  --bg-principal:#0D1B2A;
  --bg-card:#0A1420;
  --bg-card2:#0A1628;
  --bg-input:#0A1628;
  --txt-principal:#C0D0D0;
  --txt-detalhe:#8BC4C4;
  --txt-label:#8BC4C4;
  --border-card:#1A3A5C;
  --border-input:#1A3A5C;
  --sombra:rgba(0,0,0,.3);
}
```

**Passo B — Atualizar regras CSS para usar as variáveis de tema:**

Localize e substitua nas regras existentes:

| Regra | Antes | Depois |
|-------|-------|--------|
| `body` | `background:var(--gray-bg);color:var(--text)` | `background:var(--bg-principal);color:var(--txt-principal)` |
| `.card` | `background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.07)` | `background:var(--bg-card);box-shadow:0 1px 6px var(--sombra)` |
| `input,select,textarea` | `background:#fff` e `color:var(--text)` e `border:1.5px solid var(--border)` | `background:var(--bg-input);color:var(--txt-principal);border:1.5px solid var(--border-input)` |
| `.tabs-nav` | `background:#fff;border-bottom:2px solid var(--border)` | `background:var(--bg-card);border-bottom:2px solid var(--border-card)` |
| `label` | `color:var(--muted)` | `color:var(--txt-label)` |

Nos demais lugares onde aparece `color:var(--muted)` ou `color:var(--text)` em regras de texto corrido, substitua por `var(--txt-detalhe)` e `var(--txt-principal)` respectivamente.

**Passo C — Corrigir a lógica do toggle em `alternarTema()`:**

A lógica atual alterna `data-tema="claro"`. Com a nova estrutura, deve alternar `data-tema="escuro"`. Substitua a função:

```js
function alternarTema() {
  const body = document.body;
  const btn = document.getElementById('btn-tema');
  const escuro = body.getAttribute('data-tema') === 'escuro';
  if (escuro) {
    body.removeAttribute('data-tema');
    btn.textContent = '🌙 Escuro';
    try { localStorage.setItem('laadv_tema', 'claro'); } catch(e) {}
  } else {
    body.setAttribute('data-tema', 'escuro');
    btn.textContent = '☀ Claro';
    try { localStorage.setItem('laadv_tema', 'escuro'); } catch(e) {}
  }
}
```

**Passo D — Corrigir o IIFE de restauração do tema:**

```js
(function() {
  try {
    const t = localStorage.getItem('laadv_tema');
    if (t === 'escuro') {
      document.body.setAttribute('data-tema', 'escuro');
      const btn = document.getElementById('btn-tema');
      if (btn) btn.textContent = '☀ Claro';
    }
  } catch(e) {}
})();
```

---

## Parte 2 — Remover métricas internas do header

### 2.1 Remover do HTML

Localize e **remova** completamente estas linhas do header:

```html
<span class="q-chip" id="header-q">Q=—</span>
<span class="q-chip" id="header-ic">IC=—</span>
```

```html
<span class="ake-badge">AKE/UFT-1.0</span>
```

### 2.2 Remover do CSS

Remova a regra:
```css
.ake-badge{background:var(--gold);color:var(--teal);padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.8px}
.q-chip{font-size:11px;opacity:.8;font-family:'Courier New',monospace}
```

### 2.3 Manter a lógica JS intacta

A função `updateKernelMetrics()` chama `document.getElementById('header-q')` e `document.getElementById('header-ic')`. Como os elementos foram removidos, `getElementById` retornará `null` e as linhas de atribuição não terão efeito — **não há erro**. Não modifique a função.

---

## Parte 3 — Renomear a plataforma

Substitua todas as ocorrências de `"Plataforma Axiomática"` e `"Plataforma Axiomática de Cálculo Jurídico-Financeiro"` por `"Calculadora Jurídica"`:

| Local | Antes | Depois |
|-------|-------|--------|
| `<title>` | `LAADV — Plataforma Axiomática de Cálculo Jurídico-Financeiro v1.9.0` | `LAADV — Calculadora Jurídica v1.9.0` |
| `.hd-title` | `LAADV — Plataforma Axiomática` | `LAADV — Calculadora Jurídica` |
| `.hd-sub` | `Cálculo Jurídico-Financeiro · AKE/UFT-1.0 · v1.9.0` | `Cálculo Consignado · RMC/RCC · v1.9.0` |
| boot log | `LAADV Plataforma Axiomática de Cálculo Jurídico-Financeiro v1.9.0` | `LAADV Calculadora Jurídica v1.9.0` |

---

## Parte 4 — Reordenar abas

Localize o bloco de botões de abas:

```html
<button class="tab-btn active" onclick="switchTab('extratos',this)">📂 Extratos</button>
<button class="tab-btn" onclick="switchTab('calcular',this)">⚙ Calcular</button>
<button class="tab-btn" onclick="switchTab('comparativo',this)">⚖ Comparativo</button>
<button class="tab-btn" onclick="switchTab('relatorio',this)">📄 Relatório</button>
<button class="tab-btn" onclick="switchTab('kernel',this)">📊 Sistema</button>
<button class="tab-btn" onclick="switchTab('pecas',this)">📜 Peças</button>
```

Troque a ordem das duas últimas — Peças antes de Sistema:

```html
<button class="tab-btn active" onclick="switchTab('extratos',this)">📂 Extratos</button>
<button class="tab-btn" onclick="switchTab('calcular',this)">⚙ Calcular</button>
<button class="tab-btn" onclick="switchTab('comparativo',this)">⚖ Comparativo</button>
<button class="tab-btn" onclick="switchTab('relatorio',this)">📄 Relatório</button>
<button class="tab-btn" onclick="switchTab('pecas',this)">📜 Peças</button>
<button class="tab-btn" onclick="switchTab('kernel',this)">📊 Sistema</button>
```

Nada mais muda — os `id` dos `tab-pane` e o conteúdo permanecem iguais.

---

## Critério de aceite

- [ ] Toggle "🌙 Escuro" no header ativa tema escuro visualmente — fundo escuro, cards escuros, inputs escuros
- [ ] Toggle "☀ Claro" volta ao tema claro (branco/cinza)
- [ ] Preferência persiste após F5
- [ ] `Q=`, `IC=` e `AKE/UFT-1.0` não aparecem no header
- [ ] Título da aba do browser: "LAADV — Calculadora Jurídica v1.9.0"
- [ ] Header mostra "LAADV — Calculadora Jurídica"
- [ ] Ordem das abas: Extratos · Calcular · Comparativo · Relatório · **Peças · Sistema**
- [ ] Sem erros no console (verificar updateKernelMetrics com elementos removidos)
- [ ] Visual claro idêntico ao v1.9.0 (nenhuma regressão no tema padrão)

---

## Entrega

```
git add LAADV_Calculadora_Juridica_v1.html
git commit -m "fix(TASK-012): dark mode funcional, header limpo, abas reordenadas, renomeação"
git push origin claude/work-ui-polish
```

---

*AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MÓDULO: PROMPT_TASK_012*
