# PROMPT — Claude-Work (Opus 4.7) | TASK-011 — Rubrica Manual + Entrada Mês a Mês
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Execute esta task completa.
> Projeto: LAADV Plataforma Axiomática de Cálculo Jurídico-Financeiro · v1.8.0+
> DEPENDÊNCIA: Execute após TASK-010 estar integrada em main.

---

## Contexto do Projeto

Repositório: https://github.com/leonzordhue/calculadora_juridica.git
Plataforma: HTML puro, GitHub Pages — sem bundler. Exports via `window.*`.

Esta task implementa duas funcionalidades de entrada manual de dados:
1. **Rubricas personalizadas** — a advogada digita termos que o sistema deve reconhecer nos extratos
2. **Entrada mês a mês** — tabela para inserir manualmente os valores por competência quando o parser não consegiu extrair, ou para dados que não estão em PDF

---

## TASK-011 — Rubrica Manual + Entrada Mês a Mês

### Branch
```
git checkout main
git pull origin main
git checkout -b claude/work-entrada-manual
```

### Arquivos que você DEVE tocar
- `LAADV_Calculadora_Juridica_v1.html` — nova seção UI + funções JS

### Arquivos que você NÃO deve tocar
- `core/library.js` — LIBRARY é ROM imutável (Axioma A1). As rubricas personalizadas ficam em UIState, não em LIBRARY
- `core/ake-kernel.js`, `core/financial-alu.js`, `core/legal-cpu.js`
- `core/petition-engine.js`, `render/report-builder.js`
- Qualquer arquivo em `io/`

---

## Funcionalidade A — Rubricas Personalizadas

### A.1 Contexto

A classificação de transações em `BradescoParser._classify()` e nos outros parsers usa `LIBRARY.KEYWORDS` (ROM, imutável). Se uma transação não está nas keywords, vai para categoria `OUTROS`.

O objetivo é permitir que a advogada adicione termos de busca temporários para esta sessão — ex: se o banco usa "DEBITO AUTOM 12345" para um desconto consignado, ela digita "DEBITO AUTOM 12345" e a categoria desejada (RMC, SEGURO, etc.). O parser recalssificará as transações já importadas.

### A.2 UI — Seção "Rubricas Personalizadas"

Adicione uma seção na aba de upload/importação (aba que tem a zona de drag-and-drop), logo abaixo da tabela de transações importadas:

```html
<div class="card" id="sec-rubricas-custom" style="margin-top:16px">
  <div class="card-title" style="font-size:14px">Rubricas Personalizadas</div>
  <p style="font-size:11px;color:var(--txt-detalhe,#8BC4C4);margin:0 0 8px">
    Adicione termos específicos do banco para identificar categorias que o sistema não reconheceu automaticamente.
  </p>
  <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
    <input id="rubrica-termo" type="text" placeholder="Termo (ex: DEBITO AUTOM 12345)"
      style="flex:1;min-width:200px;padding:6px 10px;border-radius:6px;
             border:1px solid var(--border-input,#1A3A5C);
             background:var(--bg-input,#0A1628);
             color:var(--txt-principal,#C0D0D0);font-size:12px">
    <select id="rubrica-cat"
      style="padding:6px 10px;border-radius:6px;border:1px solid var(--border-input,#1A3A5C);
             background:var(--bg-input,#0A1628);color:var(--txt-principal,#C0D0D0);font-size:12px">
      <option value="RMC">RMC — Cartão Consignado</option>
      <option value="RCC">RCC — Reserva Cartão</option>
      <option value="PARCELA">Parcela Empréstimo</option>
      <option value="SEGURO">Seguro</option>
      <option value="TARIFA">Tarifa / Cesta</option>
      <option value="JUROS">Juros / IOF</option>
      <option value="CARTAO_CREDITO">Cartão de Crédito</option>
      <option value="OUTROS">Outros (ignorar)</option>
    </select>
    <button class="btn btn-gold" onclick="adicionarRubrica()" style="padding:6px 16px;font-size:12px">
      + Adicionar
    </button>
  </div>
  <div id="rubrica-lista" style="display:flex;flex-wrap:wrap;gap:6px"></div>
  <button class="btn" onclick="reaplicarRubricas()"
    style="margin-top:10px;padding:6px 16px;font-size:12px;
           background:#1A3A5C;color:#C0D0D0;border:1px solid #1A3A5C;border-radius:6px">
    Reaplicar às transações importadas
  </button>
</div>
```

### A.3 Funções JS para rubricas

No inline `<script>`, adicione:

