# AKE_PROTOCOL — Protocolo de Coordenação Multi-Agente
> AKE/UFT-1.0 | BUILD: LAADV | IC: 1.0 | MÓDULO: PROTOCOL
> Documento normativo. Alterações exigem consenso do Principal.

---

## Pool de Agentes

| ID | Nome | Modelo | Papel | Branches |
|----|------|--------|-------|----------|
| A0 | **Principal** | Claude Sonnet (local) | Chefe: planeja, revisa, mergeia, deploya | `main`, `claude/principal-*` |
| A1 | **Claude-Work** | Claude Sonnet (trabalho) | Worker UI: features, templates de petição | `claude/work-*` |
| A2 | **Codex** | GPT-4o | Worker infra: refactor, modularização, testes | `codex/*` |

---

## Pipeline AKE/UFT-1.0

```
FETCH → DECODE → EXECUTE → WRITEBACK
```

| Estágio | Quem | O que faz |
|---------|------|-----------|
| FETCH | Principal | Lê `AKE_TASKS.md`, identifica tasks `status: ready`, atribui agente |
| DECODE | Worker designado | Lê contexto da task, estuda arquivos relevantes, planeja antes de codar |
| EXECUTE | Worker designado | Implementa na branch designada, commit atômico |
| WRITEBACK | Principal | Revisa PR, merge em `main` com IC=1.0, atualiza `AKE_WORKLOG.md` |

---

## Regras por Agente

### Principal (A0)
- Único que faz `git merge` em `main` e `git push` para `origin/main`
- Atualiza `AKE_TASKS.md` a cada mudança de status
- Atualiza `AKE_WORKLOG.md` a cada merge (append-only — nunca deletar)
- Mantém IC ≥ 0.9 como condição de merge
- Não escreve código de feature — delega tudo acima de 30 linhas

### Claude-Work (A1)
- Lê `AKE_TASKS.md` ao iniciar — pega primeira task `status: ready` com `agent: claude-work`
- Marca a task como `status: in_progress` no arquivo antes de começar
- Trabalha **somente** na branch designada da task (`claude/work-*`)
- Nunca toca em `main`, nunca faz merge
- Ao concluir: commit na branch + comentar na task (status: done, checklist preenchido)
- Sempre lê e analisa antes de codar (DECODE antes de EXECUTE)

### Codex (A2)
- Lê `AKE_TASKS.md` ao iniciar — pega primeira task `status: ready` com `agent: codex`
- Marca a task como `status: in_progress`
- Trabalha **somente** na branch `codex/*` designada
- Nunca toca em `main`, nunca faz merge
- Ao concluir: commit na branch + checklist atualizado

---

## Regras Universais

1. **Um arquivo, um agente por vez** — nunca dois agentes no mesmo arquivo na mesma branch simultaneamente
2. **Commits atômicos** — prefixo obrigatório: `feat/`, `fix/`, `refactor/`, `docs/`, `test/`
3. **IC ≥ 0.9** — nenhuma entrega com menos de 90% dos critérios de aceite satisfeitos
4. **Português do Brasil** — toda comunicação, comentários, commits
5. **Build ID** — todo arquivo criado ou modificado recebe: `<!-- AKE/UFT-1.0 | BUILD: LAADV-YYYYMMDD | IC: X.X | MÓDULO: nome -->`
6. **Sem emojis em código** — apenas nos labels da UI onde já existem
7. **DECODE antes de EXECUTE** — estudar, analisar, parametrizar antes de qualquer linha de código

---

## Protocolo de Handoff

Quando um worker conclui uma task:
1. Atualiza checklist da task em `AKE_TASKS.md` (status: done, todos os itens marcados)
2. Faz `git push origin <branch>`
3. Abre Pull Request contra `main` com título: `[TASK-XXX] Descrição breve`
4. PR description inclui: o que mudou, axioma afetado, IC obtido, como testar
5. Principal revisa, testa localmente, mergeia ou solicita ajuste

---

## Fluxo de Status de Tasks

```
ready → in_progress → done → (Principal mergeia) → archived
                   ↘ blocked (documenta o bloqueio)
```

---

## Isolamento de Arquivos por Agente

| Branch Pattern | Arquivos permitidos |
|----------------|---------------------|
| `codex/*` | `/core/*.js`, `/io/*.js`, `/render/*.js`, arquivos de teste |
| `claude/work-*` | `LAADV_Calculadora_Juridica_v1.html` (features UI, templates) |
| `claude/principal-*` | `AKE_TASKS.md`, `AKE_WORKLOG.md`, `AKE_PROTOCOL.md`, `main` HTML |

> Durante a fase pré-modularização, Claude-Work trabalha no HTML monolítico.
> Após TASK-001 (modularização), cada agente toca apenas seu módulo.

---

## Contato / Sincronização

Sem canal de chat entre agentes. A sincronização é feita via arquivos no repo:
- `AKE_TASKS.md` — fila de trabalho (o "barramento" entre agentes)
- `AKE_WORKLOG.md` — histórico imutável
- PRs no GitHub — revisão e aprovação

O operador humano (Paulo) é o árbitro em caso de conflito.

---

*AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: AKE_PROTOCOL*
