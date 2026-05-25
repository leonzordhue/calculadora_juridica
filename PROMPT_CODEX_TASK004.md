# PROMPT — Codex | TASK-004 | Impugnação à Execução
> AKE/UFT-1.0 | PRINCIPAL → CODEX | Leia e execute na ordem.

---

## Status

v1.6.0 em produção. TASK-003 integrada com sucesso.
Seu `core/petition-engine.js` está correto. Trabalho aprovado, IC: 1.0.

## TASK-004 — Template Impugnação à Execução

Branch de trabalho: `codex/pet-engine-impugnacao` (no seu worktree Projeto LAADV Codex)

```
git checkout main
git pull origin main
git checkout -b codex/pet-engine-impugnacao
```

### Arquivo a editar: `core/petition-engine.js`

#### A) Adicionar opção no DECODE

Em `PetitionEngine.DECODE()`, o campo `tipoPeca` já lê o select `pet-tipo-peca`.
O Principal vai adicionar a opção `impugnacao` no HTML. Prepare o JS para recebê-la.

#### B) VALIDATE — adicionar validação para impugnação

```js
if(d.tipoPeca === 'impugnacao') {
  if(!d.vara)        erros.push('Número da Vara');
  if(!d.processo)    erros.push('Número do Processo');
  if(!d.matSimples || d.matSimples <= 0) erros.push('Valor do indébito apurado');
}
```

#### C) RENDER_HTML e RENDER_TEXT — adicionar branch

```js
if(d.tipoPeca === 'impugnacao') return renderImpugnacaoHTML(d);
// (no RENDER_TEXT)
if(d.tipoPeca === 'impugnacao') return renderImpugnacaoTEXT(d);
```

#### D) Criar `renderImpugnacaoHTML(d)` e `renderImpugnacaoTEXT(d)`

**Estrutura da Impugnação ao Cumprimento de Sentença:**

1. **Cabeçalho**
   `EXMO(A). SR(A). JUIZ(A) DA ${d.vara} VARA CÍVEL DA COMARCA DE ${d.cidadeComarca}`

2. **Identificação**
   `Processo n. ${d.processo}`
   `IMPUGNANTE: ${d.bancoReu}`
   `IMPUGNADO(A): ${d.autor}`

3. **I — DA IMPUGNAÇÃO**
   O(A) impugnado(A) vem apresentar Impugnação ao Cumprimento de Sentença apresentado pela parte contrária, pelos fundamentos abaixo.

4. **II — DO SISTEMA DE APURAÇÃO**
   Referência ao cálculo LAADV: apurou-se indébito de `fmtExt(d.matSimples)`,
   calculado sobre o excesso entre o total descontado e o valor correto pelo
   sistema Price (PMT × n), conforme memória de cálculo em anexo.

5. **III — DA METODOLOGIA**
   - Índice de correção: conforme sentença / INPC+1%a.m. pré 30/08/2024, IPCA+SELIC pós (Lei 14.905/24)
   - Taxa de juros: média BACEN SGS — série oficial, mesma da Calculadora do Cidadão
   - Fórmula PMT: Price (BACEN), PV = valor efetivamente creditado

6. **IV — DO PEDIDO**
   - Acolhimento da impugnação
   - Adequação dos valores ao cálculo apresentado em anexo
   - Intimação da parte contrária para manifestação

7. **Assinatura** — mesma estrutura das outras peças

#### E) Exports — não alterar, já estão corretos no final do arquivo

### Entrega

```
git add core/petition-engine.js
git commit -m "feat(TASK-004): PetitionEngine suporta Impugnação ao Cumprimento de Sentença"
git push origin codex/pet-engine-impugnacao
```

Atualizar `AKE_TASKS.md`: TASK-004 `status: done`.
```
git add AKE_TASKS.md
git commit -m "docs: TASK-004 JS concluído"
git push origin codex/pet-engine-impugnacao
```

---

*AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: PROMPT_CODEX_TASK004*
