# PROMPT — Claude-Work (Opus 4.7) | TASK-014 — Deep Audit: Bug Hunt & Quality Pass
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Execute esta task completa.
> Projeto: LAADV Calculadora Jurídica · v1.9.2

---

## Missão

Realizar auditoria técnica completa da plataforma. Ler todos os módulos do projeto,
identificar bugs, riscos de crash, falhas silenciosas, inconsistências de dados e
oportunidades de melhoria na análise de extratos e cálculos.

**Este é um trabalho de inspeção e correção — não de adição de features.**
Qualidade, robustez e confiabilidade são o único critério.

---

## Branch

```
git checkout main
git pull origin main
git checkout -b claude/work-audit-014
```

## Arquivos que você PODE tocar

- `core/financial-alu.js`
- `core/legal-cpu.js`
- `core/ake-kernel.js`
- `core/petition-engine.js`
- `io/bradesco-parser.js`
- `io/inss-parser.js`
- `io/itau-parser.js`
- `io/bb-parser.js`
- `io/caixa-parser.js`
- `render/report-builder.js`
- `LAADV_Calculadora_Juridica_v1.html`
- `tests/sanity.html`

## Arquivos que você NÃO deve tocar

- `core/library.js` — ROM é imutável por protocolo (Axioma A1)
- `AKE_WORKLOG.md`, `AKE_TASKS.md`, `PROMPT_*.md`

---

## Metodologia obrigatória

Para cada módulo, siga este protocolo antes de tocar qualquer código:

```
1. Ler o arquivo completo
2. Listar todos os problemas encontrados com linha de referência
3. Classificar: CRASH | SILENCIOSO | DEGRADAÇÃO | MELHORIA
4. Implementar correções em ordem de severidade (CRASH primeiro)
5. Verificar que nenhuma correção quebra outro módulo
```

Ao final, registre no commit message todos os bugs corrigidos com numeração.

---

## Alvo 1 — `core/financial-alu.js`

### Suspeitos confirmados pelo Principal:

**BUG-01 — `calcPMT(pv, 0, 0)` retorna Infinity**
```
calcPMT(pv, iMensal, n):
  - Se iMensal=0 → retorna pv/n → se n=0 também, retorna Infinity
  - Se iMensal≠0 e n=0 → denominador = 1 - Math.pow(1+i, 0) = 1-1 = 0 → Infinity
```
Corrija com guard: `if(!n || n<=0) return 0;`

**BUG-02 — `acumularIndice()` — mês ausente na LIBRARY retorna fator silencioso**
```
const taxa = tbl[chave];
// Se chave não existe: taxa = undefined
// undefined aplicado em cálculo aritmético → NaN propagado silenciosamente
```
Verifique a linha seguinte a `const taxa=tbl[chave]`. Se não houver guard explícito
para `taxa===undefined`, adicione: skip o mês (mantém fator 1) e registre warning no kernel.

**BUG-03 — `acumularIndice()` com período pré-dados**
Se o usuário informar `dataInicio` anterior ao primeiro mês disponível na LIBRARY
(ex: 2010-01 mas IPCA começa em 2015), o loop itera sem encontrar nenhum mês válido
e retorna 1.0 silenciosamente — sem avisar que o índice está incompleto.
Adicione ao log do kernel: `kernel.registrarBuild('IDX_WARN', ...)` nesses casos.

**MELHORIA-01 — Normalização de acentos no matching de keywords**
Em `classificarRubrica()` (HTML) e em todos os parsers, o match usa `.toUpperCase()`.
Isso faz `"AÇÃO"` não casar com `"ACAO"`. Crie uma função utilitária em `financial-alu.js`
e exporte via `window.*`:
```js
function normalizarTexto(str) {
  return (str || '').toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
window.normalizarTexto = normalizarTexto;
```
Aplique-a em `classificarRubrica()` no HTML e nos parsers que fazem comparação textual.

---

## Alvo 2 — `core/legal-cpu.js`

### Suspeitos confirmados pelo Principal:

**BUG-04 — `buscarTaxaMedia()` sem timeout — fetch pode travar indefinidamente**
```js
const resp = await fetch(url);  // sem AbortController, sem timeout
```
A API BACEN pode não responder. Adicione timeout de 12 segundos:
```js
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 12000);
try {
  const resp = await fetch(url, { signal: ctrl.signal });
  clearTimeout(timer);
  // ... resto do código
} catch(err) {
  clearTimeout(timer);
  if (err.name === 'AbortError') throw new Error('Timeout: API BACEN não respondeu em 12s. Tente novamente.');
  throw err;
}
```

