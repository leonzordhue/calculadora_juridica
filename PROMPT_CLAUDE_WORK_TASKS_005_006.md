# PROMPT — Claude-Work (Opus 4.7) | TASK-005 + TASK-006
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Execute ambas as tasks neste arquivo.
> Você roda no Opus 4.7. Essas tasks exigem raciocínio técnico aprofundado — sem pressa.

---

## CONTEXTO DO PROJETO

Repositório: https://github.com/leonzordhue/calculadora_juridica.git
Estrutura atual (v1.7.0):
```
LAADV_Calculadora_Juridica_v1.html   ← HTML + script inline de UI
core/library.js                       ← ROM: índices + ESCRITORIOS + LIBRARY_META
core/financial-alu.js                 ← FinancialEngine: matemática pura
core/ake-kernel.js                    ← AKEKernel + UIState + kernel
core/legal-cpu.js                     ← LegalCPU: orquestração de cálculo
core/petition-engine.js               ← PetitionEngine: 3 templates de peça
io/bradesco-parser.js                 ← BradescoParser
io/inss-parser.js                     ← INSSParser
render/report-builder.js              ← ReportBuilder + PDF + RTF
```

Protocolo:
- Você trabalha em branches próprias
- Nunca faz merge em main — Principal integra
- Commits atômicos com prefixo feat/fix/refactor/docs/test

---

## TASK-005 — AKEKernel: Supervisor Real (IC Blocker)

### Branch
```
git checkout main
git pull origin main
git checkout -b claude/work-kernel-supervisor
```

### Arquivo: `core/ake-kernel.js`

**Problema atual:** `kernel.calcIC()` existe mas não bloqueia nada. O Axioma A2 diz que nenhum WRITEBACK ocorre com IC < 0.9. Hoje é só cosmético.

**O que IC mede na prática:**

IC é a razão `sucessos / total_operações`. O AKEKernel registra:
- `registrarSucesso(id)` → incrementa `_success` e `_total`
- `registrarFalha(id)` → incrementa apenas `_total` e `_bugs`

O IC cai quando operações falham (fetch BACEN falhou, campo inválido, cálculo estourou, etc.).

**O que implementar:**

#### A) Método `assertIC(contexto)` no AKEKernel

```js
assertIC(contexto = '') {
  const ic = this.calcIC();
  if (ic < LIBRARY.JURIDICO.IC_MIN) {
    const msg = `WRITEBACK BLOQUEADO — IC: ${ic.toFixed(2)} < ${LIBRARY.JURIDICO.IC_MIN} [${contexto}]`;
    this.registrarBuild('IC_BLOCK', msg);
    throw new Error(msg);
  }
  return ic;
}
```

#### B) Método `registrarErroCalculo(id, motivo)` — registra falha com detalhes

```js
registrarErroCalculo(id, motivo) {
  this._total++;
  this._bugs++;
  this._ax_t++;
  this._probs.push(0);
  this._n++;
  this.registrarBuild('CALC_ERROR', `[${id}] ${motivo}`);
}
```

#### C) Bloco de UI para exibir bloqueio — adicionar método `exibirBloqueioIC(erro, elementoId)`

```js
exibirBloqueioIC(erro, elementoId) {
  const el = document.getElementById(elementoId);
  if (!el) return;
  const ic = this.calcIC();
  el.innerHTML = `
    <div style="background:#C0392B;color:#fff;border-radius:10px;padding:20px 24px;margin-top:16px">
      <div style="font-size:16px;font-weight:700;margin-bottom:8px">
        ⛔ WRITEBACK BLOQUEADO — IC: ${ic.toFixed(2)} (mínimo: ${LIBRARY.JURIDICO.IC_MIN})
      </div>
      <div style="font-size:12px;opacity:.9">${erro.message}</div>
      <div style="font-size:11px;opacity:.7;margin-top:6px">
        Corrija os erros acima e recalcule para liberar o resultado.
      </div>
    </div>`;
  el.classList.remove('hidden');
}
```

