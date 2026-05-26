# PROMPT — Claude-Work (Opus 4.7) | TASK-013 — Classificação por Rubricas Jurídicas
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Execute esta task completa.
> Projeto: LAADV Calculadora Jurídica · v1.9.1

---

## Contexto e Motivação

O sistema atual classifica cada transação dos extratos com um `categoria` financeiro
(`RMC`, `RCC`, `TARIFA`, `SEGURO`, `JUROS`, `PARCELA`, `BX_FINAN`, `CARTAO_CREDITO`, `OUTROS`).
Essa classificação existe para o pipeline de cálculo (batch, totalizador RMC/RCC, envio ao Calcular).

Os advogados precisam de uma segunda camada de classificação: **rubricas jurídicas**.
São 27 códigos utilizados para identificar o tipo de cobrança abusiva em petições e laudos.
Cada transação do extrato precisa exibir a rubrica detectada automaticamente — ou ficar vazia
quando não houver match textual suficiente para uma classificação segura.

**Decisão arquitetural:** `categoria` não muda. `rubrica` é um campo adicional, independente,
que convive com o campo existente sem quebrar nenhuma lógica de cálculo.

---

## Branch

```
git checkout main
git pull origin main
git checkout -b claude/work-rubricas
```

## Arquivos que você DEVE tocar

- `core/library.js`
- `LAADV_Calculadora_Juridica_v1.html`

## Arquivos que você NÃO deve tocar

- `io/*` — parsers não mudam
- `render/*`
- `core/ake-kernel.js`
- `core/petition-engine.js`
- `core/financial-alu.js`
- `core/legal-cpu.js`

---

## Parte 1 — Adicionar `LIBRARY.RUBRICS` em `core/library.js`

### 1.1 Onde inserir

Dentro do `Object.freeze({...})` que define `LIBRARY`, após o bloco `KEYWORDS` e antes de `JURIDICO`.
O campo se chama `RUBRICS` e é um array ordenado de pares `[código, [padrões]]`.

**A ordem importa:** o algoritmo retorna o primeiro match. Padrões mais específicos devem vir
antes dos mais genéricos (ex: `SEGURO_CARTAO` antes de `SEGURO`; `MORA_CEL` antes de `MORA`;
`ANP` antes de `ANUIDADE`).

### 1.2 Conteúdo exato de `RUBRICS`

Insira o seguinte bloco **dentro** do `LIBRARY` (após `KEYWORDS`, antes de `JURIDICO`):