**BUG-05 — `buscarTaxaMedia()` — média simples quando API retorna múltiplos registros por mês**
`dados.reduce((s,d)=>s+parseFloat(d.valor),0)/dados.length` usa média aritmética simples.
Se a API retornar N registros para um mesmo mês (registros diários), a divisão por N
está correta, mas verifique se os `parseFloat(d.valor)` retornam NaN para registros
inválidos e se isso contamina a média. Adicione filtro:
```js
const validos = dados.filter(d => !isNaN(parseFloat(d.valor)));
if(!validos.length) throw new Error('Nenhum dado válido retornado pela API BACEN.');
const media = validos.reduce((s,d)=>s+parseFloat(d.valor),0)/validos.length;
```

**BUG-06 — `atualizarTotalRMCRCC` listener acumula a cada `renderTransacoes()`**
```js
body.addEventListener('change', atualizarTotalRMCRCC, {once:false});
```
Cada chamada a `renderTransacoes()` adiciona um novo listener ao mesmo elemento.
Com 3 imports seguidos, o evento dispara 3 vezes por checkbox. Corrija:
```js
body.removeEventListener('change', atualizarTotalRMCRCC);
body.addEventListener('change', atualizarTotalRMCRCC);
```

**BUG-07 — `enviarParaCalcular()` descarta transações selecionadas silenciosamente**
Quando o usuário seleciona múltiplas transações e clica "Enviar para Calcular",
apenas `sel[0]` preenche os campos. As demais são ignoradas sem aviso.
Adicione alerta informativo se `sel.length > 1`:
```js
if(sel.length > 1) {
  // mostra aviso não-bloqueante (não alert()) abaixo do botão
  const aviso = document.getElementById('lote-aviso') || (() => {
    // fallback: kernel log
    kernel.registrarBuild('UI_WARN', `${sel.length} transações selecionadas: apenas a primeira foi enviada ao Calcular Individual. Use "Calcular em Lote" para processar todas.`);
  })();
}
```

**MELHORIA-02 — Feedback visual para taxa BACEN offline**
Se o usuário estiver offline, `fetch` lança TypeError antes mesmo do timeout.
O catch atual trata o erro mas a mensagem pode não ser clara. Melhore o fallback:
```js
if(!navigator.onLine) throw new Error('Sem conexão com a internet. A taxa média BACEN não pode ser consultada offline.');
```

---

## Alvo 3 — `io/` (parsers)

Leia todos os 5 parsers e audite:

### Checklist por parser:

**Para cada um dos 5 parsers, verifique:**

- [ ] O que acontece se o PDF tiver 0 páginas? (`pdf.numPages === 0`)
- [ ] O que acontece se `getTextContent()` retornar items vazio?
- [ ] O que acontece se todas as linhas forem rejeitadas pelo regex?
- [ ] O array de resultado pode ser `undefined` em vez de `[]`?
- [ ] Valores monetários com formato diferente são silenciosamente descartados?

**BUG-08 — `detectarTipo()` — ambiguidade textual**
Um PDF do Bradesco que contenha a palavra "CAIXA" no cabeçalho (ex: "CAIXA DE LIQUIDAÇÃO")
pode ser classificado como `'CAIXA'` indevidamente. Reforce os marcadores:
- CAIXA: exigir `'CAIXA ECONOMICA'` ou `'CAIXA FEDERAL'` (não apenas `'CAIXA'`)
- BB: verificar também `'BANCO DO BRASIL'`
Revise os marcadores de todos os bancos para minimizar falsos positivos.

**BUG-09 — Parsers Itaú/BB/Caixa — ausência de guard para PDF vazio**
Verifique se existe guard `if(!pdf || pdf.numPages === 0) return [];` no topo de cada `parse()`.
Se não existir, `pdf.getPage(1)` em PDF vazio lança exceção não tratada que chega
ao usuário como mensagem críptica do PDF.js.

**BUG-10 — `INSSParser` — código de rubrica não encontrado em INSS_CODES**
```js
if(it._code && LIBRARY.INSS_CODES[it._code]) {
  cat = LIBRARY.INSS_CODES[it._code]; // código conhecido
} else {
  // fallback por keywords — cobre apenas rubricas mapeadas
}
```
Se o INSS incluir uma rubrica nova (ex: código '450'), ela cai no fallback de keywords
e pode ser classificada como 'OUTROS'. Isso é comportamento correto, mas o advogado
não sabe que existe um código não mapeado. Registre no kernel:
```js
if(it._code && !LIBRARY.INSS_CODES[it._code]) {
  kernel.registrarBuild('IDX_WARN', `Rubrica INSS desconhecida: código ${it._code} — classificado via keywords`);
}
```