```js
// UIState: lista de rubricas personalizadas da sessão
// Estrutura: [{termo: 'DEBITO AUTOM 12345', cat: 'RMC'}, ...]
UIState.rubricasCustom = [];

function adicionarRubrica() {
  const termo = document.getElementById('rubrica-termo').value.trim().toUpperCase();
  const cat = document.getElementById('rubrica-cat').value;
  if (!termo) return;
  // Evitar duplicata
  if (UIState.rubricasCustom.some(r => r.termo === termo)) {
    document.getElementById('rubrica-termo').value = '';
    return;
  }
  UIState.rubricasCustom.push({termo, cat});
  document.getElementById('rubrica-termo').value = '';
  renderRubricasLista();
}

function removerRubrica(index) {
  UIState.rubricasCustom.splice(index, 1);
  renderRubricasLista();
}

function renderRubricasLista() {
  const el = document.getElementById('rubrica-lista');
  if (!el) return;
  el.innerHTML = UIState.rubricasCustom.map((r, i) =>
    `<span style="background:#0A1628;border:1px solid #1A3A5C;border-radius:12px;
                  padding:3px 10px;font-size:11px;display:flex;align-items:center;gap:6px">
       <span style="color:#C9A93E">${r.cat}</span>
       <span>${r.termo}</span>
       <span onclick="removerRubrica(${i})" style="cursor:pointer;color:#C0392B;font-weight:700">×</span>
     </span>`
  ).join('');
}

function reaplicarRubricas() {
  // Reclassifica as transações em UIState.lastBatchResults e re-renderiza
  if (!UIState.lastBatchResults || !UIState.lastBatchResults.length) {
    alert('Nenhuma transação importada. Faça upload de um extrato primeiro.');
    return;
  }
  UIState.lastBatchResults = UIState.lastBatchResults.map(txn => {
    // Verificar rubricas personalizadas primeiro (prioridade sobre LIBRARY.KEYWORDS)
    for (const r of UIState.rubricasCustom) {
      if (txn.desc.toUpperCase().includes(r.termo)) {
        return {...txn, categoria: r.cat, confidence: 0.98, _custom: true};
      }
    }
    return txn; // mantém classificação original
  });
  renderTransacoes(UIState.lastBatchResults);
  kernel.registrarBuild('RUBRICA_CUSTOM', `${UIState.rubricasCustom.length} rubrica(s) aplicada(s)`);
}
```

**Observação:** `UIState.lastBatchResults` pode ter nome diferente no código atual. Verifique como a lista de transações é armazenada após o `renderTransacoes(txns)` e use o nome correto.

---

## Funcionalidade B — Entrada Manual Mês a Mês

### B.1 Contexto

Quando o extrato não está disponível em PDF (período muito antigo, banco não suportado, etc.), a advogada precisa digitar os valores manualmente, competência por competência. Esses valores alimentam o mesmo pipeline de cálculo (batching em lote).

### B.2 UI — Seção "Entrada Manual"

Adicione uma nova aba ou sub-seção na aba de upload. Coloque abaixo da seção de rubricas personalizadas:

```html
<div class="card" id="sec-entrada-manual" style="margin-top:16px">
  <div class="card-title" style="font-size:14px">Entrada Manual — Mês a Mês</div>
  <p style="font-size:11px;color:var(--txt-detalhe,#8BC4C4);margin:0 0 10px">
    Para períodos sem extrato disponível. Insira data, descrição e valor de cada desconto manualmente.
  </p>

  <!-- Linha de entrada -->
  <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;align-items:center">
    <input id="man-data" type="month" title="Competência (mês/ano)"
      style="padding:6px 10px;border-radius:6px;border:1px solid var(--border-input,#1A3A5C);
             background:var(--bg-input,#0A1628);color:var(--txt-principal,#C0D0D0);font-size:12px">
    <input id="man-desc" type="text" placeholder="Descrição (ex: CONSIG EMP BANCARIO)"
      style="flex:1;min-width:180px;padding:6px 10px;border-radius:6px;
             border:1px solid var(--border-input,#1A3A5C);
             background:var(--bg-input,#0A1628);color:var(--txt-principal,#C0D0D0);font-size:12px">
    <select id="man-cat"
      style="padding:6px 10px;border-radius:6px;border:1px solid var(--border-input,#1A3A5C);
             background:var(--bg-input,#0A1628);color:var(--txt-principal,#C0D0D0);font-size:12px">
      <option value="RMC">RMC</option>
      <option value="RCC">RCC</option>
      <option value="PARCELA">Parcela</option>
      <option value="SEGURO">Seguro</option>
      <option value="TARIFA">Tarifa</option>
      <option value="JUROS">Juros/IOF</option>
      <option value="CARTAO_CREDITO">Cartão Crédito</option>
      <option value="OUTROS">Outros</option>
    </select>
    <input id="man-valor" type="number" step="0.01" min="0" placeholder="Valor R$"
      style="width:110px;padding:6px 10px;border-radius:6px;
             border:1px solid var(--border-input,#1A3A5C);
             background:var(--bg-input,#0A1628);color:var(--txt-principal,#C0D0D0);font-size:12px">
    <button class="btn btn-gold" onclick="adicionarEntradaManual()" style="padding:6px 16px;font-size:12px">
      + Lançar
    </button>
  </div>

  <!-- Tabela de lançamentos manuais -->
  <div id="manual-tabela" style="display:none;margin-top:8px">
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead>
        <tr style="border-bottom:1px solid #1A3A5C;color:#8BC4C4">
          <th style="text-align:left;padding:4px 8px">Competência</th>
          <th style="text-align:left;padding:4px 8px">Descrição</th>
          <th style="text-align:left;padding:4px 8px">Categoria</th>
          <th style="text-align:right;padding:4px 8px">Valor</th>
          <th style="padding:4px 8px"></th>
        </tr>
      </thead>
      <tbody id="manual-tbody"></tbody>
    </table>
    <button class="btn" onclick="importarEntradaManual()"
      style="margin-top:10px;padding:6px 16px;font-size:12px;
             background:#0B4A44;color:#64DFDF;border:1px solid #0B4A44;border-radius:6px">
      Enviar para tabela de transações
    </button>
  </div>
</div>
```

