# PROMPT — Claude-Work (Opus 4.7) | TASK-009 — LAADV/AM Terceiro Escritório
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Execute esta task completa.
> Projeto: LAADV Plataforma Axiomática de Cálculo Jurídico-Financeiro · v1.8.0

---

## Contexto do Projeto

Repositório: https://github.com/leonzordhue/calculadora_juridica.git
Plataforma: HTML puro, GitHub Pages — sem bundler. Exports via `window.*`.

Atualmente há dois escritórios em `core/library.js` dentro de `ESCRITORIOS = Object.freeze({...})`:
- `LAADV`: Luis Albert, Rio de Janeiro, OAB/RJ 240.091, conta Sicredi 40721-6
- `NG`: Nicolas Gomes, Manaus, OAB/AM 8.926, conta Sicredi 79472-8

---

## TASK-009 — Terceiro Escritório: LAADV/AM (Manaus)

Existe uma filial do escritório LAADV em Manaus, com OAB/AM e conta bancária própria, diferente da matriz RJ.

### Branch
```
git checkout main
git pull origin main
git checkout -b claude/work-laadv-am
```

### Arquivos que você DEVE tocar
- `core/library.js` — adicionar perfil LAADV_AM ao ESCRITORIOS
- `LAADV_Calculadora_Juridica_v1.html` — adicionar opção no dropdown e tratar no `selecionarEscritorio()`

### Arquivos que você NÃO deve tocar
- Qualquer arquivo em `io/`, `render/`, `core/` que não seja `library.js`

---

### O que implementar

#### A) Novo perfil em `core/library.js`

Localize `const ESCRITORIOS=Object.freeze({` e adicione o terceiro perfil após o perfil `NG`:

```js
LAADV_AM: {
  id: 'LAADV_AM',
  adv_nome: 'LUIS ALBERT DOS SANTOS OLIVEIRA',
  adv_oab: 'OAB/AM 8.251',
  adv_oab_assina: 'OAB/AM nº 8.251',
  adv_oab2_nome: 'ALESSANDRA VIRGINIA LOPES BRAGA',
  adv_oab2: 'OAB/AM 15.217',
  escritorio_nome: 'LUIS ALBERT DOS SANTOS OLIVEIRA SOCIEDADE INDIVIDUAL DE ADVOCACIA',
  banco_nome: 'SICREDI (748)',
  banco_ag: '0802',
  banco_cc: '66245-4',
  banco_cnpj: '27.131.836/0001-81',
  cidade: 'Manaus',
  email: 'contato@luisalbertadv.com.br',
  tel: '(92) 99000-0000',
  cor_primaria: [11, 74, 68],
  cor_acento: [201, 169, 62]
}
```

**Axioma A1**: o `Object.freeze` já envolve `ESCRITORIOS` inteiro — o novo perfil é incluído dentro do objeto antes do freeze, não após.

#### B) Dropdown no HTML

Localize o `<select>` ou os botões de seleção de escritório na aba "Peças Processuais". Adicione a terceira opção:

```html
<option value="LAADV_AM">LAADV — Manaus/AM (Luis Albert · OAB/AM 8.251)</option>
```

A ordem deve ser: LAADV (RJ) | LAADV/AM | NG.

#### C) Função `selecionarEscritorio()` no HTML

Localize a função `selecionarEscritorio(id)` no inline `<script>`. Ela já popula os campos `pet-adv-nome`, `pet-adv-oab`, etc. com os dados do escritório selecionado.

Verifique se ela usa `ESCRITORIOS[id]` dinamicamente (nesse caso não precisa de alteração) ou se tem um `if/else if` por escritório (nesse caso adicione o terceiro branch).

**Se usar ESCRITORIOS[id] diretamente:** a função já funcionará com o novo perfil sem alteração.

**Se tiver branches if/else:** adicione:
```js
} else if (id === 'LAADV_AM') {
  const e = ESCRITORIOS.LAADV_AM;
  document.getElementById('pet-adv-nome').value = e.adv_nome;
  document.getElementById('pet-adv-oab').value = e.adv_oab;
  // ... demais campos seguindo o padrão dos outros branches
}
```

#### D) PetitionEngine — segunda assinatura (LAADV/AM)

O perfil LAADV_AM tem dois signatários (Luis Albert + Alessandra Braga). Localize em `core/petition-engine.js` a função `PetitionEngine.DECODE()` e o render de assinatura dos templates HTML.

Nos templates, onde aparece a assinatura, adicione condicionalmente:

```js
// Se escritório tem adv_oab2_nome, renderiza segunda assinatura
const seg = d.escritorio.adv_oab2_nome
  ? `\n\nAssinado eletronicamente\n${d.escritorio.adv_oab2_nome}\n${d.escritorio.adv_oab2}`
  : '';
```

E inclua `seg` no bloco de assinatura do template TEXT. No HTML, gere um segundo bloco de assinatura com estilo equivalente.

**Se preferir não tocar em petition-engine.js nesta task**, deixe para uma task futura e sinalize nos comentários do commit.

---

### Critério de aceite

- [ ] Terceiro escritório visível no dropdown — "LAADV — Manaus/AM"
- [ ] Ao selecionar, campos preenchem: nome Luis Albert, OAB/AM, banco Sicredi, Manaus, conta 66245-4
- [ ] Object.freeze preservado (Axioma A1) — sem `ESCRITORIOS.LAADV_AM = ...` em runtime
- [ ] Templates de petição geram com os dados corretos do AM
- [ ] LAADV/RJ e NG não regridem

---

### Entrega

```
git add core/library.js LAADV_Calculadora_Juridica_v1.html
git commit -m "feat(TASK-009): terceiro escritório LAADV/AM — Manaus, OAB/AM 8.251, conta Sicredi 66245-4"
git push origin claude/work-laadv-am
```

Se tocar em `core/petition-engine.js`:
```
git add core/library.js LAADV_Calculadora_Juridica_v1.html core/petition-engine.js
```

---

*AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MÓDULO: PROMPT_TASK_009*