```js
RUBRICS: Object.freeze([
  /* ── ordem: mais específico → mais genérico ── */

  // Cartão / crédito consignado
  ['RMC',                   Object.freeze(['RMC','RESERVA DE MARGEM','CARTAO CONSIGNADO','CONSIG CART','CRED CONSIG CART','RES MARG CART','RESERVA MARG CONS'])],
  ['RCC',                   Object.freeze(['RCC','RESERVA CARTAO','CART CONSIG','CONSIGNADO CARTAO','CARTAO CONSIG','CONSIG CARTAO','CONSIGNACAO CARTAO','RCC CARTAO','DEB CART CONSIG'])],

  // Seguro — específico antes do genérico
  ['SEGURO_CARTAO',         Object.freeze(['SEGURO CARTAO','SEG CARTAO','PROTECAO CARTAO','ASSIST CARTAO','SEGURO CREDITO','SEG CAPIT','SEGPREST','SEG PREST'])],
  ['VIDA_PREV',             Object.freeze(['SEG VIDA','SEGURO VIDA','VIDA PREV','PREVIDENCIA','PREV PRIVADA','VIDA E PREV','PGTO PREVIDENCIA'])],
  ['SLN',                   Object.freeze(['SLN','SEGURO LIQUIDACAO','SEG LIQ','LIQUIDACAO CREDITO','LIQ CREDITO SEG','SEGURO LIQ'])],
  ['SEGURO',                Object.freeze(['SEGURO','PRESTAMISTA','PREMIO SEGURO'])],

  // Mora — específico antes do genérico
  ['MORA_CEL',              Object.freeze(['MORA CELULAR','MULTA CELULAR','ATRASO CEL','MORA CEL','MORA TEL'])],
  ['MORA',                  Object.freeze(['MORA','MULTA ATRASO','ENCARGO ATRASO','ENC MORA','MORA ATRASO'])],

  // Juros — específico antes do genérico
  ['JUROS_NC',              Object.freeze(['JUROS NC','JRS NC','JUROS NAO COMP','JRS NAO COMPENSADOS','ENCARGOS NC','JUROS NAO CONSIG'])],
  ['JUROS_ABUSIVOS',        Object.freeze(['JUROS ABUSIVO','JRS ABUSIVO','JUROS EXCESSO','COBRANCA JUROS ABUSIVO'])],

  // Tarifa — específico antes do genérico
  ['TARIFA_CAD',            Object.freeze(['TARIFA CADASTRO','TAR CADASTRO','TAXA CADASTRO','TAR CAD','TARIFA CAD','CADASTRO OPERACAO'])],
  ['TARIFA_IND',            Object.freeze(['TARIFA INDEVIDA','TAR INDEVIDA','TARIFA IND'])],
  ['CESTA',                 Object.freeze(['CESTA','CESTA BASICA','CESTA SERVICO','CESTA DE SERVICO','MENSALIDADE PACOTE','CLUBE BENEFICIO','CLUBE DE BENEFICIOS','CESTA SERVICOS'])],

  // Anuidade — específico antes do genérico
  ['ANP',                   Object.freeze(['ANP','ANUIDADE PARCELADA','PARC ANUIDADE','ANUIDADE PARC'])],
  ['ANUIDADE',              Object.freeze(['ANUIDADE','ANUIDADE CARTAO','TAXA ANUAL CARTAO','TAXA ANUAL'])],

  // Outros produtos e cobranças
  ['GASTO_C_CRED',          Object.freeze(['GASTOS CARTAO DE CREDITO','PAGTO CARTAO','PAGAMENTO CARTAO','DEB CARTAO','FATURA CARTAO','OUROCARD','CARTAO VISA','CARTAO ELO','FAT CARTAO','GASTO CRED'])],
  ['TIT_CAP',               Object.freeze(['TIT CAP','TITULO CAPITALIZACAO','CAPITALIZACAO','CAP TITULO','CAPITALIZAR','RESGATE CAP'])],
  ['SVA',                   Object.freeze(['SVA','SERVICO VALOR ADICIONADO','VALOR ADICIONADO','SERVICO ADICIONAL','ADICIONAL SERVICO','PROTECAO'])],
  ['COBRANCA_IND',          Object.freeze(['COBRANCA INDEVIDA','COB IND','DEBITO INDEVIDO','LANCAMENTO INDEVIDO'])],
  ['CARREGADOR_VENDA_CASADA',Object.freeze(['VENDA CASADA','CARREGADOR','PRODUTO VINCULADO','PACOTE VINCULADO','VENDA ATRELADA'])],
  ['ESPECIFICA',            Object.freeze(['ESPECIFICA','COBRANCA ESP','LANCAMENTO ESP','COBRANCA ESPECIFICA'])],
  ['INV_FACIL',             Object.freeze(['INVESTIMENTO FACIL','INV FACIL','APLIC AUTOMATICA','APLICACAO FACIL'])],
  ['COI_BOLETO',            Object.freeze(['COI','BOLETO','PAGAMENTO BOLETO','PAGTO BOLETO','COBRANCA BOLETO','PGTO BOLETO'])],

  // Financiamento e crédito pessoal
  ['BX_ANT_FIN',            Object.freeze(['BX ANT.FINAN','BX.ANT.FINANC','BAIXA ANTECIPADA','LIQ ANT FIN','QUITACAO ANTECIP','LIQUIDACAO ANTECIPADA'])],
  ['AD_DEPOSITANTE',        Object.freeze(['ADIANT.DEPOSITANTE','AD DEPOSITANTE','ADIANTAMENTO DEPOSITANTE','CHEQUE ESPECIAL','LIMITE ESPECIAL'])],
  ['PARC_CRED_PESS',        Object.freeze(['CREDITO PESSOAL','EMPR PESSOAL','EMPRÉST','CRED PESSOAL','PARCELA EMPRESTIMO','PARC EMP','CONSIG EMP'])],
  ['REFINANCIAMENTO_IND',   Object.freeze(['REFINANCIAMENTO','REFIN','REFI EMP','RENEGOCIACAO','REPERFILAMENTO','REESTRUTURACAO'])]
]),
```

> **Atenção ao Axioma A1:** `RUBRICS` está dentro do `Object.freeze({...})` de `LIBRARY`.
> Cada array de padrões também é `Object.freeze(...)`. Não omita o freeze.

---