**MELHORIA-03 — Aplicar `normalizarTexto()` nos parsers**
Após criar `normalizarTexto()` no Alvo 1, substitua `.toUpperCase()` pelo uso da função
nos trechos de comparação com keywords em todos os parsers.

---

## Alvo 4 — `core/ake-kernel.js`

**VERIFICAR — `calcEntropy()` com `_probs` vazio**
A função já tem guard `if (!this._probs.length) return 0` — verifique se está presente.
Se não estiver, `Math.log2(0)` retorna `-Infinity`, contaminando o IC.

**VERIFICAR — `assertIC()` — denominador zero**
`_ax_t` começa em 1 e incrementa — divisão por zero não é possível com o estado atual.
Confirme e documente no código com comentário: `// _ax_t inicia em 1 — divisão por zero impossível`.

**MELHORIA-04 — `registrarBuild()` com timestamp**
As entradas do build log atualmente não têm timestamp de hora:minuto. Para sessões longas,
é difícil correlacionar eventos. Adicione HH:MM:SS no início de cada log entry se ainda não existir.

---

## Alvo 5 — `core/petition-engine.js`

**BUG-11 — `numExtenso()` com valor negativo**
Se `calcularConsignado()` retornar um excesso negativo (valor pago MENOR que o correto),
e esse valor for passado para `numExtenso()`, o comportamento é indefinido.
Adicione guard:
```js
function numExtenso(valor) {
  if (valor < 0) return 'valor negativo — verifique os dados';
  if (!isFinite(valor) || isNaN(valor)) return 'valor inválido';
  // ... resto
}
```

**BUG-12 — `numExtenso(0)` — verificar output**
`numExtenso(0.00)` deve retornar `"zero reais"`. Rastreie o fluxo: `integer(0)` retorna `'zero'`,
mas a construção `"X reais e Y centavos"` pode produzir `"zero reais e zero centavos"` em
vez de simplesmente `"zero reais"`. Corrija para retornar apenas `"zero reais"` quando ambos
reais e centavos são 0.

**VERIFICAR — `VALIDATE()` — campos críticos sem validação**
Verifique se os campos `pet-cliente-cpf`, `pet-valor-causa`, `pet-banco-reu` são validados
antes do WRITEBACK. Se faltarem, adicione ao array de campos obrigatórios.

---

## Alvo 6 — `LAADV_Calculadora_Juridica_v1.html`

**BUG-13 — `classificarRubrica(t.desc)` com `t.desc` null/undefined**
Em lançamentos manuais (`_manual: true`), `t.desc` pode ser uma string vazia `""` ou null.
A função já tem guard `if(!desc...)` — verifique se está funcionando para `""` e `null`.
Confirme que `renderTransacoes` nunca quebra ao iterar lançamentos manuais.

**BUG-14 — IIFE de restauração de tema acessa `btn-tema` antes do DOM estar pronto**
```js
(function() {
  const btn = document.getElementById('btn-tema');
  if (btn) btn.textContent = '☀ Claro';
})();
```
Se o script estiver no `<head>` e executar antes do DOM estar parseado, `getElementById`
retorna `null`. O guard `if(btn)` protege — mas verifique a posição real do IIFE no arquivo.
Se estiver antes do `<body>`, mova para o final do `<body>` ou envolva em `DOMContentLoaded`.

**BUG-15 — `renderTransacoes([])` com array vazio**
Se o PDF for importado mas nenhuma transação for extraída (PDF incompatível ou corrompido),
`txns = []` é passado para `renderTransacoes`. Verifique:
- `chips.innerHTML` com array vazio — deve mostrar mensagem "Nenhuma transação encontrada"
- `body.innerHTML` com array vazio — deve mostrar uma linha informativa, não uma tabela vazia

**MELHORIA-05 — Chips de sumário por rubrica**
Atualmente `summary-chips` mostra contagem por `categoria` (RMC: 3, TARIFA: 7, etc.).
Adicione uma segunda linha de chips mostrando as rubricas detectadas:
```
[RMC 3] [SEGURO_CARTAO 2] [TIT_CAP 1] [— 12]
```
Isso dá ao advogado uma visão rápida das rubricas antes de rolar a tabela.

**MELHORIA-06 — Filtro de rubrica na tabela**
Adicione um `<select>` simples acima da tabela com opção "Todas as rubricas" e as rubricas
detectadas como opções. Ao selecionar, filtrar as linhas exibidas sem reprocessar os dados.
Use `body._txns` (já disponível) como fonte. Implementação sem dependências externas:
```js
function filtrarPorRubrica(rubricaSelecionada) {
  const txns = document.getElementById('txn-body')._txns || [];
  const filtradas = rubricaSelecionada === ''
    ? txns
    : txns.filter(t => t.rubrica === rubricaSelecionada);
  renderTransacoes(filtradas);
}
```
O select deve ser populado dinamicamente após cada import, listando apenas as rubricas
presentes no lote atual.