#### D) Integrar o bloqueio nas funções de cálculo do `core/legal-cpu.js`

Nas funções `executarCalculo()` e `calcularConsignado()`, envolva o bloco de WRITEBACK (onde o resultado é exibido ao usuário) em try/catch:

```js
// Antes de renderizar o resultado:
try {
  kernel.assertIC('WRITEBACK');
} catch(e) {
  kernel.exibirBloqueioIC(e, 'resultado-id-do-elemento');
  return;
}
// ... renderiza resultado normalmente
```

Localize no `legal-cpu.js` os pontos onde `document.getElementById('resultado')` fica visível (busque por `.classList.remove('hidden')` nos elementos de resultado) e adicione o `assertIC` antes.

#### E) Registrar falhas nos lugares certos do legal-cpu.js

Nos blocos `catch` existentes das funções de cálculo, substitua `kernel.registrarBuild('ERR', ...)` por `kernel.registrarErroCalculo(...)`:

```js
// Antes:
kernel.registrarBuild('BACEN_ERR', err.message);
// Depois:
kernel.registrarErroCalculo('BACEN', err.message);
```

### Entrega TASK-005
```
git add core/ake-kernel.js core/legal-cpu.js
git commit -m "feat(TASK-005): AKEKernel supervisor real — assertIC bloqueia WRITEBACK < 0.9"
git push origin claude/work-kernel-supervisor
```

---

## TASK-006 — Sanity Tests: numExtenso / calcPMT / acumularIndice

### Branch (pode fazer na mesma sessão, após TASK-005)
```
git checkout main
git pull origin main
git checkout -b claude/work-sanity-tests
```

### Criar: `tests/sanity.html`

Arquivo HTML standalone que carrega os módulos LAADV e executa assertions.
Abre no browser via `http://localhost:8080/tests/sanity.html`.