### B.3 Funções JS para entrada manual

```js
UIState.entradasManuais = [];

function adicionarEntradaManual() {
  const dataEl = document.getElementById('man-data');
  const descEl = document.getElementById('man-desc');
  const catEl  = document.getElementById('man-cat');
  const valEl  = document.getElementById('man-valor');
  const data   = dataEl.value; // formato YYYY-MM
  const desc   = descEl.value.trim();
  const cat    = catEl.value;
  const valor  = parseFloat(valEl.value);
  if (!data || !desc || isNaN(valor) || valor <= 0) {
    alert('Preencha todos os campos: competência, descrição e valor.');
    return;
  }
  UIState.entradasManuais.push({
    data: data + '-01', // YYYY-MM-DD
    desc: desc.toUpperCase(),
    tipo: 'D',
    valor: valor,
    categoria: cat,
    confidence: 1.0,
    _manual: true
  });
  descEl.value = '';
  valEl.value = '';
  renderEntradaManualTabela();
}

function removerEntradaManual(index) {
  UIState.entradasManuais.splice(index, 1);
  renderEntradaManualTabela();
}

function renderEntradaManualTabela() {
  const tbody = document.getElementById('manual-tbody');
  const tabela = document.getElementById('manual-tabela');
  if (!tbody) return;
  if (UIState.entradasManuais.length === 0) {
    tabela.style.display = 'none';
    return;
  }
  tabela.style.display = 'block';
  tbody.innerHTML = UIState.entradasManuais.map((e, i) => {
    const comp = e.data.slice(0, 7); // YYYY-MM
    return `<tr style="border-bottom:1px solid #0A1628">
      <td style="padding:4px 8px">${comp}</td>
      <td style="padding:4px 8px">${e.desc}</td>
      <td style="padding:4px 8px;color:#C9A93E">${e.categoria}</td>
      <td style="padding:4px 8px;text-align:right">R$ ${e.valor.toFixed(2).replace('.',',')}</td>
      <td style="padding:4px 8px;text-align:center">
        <span onclick="removerEntradaManual(${i})"
          style="cursor:pointer;color:#C0392B;font-weight:700">×</span>
      </td>
    </tr>`;
  }).join('');
}

function importarEntradaManual() {
  if (!UIState.entradasManuais.length) return;
  // Mescla com transações já importadas (ou inicia nova lista)
  const existentes = UIState.lastBatchResults || [];
  const combinadas = [...existentes, ...UIState.entradasManuais];
  renderTransacoes(combinadas);
  kernel.registrarBuild('MANUAL_IMPORT', `${UIState.entradasManuais.length} lançamento(s) manual(is) adicionado(s)`);
  // Limpar a fila manual após importar
  UIState.entradasManuais = [];
  renderEntradaManualTabela();
}
```

---

### Critério de aceite

**Rubricas personalizadas:**
- [ ] Campo de termo + select de categoria + botão "Adicionar" funcionam
- [ ] Rubrica adicionada aparece como chip removível na lista
- [ ] "Reaplicar" reclassifica as transações já importadas com os termos customizados
- [ ] Rubrica customizada tem prioridade sobre LIBRARY.KEYWORDS (confidence 0.98)
- [ ] Chips são removíveis com `×`

**Entrada manual:**
- [ ] Campos data/mês, descrição, categoria, valor funcionam
- [ ] Linha lançada aparece na tabela
- [ ] "Enviar para tabela de transações" mescla com as importadas do PDF
- [ ] Lançamentos manuais ficam marcados visivelmente na tabela principal (ex: linha com borda pontilhada ou cor diferente)
- [ ] Lançamentos manuais com `_manual: true` são contabilizados no totalizador do batch
- [ ] Sem erros no console

---

### Entrega

```
git add LAADV_Calculadora_Juridica_v1.html
git commit -m "feat(TASK-011): rubrica personalizada por sessão + entrada manual mês a mês"
git push origin claude/work-entrada-manual
```

---

*AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MÓDULO: PROMPT_TASK_011*