## Parte 2 — Função `classificarRubrica()` no HTML

### 2.1 Onde inserir

No `LAADV_Calculadora_Juridica_v1.html`, dentro do bloco `<script>`, **logo após** a definição
da função `alternarTema()` (por volta da linha 1559). Insira como função pura, sem efeitos colaterais.

### 2.2 Código exato

```js
/**
 * Classifica uma descrição de transação em uma rubrica jurídica.
 * Retorna o código da rubrica (ex: 'RMC', 'SVA', 'TIT_CAP') ou '' se não houver match.
 * Usa LIBRARY.RUBRICS — array ordenado do mais específico ao mais genérico.
 */
function classificarRubrica(desc) {
  if (!desc || !LIBRARY.RUBRICS) return '';
  const d = desc.toUpperCase();
  for (const [codigo, padroes] of LIBRARY.RUBRICS) {
    if (padroes.some(p => d.includes(p))) return codigo;
  }
  return '';
}
```

---

## Parte 3 — Coluna RUBRICA na tabela de transações

### 3.1 O que mudar em `renderTransacoes(txns)`

A função `renderTransacoes` está por volta da linha 1264. Faça **três alterações**:

**A — Adicionar pass de rubrica** (logo após a linha `const counts = {};`):

```js
// Pass de rubrica jurídica: classifica cada transação que ainda não tem rubrica
txns.forEach(t => { if (!t.rubrica) t.rubrica = classificarRubrica(t.desc); });
```

**B — Atualizar o cabeçalho da tabela** (no HTML estático, `<thead>`):

Localize:
```html
<th style="width:90px">Data</th>
<th>Descrição</th>
<th>Categoria</th>
<th class="text-right" style="width:110px">Crédito</th>
<th class="text-right" style="width:110px">Débito</th>
<th style="width:60px">Conf.</th>
<th style="width:40px">✓</th>
```

Substitua por:
```html
<th style="width:90px">Data</th>
<th>Descrição</th>
<th>Categoria</th>
<th style="width:120px">Rubrica</th>
<th class="text-right" style="width:110px">Crédito</th>
<th class="text-right" style="width:110px">Débito</th>
<th style="width:60px">Conf.</th>
<th style="width:40px">✓</th>
```

**C — Adicionar célula na linha do `txns.map(...)`**:

Localize o template string da linha. Após a célula da `categoria` e antes da célula de crédito, adicione:

```js
<td style="font-size:11px;font-family:'Courier New',monospace;color:var(--txt-detalhe);white-space:nowrap">${t.rubrica||'—'}</td>
```

Ou seja, o trecho do `return` dentro do `.map((t,i)=>{ ... })` deve ficar:

```js
return `<tr style="${estiloManual}">
  <td>${t.data}${t._manual?'<span title="Lançamento manual" style="color:var(--gold);font-size:9px;margin-left:4px">M</span>':''}</td>
  <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(t.desc)}">${escHtml(t.desc)}</td>
  <td><span class="tag ${cc[t.categoria]||'tag-outros'}">${t.categoria}</span></td>
  <td style="font-size:11px;font-family:'Courier New',monospace;color:var(--txt-detalhe);white-space:nowrap">${t.rubrica||'—'}</td>
  <td class="text-right ${t.tipo==='C'?'vc':''}">${t.tipo==='C'?FinancialEngine.fmt(t.valor):''}</td>
  <td class="text-right ${t.tipo==='D'?'vd':''}">${t.tipo==='D'?FinancialEngine.fmt(t.valor):''}</td>
  <td class="${cf}">${(t.confidence*100).toFixed(0)}%</td>
  <td><input type="checkbox" class="txn-cb" data-idx="${i}" style="width:auto;accent-color:var(--teal)" ${['RMC','RCC','SEGURO','BX_FINAN'].includes(t.categoria)?'checked':''}></td>
</tr>`;
```

---

## Parte 4 — Pré-popular o dropdown de rubrica manual

### 4.1 Contexto

A seção de rubricas personalizadas (TASK-011) tem um `<select>` ou campo onde o advogado
pode escolher a rubrica para lançamento manual. Localize o select relacionado a rubrica custom
(procure por `rubrica-custom`, `select-rubrica`, ou similar).

### 4.2 Lista de opções a inserir

Se existir um `<select>` para categoria/rubrica no formulário de rubrica personalizada,
adicione as 27 opções como `<option>` values:

```html
<option value="">— Selecionar Rubrica —</option>
<option value="RMC">RMC</option>
<option value="RCC">RCC</option>
<option value="CESTA">CESTA</option>
<option value="TARIFA_CAD">TARIFA CAD</option>
<option value="JUROS_NC">JUROS NC</option>
<option value="TARIFA_IND">TARIFA IND</option>
<option value="JUROS_ABUSIVOS">JUROS_ABUSIVOS</option>
<option value="MORA">MORA</option>
<option value="MORA_CEL">MORA_CEL</option>
<option value="SVA">SVA</option>
<option value="SLN">SLN</option>
<option value="ANP">ANP</option>
<option value="TIT_CAP">TIT_CAP</option>
<option value="GASTO_C_CRED">GASTO C CRED</option>
<option value="COBRANCA_IND">COBRANCA_IND</option>
<option value="VIDA_PREV">VIDA_PREV</option>
<option value="SEGURO">SEGURO</option>
<option value="SEGURO_CARTAO">SEGURO CARTÃO</option>
<option value="CARREGADOR_VENDA_CASADA">CARREGADOR / VENDA CASADA</option>
<option value="ESPECIFICA">ESPECIFICA</option>
<option value="ANUIDADE">ANUIDADE</option>
<option value="INV_FACIL">INV_FACIL</option>
<option value="BX_ANT_FIN">BX_ANT_FIN</option>
<option value="PARC_CRED_PESS">PARC CRED PESS</option>
<option value="COI_BOLETO">COI - BOLETO</option>
<option value="AD_DEPOSITANTE">AD_DEPOSITANTE</option>
<option value="REFINANCIAMENTO_IND">REFINANCIAMENTO_IND</option>
```

> Se não existir esse select (a seção de rubrica manual usa campo de texto livre),
> **não crie o select do zero** — apenas registre no commit que a Parte 4 não se aplica
> pois a UI de rubrica manual usa input text.

---

## Notas técnicas importantes

### Sobre padrões que dependem de julgamento legal

Algumas rubricas como `TARIFA_IND`, `JUROS_ABUSIVOS` e `COBRANCA_IND` representam
caracterizações jurídicas — não há texto literal no extrato que diga "INDEVIDO".
Os padrões fornecidos capturam casos onde o próprio banco usa esses termos.
Para os demais casos, o advogado usa a rubrica manual (TASK-011). Não invente padrões
que não aparecem em extratos reais.

### Sobre normalização de texto

O algoritmo de match usa `.toUpperCase()` na descrição. Os padrões em `RUBRICS` já estão
em MAIÚSCULAS. Não adicione `.trim()` ou remoção de acentos — a consistência com o código
existente é prioritária.

### Sobre `confidence`

O campo `t.confidence` existente reflete a confiança do PARSER (baseada no KEYWORDS match).
**Não crie um campo de confiança separado para rubrica.** A rubrica é determinística:
match → código; no match → string vazia.

### Sobre o totalizador RMC/RCC

A função `atualizarTotalRMCRCC()` usa `t.categoria` para somar valores. **Não altere essa lógica.**
A rubrica é exibição, não afeta cálculo.

---

## Critério de Aceite

- [ ] `LIBRARY.RUBRICS` existe em `core/library.js`, é `Object.freeze([...])`, contém exatamente 27 entradas
- [ ] Cada entrada é `[codigo, Object.freeze([...padroes])]`
- [ ] Função `classificarRubrica(desc)` existe no HTML, é pura, usa `LIBRARY.RUBRICS`
- [ ] Tabela de transações tem coluna "Rubrica" entre Categoria e Crédito
- [ ] Transações com `RMC` no texto exibem rubrica `RMC`; transações com `SEGURO CARTAO` exibem `SEGURO_CARTAO` (não `SEGURO`)
- [ ] Transações sem match exibem `—` (não string vazia visível)
- [ ] `t.rubrica` é atribuído no objeto da transação (persistido em `UIState.lastBatchResults`)
- [ ] Sem erros no console
- [ ] Nenhuma regressão: cálculo em lote, totalizador RMC/RCC, envio ao Calcular funcionam idêntico

---

## Entrega

```
git add core/library.js LAADV_Calculadora_Juridica_v1.html
git commit -m "feat(TASK-013): classificação por rubricas jurídicas — RUBRICS + coluna extrato"
git push origin claude/work-rubricas
```

---

*AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MÓDULO: PROMPT_TASK_013*