**Estrutura do arquivo:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>LAADV — Sanity Tests</title>
  <!-- Carregar módulos na ordem correta -->
  <script src="../core/library.js"></script>
  <script src="../core/financial-alu.js"></script>
  <script src="../core/ake-kernel.js"></script>
  <script src="../core/petition-engine.js"></script>
  <style>
    body { font-family: monospace; background: #0D1B2A; color: #C0D0D0; padding: 24px; }
    h1 { color: #C9A93E; }
    h2 { color: #64DFDF; margin-top: 24px; }
    .pass { color: #00FF88; }
    .fail { color: #FF6B6B; font-weight: bold; }
    .info { color: #8BC4C4; font-size: 11px; }
    .suite { background: #050D1A; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    #summary { font-size: 18px; margin-top: 24px; padding: 16px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>LAADV — Sanity Test Suite · AKE/UFT-1.0</h1>
  <div id="output"></div>
  <div id="summary"></div>
  <script>
  // ... implementação abaixo
  </script>
</body>
</html>
```

**Implementação do runner:**

```js
const results = { pass: 0, fail: 0, errors: [] };

function assert(descricao, obtido, esperado, tolerancia = 0) {
  const ok = tolerancia > 0
    ? Math.abs(obtido - esperado) <= tolerancia
    : obtido === esperado;
  if (ok) {
    results.pass++;
    log(`<span class="pass">✓ PASS</span> ${descricao}`);
  } else {
    results.fail++;
    results.errors.push(descricao);
    log(`<span class="fail">✗ FAIL</span> ${descricao}<br>
         <span class="info">   esperado: ${esperado} | obtido: ${obtido}</span>`);
  }
}

function log(html) {
  document.getElementById('output').innerHTML += html + '<br>';
}
```

**Casos de teste obrigatórios:**

```js
// ── numExtenso ──────────────────────────────────────────────────────
log('<h2>numExtenso()</h2><div class="suite">');
assert('zero reais',         numExtenso(0),         'zero reais');
assert('um real',            numExtenso(1),         'um real');
assert('um centavo',         numExtenso(0.01),      'zero reais e um centavo');
assert('cem reais',          numExtenso(100),       'cem reais');
assert('mil reais',          numExtenso(1000),      'mil reais');
assert('mil e um reais',     numExtenso(1001),      'mil reais e um real');
assert('R$1.085',            numExtenso(1085),      'mil reais e oitenta e cinco reais');
assert('R$23.562,25',        numExtenso(23562.25),  'vinte e três mil quinhentos e sessenta e dois reais e vinte e cinco centavos');
assert('um milhão',          numExtenso(1000000),   'um milhão de reais');
assert('R$1.500.000',        numExtenso(1500000),   'um milhão e quinhentos mil reais');
log('</div>');

// ── calcPMT ─────────────────────────────────────────────────────────
log('<h2>calcPMT(pv, iMensal, n)</h2><div class="suite">');
// PMT(10000, 2%, 24) — calculado manualmente: 10000*0.02/(1-(1.02)^-24) = 529.05
assert('PMT(10000, 0.02, 24)', calcPMT(10000, 0.02, 24), 529.05, 0.5);
// PMT(5000, 1.5%, 12)
assert('PMT(5000, 0.015, 12)', calcPMT(5000, 0.015, 12), 462.96, 0.5);
// Taxa zero — PMT = PV/n
assert('PMT taxa zero',        calcPMT(1200, 0, 12), 100, 0.01);
log('</div>');

// ── FinancialEngine.acumularIndice ───────────────────────────────────
log('<h2>FinancialEngine.acumularIndice()</h2><div class="suite">');
// IPCA jan-dez/2023: acumulado real = ~4.62%
const fatorIPCA2023 = FinancialEngine.acumularIndice('IPCA', '2023-01-01', '2024-01-01');
assert('IPCA 2023 fator entre 1.040 e 1.060',
  fatorIPCA2023 >= 1.040 && fatorIPCA2023 <= 1.060, true);
log(`<span class="info">   fator obtido: ${fatorIPCA2023.toFixed(6)}</span>`);

// INPC: fator deve ser > 1.0 e < 2.0 para qualquer período razoável
const fatorINPC = FinancialEngine.acumularIndice('INPC', '2022-01-01', '2023-01-01');
assert('INPC 2022 fator > 1.0', fatorINPC > 1.0, true);
assert('INPC 2022 fator < 2.0', fatorINPC < 2.0, true);
log(`<span class="info">   fator obtido: ${fatorINPC.toFixed(6)}</span>`);

// Período de 1 mês
const fator1mes = FinancialEngine.acumularIndice('IPCA', '2024-01-01', '2024-02-01');
assert('IPCA jan/2024 ~0.42%', fator1mes, 1 + 0.0042, 0.001);
log('</div>');

// ── Resumo ───────────────────────────────────────────────────────────
const sumEl = document.getElementById('summary');
const ok = results.fail === 0;
sumEl.style.background = ok ? '#1A4731' : '#4A1A1A';
sumEl.innerHTML = `
  ${ok ? '✅' : '❌'} ${results.pass} PASS · ${results.fail} FAIL
  ${results.errors.length ? '<br><span style="font-size:12px">Falhas: ' + results.errors.join(', ') + '</span>' : ''}
`;
```

**Nota importante sobre `numExtenso(1085)`:**
Verifique o resultado real antes de fixar o expected. Se o código retornar `'mil e oitenta e cinco reais'` ou `'mil oitenta e cinco reais'`, ajuste o expected para o que o código retorna (o objetivo é detectar regressões, não testar PT-BR teórico). Use o console do browser para verificar cada caso antes de fixar.

### Entrega TASK-006
```
git add tests/sanity.html
git commit -m "test(TASK-006): sanity tests — numExtenso, calcPMT, acumularIndice"
git push origin claude/work-sanity-tests
```

---

## Ordem de execução recomendada

1. TASK-005 primeiro (modifica JS existente — mais impacto)
2. TASK-006 depois (cria arquivo novo — isolado)
3. Push de ambas as branches quando prontas
4. NÃO faça merge em main — Principal integra

---

*AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: PROMPT_CLAUDE_WORK_TASKS_005_006*
