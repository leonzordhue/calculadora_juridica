# PROMPT — Claude-Work (Opus 4.7) | TASK-008 — Modo Noturno
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Execute esta task completa.
> Projeto: LAADV Plataforma Axiomática de Cálculo Jurídico-Financeiro · v1.8.0

---

## Contexto do Projeto

Repositório: https://github.com/leonzordhue/calculadora_juridica.git
Estrutura atual:
```
LAADV_Calculadora_Juridica_v1.html   ← HTML + inline <script> de UI
core/library.js                       ← ROM: Object.freeze
core/financial-alu.js                 ← FinancialEngine
core/ake-kernel.js                    ← AKEKernel + UIState
core/legal-cpu.js                     ← LegalCPU
core/petition-engine.js               ← PetitionEngine
io/bradesco-parser.js                 ← BradescoParser
io/inss-parser.js                     ← INSSParser + detectarTipo
render/report-builder.js              ← ReportBuilder
```

Plataforma: HTML puro, GitHub Pages — sem build step, sem bundler. Tudo via `window.*`.

---

## TASK-008 — Modo Noturno (Dark Mode Toggle)

### Branch
```
git checkout main
git pull origin main
git checkout -b claude/work-dark-mode
```

### Arquivos que você DEVE tocar
- `LAADV_Calculadora_Juridica_v1.html`

### Arquivos que você NÃO deve tocar
- Qualquer arquivo em `core/`, `io/`, `render/`

---

### O que implementar

#### A) Variáveis CSS de tema (no `<style>`)

Substitua as ocorrências de cores hardcoded para variáveis CSS. Defina dois temas no `:root`:

```css
:root {
  /* Tema claro (padrão) */
  --bg-principal: #0D1B2A;
  --bg-card: #050D1A;
  --bg-card2: #0A1628;
  --bg-input: #0A1628;
  --txt-principal: #C0D0D0;
  --txt-detalhe: #8BC4C4;
  --txt-label: #8BC4C4;
  --border-card: #1A3A5C;
  --border-input: #1A3A5C;
}

[data-tema="claro"] {
  --bg-principal: #F4F6F9;
  --bg-card: #FFFFFF;
  --bg-card2: #EEF2F7;
  --bg-input: #FFFFFF;
  --txt-principal: #1A2B3C;
  --txt-detalhe: #3A5A7A;
  --txt-label: #3A5A7A;
  --border-card: #CDD6DF;
  --border-input: #CDD6DF;
}
```

**Importante:** o tema escuro é o padrão (`:root`). O tema claro é ativado por `data-tema="claro"` no `<body>`. Isso preserva o visual existente por defeito.

Substitua nas regras CSS existentes:
- Fundo `#0D1B2A` → `var(--bg-principal)`
- Fundo `#050D1A` → `var(--bg-card)`
- Fundo `#0A1628` → `var(--bg-card2)` e `var(--bg-input)`
- Cor texto `#C0D0D0` → `var(--txt-principal)`
- Cor texto `#8BC4C4` → `var(--txt-detalhe)` ou `var(--txt-label)`
- Bordas `#1A3A5C` → `var(--border-card)` ou `var(--border-input)`

Não tente converter TODAS as cores — concentre nas regras de `body`, `.card`, `.section`, `input`, `select`, `textarea`, `label`. Cores de botões de ação (dourado `#C9A93E`, teal `#64DFDF`, vermelho `#C0392B`) ficam fixas — são semânticas, não dependem do tema.

#### B) Botão de toggle no cabeçalho

Localize o cabeçalho (`<header>` ou `<div class="header">`). Adicione, dentro do header, próximo ao lado direito:

```html
<button id="btn-tema" onclick="alternarTema()" 
  title="Alternar modo claro/escuro"
  style="background:transparent;border:1px solid var(--border-card);border-radius:20px;
         padding:4px 12px;color:var(--txt-detalhe);cursor:pointer;font-size:12px;
         font-family:inherit;transition:all .2s">
  ☀ Claro
</button>
```

#### C) Função `alternarTema()` no inline `<script>`

```js
function alternarTema() {
  const body = document.body;
  const btn = document.getElementById('btn-tema');
  const temaAtual = body.getAttribute('data-tema');
  if (temaAtual === 'claro') {
    body.removeAttribute('data-tema');
    btn.textContent = '☀ Claro';
    try { localStorage.setItem('laadv_tema', 'escuro'); } catch(e) {}
  } else {
    body.setAttribute('data-tema', 'claro');
    btn.textContent = '🌙 Escuro';
    try { localStorage.setItem('laadv_tema', 'claro'); } catch(e) {}
  }
}
```

#### D) Carregar tema salvo no boot

Localize a função de boot (onde `PerfilStorage.carregar()` é chamado) e adicione antes dela:

```js
// Carregar tema salvo
(function() {
  try {
    const t = localStorage.getItem('laadv_tema');
    if (t === 'claro') {
      document.body.setAttribute('data-tema', 'claro');
      const btn = document.getElementById('btn-tema');
      if (btn) btn.textContent = '🌙 Escuro';
    }
  } catch(e) {}
})();
```

---

### Critério de aceite

- [ ] Botão visível no cabeçalho
- [ ] Click alterna entre escuro (padrão) e claro
- [ ] Preferência persiste após F5 via localStorage
- [ ] Visual escuro idêntico ao v1.8.0 (não regredir)
- [ ] Visual claro legível — sem texto invisível sobre fundo claro
- [ ] Cores de ação (dourado, teal, vermelho) mantidas em ambos os temas
- [ ] Sem erros no console

---

### Entrega

```
git add LAADV_Calculadora_Juridica_v1.html
git commit -m "feat(TASK-008): modo noturno/claro — toggle no header com persistência localStorage"
git push origin claude/work-dark-mode
```

---

*AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MÓDULO: PROMPT_TASK_008*