---

## Alvo 7 — `render/report-builder.js`

**BUG-16 — RTF export com caracteres especiais corrompidos**
O RTF usa codificação ANSI/Latin-1 por padrão. Caracteres como `ã`, `ç`, `ê`, `õ` precisam
ser codificados como `\\'e3`, `\\'e7`, etc. Verifique se a função de export RTF aplica
essa codificação. Se não aplicar, o Word exibirá os caracteres corrompidos.
Implemente ou corrija a função de escape RTF:
```js
function escapeRTF(str) {
  return (str || '').replace(/[^\x00-\x7F]/g, c => {
    const code = c.charCodeAt(0);
    return code < 256 ? `\\'${code.toString(16).padStart(2,'0')}` : `\\u${code}?`;
  });
}
```
Aplique em todos os campos de texto antes de inserir no buffer RTF.

**VERIFICAR — jsPDF não carregado**
Se o CDN do jsPDF estiver indisponível, `typeof jspdf === 'undefined'` deve ser checado
antes de qualquer chamada de export PDF. Verifique se existe esse guard. Se não existir,
adicione com mensagem de erro clara ao usuário.

---

## Alvo 8 — `tests/sanity.html`

**MELHORIA-07 — Expandir suite de testes**
A suite atual (TASK-006) tem 17 assertions: numExtenso, calcPMT, acumularIndice.
Adicione os seguintes testes:

```js
// calcPMT — edge cases
assert(calcPMT(5000, 0, 0) === 0, 'PMT: pv=5000, i=0, n=0 → 0 (não Infinity)');
assert(calcPMT(1000, 0.015, 0) === 0, 'PMT: n=0 → 0 (não Infinity)');
assert(!isNaN(calcPMT(10000, 0.02, 24)), 'PMT: resultado válido para params normais');

// numExtenso — edge cases
assert(numExtenso(0) === 'zero reais', 'numExtenso: zero');
assert(typeof numExtenso(-1) === 'string', 'numExtenso: negativo não crasha');
assert(!numExtenso(Infinity).includes('undefined'), 'numExtenso: Infinity tratado');

// normalizarTexto (após MELHORIA-01)
assert(normalizarTexto('Ação') === 'ACAO', 'normalizarTexto: acento removido');
assert(normalizarTexto('') === '', 'normalizarTexto: string vazia');
assert(normalizarTexto(null) === '', 'normalizarTexto: null seguro');

// acumularIndice — período sem dados
const fatorFuturo = FinancialEngine.acumularIndice('IPCA','2099-01','2099-06');
assert(fatorFuturo === 1.0, 'acumularIndice: período sem dados → 1.0 (não NaN)');
```

---

## Relatório de entrega

No commit message, liste todos os bugs corrigidos no formato:

```
fix(TASK-014): deep audit — N bugs corrigidos, M melhorias aplicadas

BUG-01: calcPMT guard n=0 → retorna 0 (era Infinity)
BUG-04: buscarTaxaMedia AbortController timeout 12s
BUG-06: removeEventListener antes de re-adicionar em renderTransacoes
BUG-08: detectarTipo marcadores reforçados (CAIXA ECONOMICA, BANCO DO BRASIL)
...
MELHORIA-01: normalizarTexto() com NFD accent strip
MELHORIA-05: chips de rubrica no sumário de extratos
...
```

---

## Critério de aceite

- [ ] Nenhum `Infinity` ou `NaN` pode chegar ao usuário sem tratamento
- [ ] `buscarTaxaMedia()` tem timeout de 12s com mensagem clara
- [ ] Listener `atualizarTotalRMCRCC` não acumula entre imports
- [ ] `detectarTipo()` não classifica erroneamente Bradesco como Caixa
- [ ] `numExtenso(0)` retorna `"zero reais"`; `numExtenso(-1)` não crasha
- [ ] RTF exporta `ã`, `ç`, `ê` corretamente
- [ ] `normalizarTexto()` existe e é usada nos parsers e em `classificarRubrica()`
- [ ] Suite de testes (`tests/sanity.html`) expandida e passando 100%
- [ ] Sem regressão em nenhum fluxo existente

---

## Entrega

```
git add -A
git commit -m "fix(TASK-014): deep audit — [lista de bugs]"
git push origin claude/work-audit-014
```

---

*AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MÓDULO: PROMPT_TASK_014*
