# PROMPT — Codex | TASK-003 paralela | PetitionEngine Petição Inicial
> AKE/UFT-1.0 | PRINCIPAL → CODEX | Leia e execute na ordem.

---

## Contexto

v1.5.0 em produção. Modularização concluída. Ótimo trabalho.

**Regra permanente do seu território:**
- Você edita SOMENTE `core/*.js`, `io/*.js`, `render/*.js`, `tests/*`
- Nunca toque no HTML — Claude-Work cuida do HTML
- Entregue o `.js` — o Principal integra com o HTML

---

## TASK-003 paralela — PetitionEngine: suporte a Petição Inicial

### Passo 1 — Preparar branch (no seu worktree: Projeto LAADV Codex)
```
git checkout main
git pull origin main
git checkout -b codex/pet-engine-inicial
```

### Passo 2 — Editar `core/petition-engine.js`

#### A) Em `PetitionEngine.DECODE()` — adicionar leitura dos novos campos

Dentro do objeto retornado por DECODE, adicionar:
```js
tipoPeca:         document.getElementById('pet-tipo-peca')?.value || 'cumprimento',
vara:             document.getElementById('pet-vara')?.value || '',
enderecoCliente:  document.getElementById('pet-endereco-cliente')?.value || '',
cnpjBanco:        document.getElementById('pet-cnpj-banco')?.value || '',
danosMorais:      parseFloat(document.getElementById('pet-danos-morais')?.value) || 0,
```

#### B) Em `PetitionEngine.VALIDATE(d)` — validações condicionais

Adicionar bloco após as validações existentes:
```js
if(d.tipoPeca === 'inicial') {
  if(!d.vara)             erros.push('Número da Vara');
  if(!d.enderecoCliente)  erros.push('Endereço do cliente');
  if(!d.cnpjBanco)        erros.push('CNPJ do banco réu');
}
```

#### C) Em `PetitionEngine.RENDER_HTML(d)` e `RENDER_TEXT(d)`

No início de cada função, adicionar o branch:
```js
if(d.tipoPeca === 'inicial') return renderPeticaoInicialHTML(d); // ou TEXT
```
O branch existente continua para `'cumprimento'`.

#### D) Criar função `renderPeticaoInicialHTML(d)` — retorna string HTML

Estrutura da Petição Inicial:
1. Destino: `EXMO(A). SR(A). JUIZ(A) DA ${d.vara}ª VARA CÍVEL DA COMARCA DE ${d.cidadeComarca}`
2. Qualificação AUTORA: nome, CPF, endereço
3. Qualificação RÉU: banco, CNPJ
4. `I — DOS FATOS` — narrativa do contrato e cobranças abusivas
5. `II — DO DIREITO` — CDC art.42, Lei 10.820/03, Lei 14.905/24
6. `III — DOS PEDIDOS` — repetição do indébito em dobro + danos morais se `d.danosMorais > 0`
7. `IV — DO VALOR DA CAUSA` — `d.matSimples + d.danosMorais`
8. Requerimentos finais + local/data/assinatura

Use as mesmas classes CSS da petição existente:
`.pet-doc`, `.pet-destino`, `.pet-secao`, `.pet-p`, `.pet-pedidos`, `.pet-assinatura`

#### E) Criar `renderPeticaoInicialTEXT(d)` — versão texto puro para PDF/RTF

Mesma estrutura, sem tags HTML. Use `\n` para quebra de linha.

### Passo 3 — Entregar

```
git add core/petition-engine.js
git commit -m "feat(TASK-003): PetitionEngine suporta Petição Inicial RMC/RCC"
git push origin codex/pet-engine-inicial
```

Atualizar `AKE_TASKS.md`: TASK-003 checkboxes de JS marcados.
```
git add AKE_TASKS.md
git commit -m "docs: TASK-003 JS concluído"
git push origin codex/pet-engine-inicial
```

### Não faça mais nada
Não toque no HTML. Não faça merge em main.
O Principal integra quando Claude-Work entregar o HTML correspondente.

---

*AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: PROMPT_CODEX_TASK003*
