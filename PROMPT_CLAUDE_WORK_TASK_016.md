# PROMPT — Claude-Work (Opus 4.7) | TASK-016 — Auditoria Final de Código
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Execute esta task completa.
> Projeto: LAADV Calculadora Jurídica · v1.9.4

---

## Contexto

O sistema está estável em v1.9.4 com ponto de recuperação tagueado (`v1.9.4-stable`).
Esta task é uma auditoria final de qualidade: varrer o HTML e os módulos em busca de
código morto, funções duplicadas, variáveis órfãs, comentários obsoletos e qualquer
coisa que polua o código sem agregar funcionalidade.

**Arquivos que você DEVE tocar:**
- `LAADV_Calculadora_Juridica_v1.html`

**Arquivos que você NÃO deve tocar:**
- `core/*`, `io/*`, `render/*`, `backend/*`, `tests/*`

---

## Branch

```
git checkout main
git pull origin main
git checkout -b claude/work-audit-016
```

---

## O que auditar no HTML

### 1 — Funções declaradas mas nunca chamadas

Procure funções definidas no `<script>` que não possuem nenhuma referência em `onclick`,
em outras funções, nem no IIFE de inicialização. Se encontrar, remova.

Exemplos suspeitos a verificar (confirme antes de remover):
- `inspecionar()` — verifique se o botão correspondente ainda existe
- Qualquer função legada de versões anteriores à modularização (v1.5.0)

### 2 — Variáveis e constantes órfãs

Verifique se há `const`/`let`/`var` declarados no escopo global do `<script>` que nunca
são lidos. Remova se confirmado.

### 3 — Blocos de HTML comentado

Procure por blocos `<!-- ... -->` extensos que sejam código HTML antigo comentado
(não documentação). Remova.

### 4 — IDs de elementos referenciados no JS mas inexistentes no HTML

Procure padrões como `document.getElementById('algum-id')` no script e confirme que
o elemento com esse ID existe no HTML. Se o elemento foi removido em tasks anteriores
e o JS ainda tenta acessá-lo, remova ou corrija o JS.

IDs para verificar especificamente:
- `backend-url-input` — removido na TASK-015 final. O JS ainda referencia?
- `backend-status` — idem

### 5 — Event listeners duplicados ou obsoletos

No IIFE de inicialização e em funções que adicionam listeners, verifique se há
`addEventListener` para elementos que não existem mais no DOM.

### 6 — Console.log e debugs esquecidos

Procure por `console.log`, `console.warn`, `console.error`, `debugger` que não sejam
parte de tratamento de erro intencional. Remova os que forem debug temporário.

### 7 — CSS não utilizado

No bloco `<style>`, procure por seletores de classe/ID que não aparecem em nenhum
elemento HTML nem são gerados dinamicamente via JS. Se for seguro remover (classe
não construída em runtime), remova.

Exemplo suspeito: `.ake-badge` — foi removido do HTML na TASK-012. O CSS ainda existe?

### 8 — Atributos onclick redundantes

Após a TASK-015, os wrappers `*ComBackend()` foram criados e os onclicks atualizados.
Confirme que não restou nenhum `onclick="exportarPeticaoPDF()"` ou
`onclick="exportarPeticaoRTF()"` direto (sem wrapper) em lugar nenhum do HTML.

---

## Critério de Aceite

- [ ] Nenhuma função declarada sem uso
- [ ] Nenhuma variável global órfã
- [ ] Nenhum bloco HTML comentado extenso
- [ ] `document.getElementById('backend-url-input')` e `backend-status` removidos do JS se existirem
- [ ] Nenhum `console.log` de debug esquecido
- [ ] `.ake-badge` CSS removido se não utilizado
- [ ] Todos os botões de export usando wrappers `*ComBackend()` — zero chamadas diretas
- [ ] Plataforma funcional após limpeza (nenhuma regressão)
- [ ] HTML resultante menor ou igual em linhas ao atual

---

## Entrega

```
git add LAADV_Calculadora_Juridica_v1.html
git commit -m "refactor(TASK-016): auditoria final — remoção de código morto e limpeza"
git push origin claude/work-audit-016
```

---

*AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MÓDULO: PROMPT_TASK_016*
