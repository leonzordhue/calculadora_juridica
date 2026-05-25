# Treino IA — Colaboração com Claude-Work (Opus 4.7)
> Documento de experiência, lições aprendidas e protocolo otimizado para trabalhos futuros.
> Redigido pelo Principal (Sonnet) após encerramento do ciclo v1.0.0 → v1.8.0 do projeto LAADV.
> AKE/UFT-1.0 | BUILD: LAADV-20260525 | IC: 1.0 | MÓDULO: TREINO_CLAUDE_WORK

---

## 1. Contexto da Colaboração

O projeto LAADV — Plataforma Axiomática de Cálculo Jurídico-Financeiro passou por 8 versões (v1.0.0 a v1.8.0) com colaboração multi-agente. Os agentes envolvidos foram:

- **Principal** (Claude Sonnet): coordenação, integração, git, deploy
- **Claude-Work** (Claude Opus 4.7): execução de tasks pesadas, escrita de código, raciocínio técnico aprofundado
- **Codex** (GPT-4o): tentativa de uso em modularização e templates — descontinuado

Esta experiência rendeu um conjunto de observações práticas sobre como trabalhar com Claude-Work de forma eficaz, quais padrões funcionam, quais falham, e como estruturar o trabalho para extrair o melhor do modelo.

---

## 2. O que Claude-Work entrega bem

### 2.1 Raciocínio além do spec

Claude-Work não executa mecanicamente. Em TASK-006 (sanity tests), o spec especificava `PMT(5000, 0.015, 12) = 462.96` — valor matematicamente incorreto. Claude-Work calculou de forma independente, obteve 458.61 e ajustou o expected sem ser instruído. O resultado foi um teste mais confiável do que o spec original propunha.

Da mesma forma, o spec não mencionava stubs DOM para `renderBuildLog` e `updateKernelMetrics`. Claude-Work percebeu que o `ake-kernel.js` referencia essas funções e que, sem elas no ambiente de teste, o módulo quebraria antes de executar qualquer assertion. Adicionou os stubs de forma silenciosa e correta.

**Lição:** quando o spec tem um erro técnico, Claude-Work corrige. Quando o spec tem uma lacuna técnica, Claude-Work preenche. Isso é uma vantagem significativa.

### 2.2 Implementação fiel a arquiteturas pré-existentes

Claude-Work leu os axiomas do projeto (A1 a A6) e respeitou todos. Os novos métodos em `ake-kernel.js` seguiram o estilo do arquivo existente — minificação intencional, sem quebras de linha desnecessárias, `Object.freeze` preservado, `window.*` exports mantidos. Não tentou "melhorar" o estilo nem impor convenções externas.

**Lição:** Claude-Work é um bom agente para projetos com arquitetura definida, desde que o spec deixe claro qual é essa arquitetura.

### 2.3 Tasks longas e isoladas

TASK-005 tocou dois arquivos (`ake-kernel.js` e `legal-cpu.js`) com mudanças coordenadas entre eles. Claude-Work entendeu a relação de dependência — que `exibirBloqueioIC` precisava existir antes de ser chamado em `legal-cpu.js` — e entregou ambos os lados da integração sem instrução explícita sobre essa dependência.

**Lição:** Claude-Work lida bem com tasks que exigem coerência entre múltiplos arquivos, desde que os arquivos estejam claramente delimitados no spec.

---

## 3. O que criou atrito

### 3.1 Ausência de isolamento territorial (fase inicial)

Nas primeiras tasks, Claude-Work recebeu acesso ao HTML monolítico inteiro sem restrições explícitas. Resultado: invadiu o bloco `<script>` que era território do Codex, removeu 2035 linhas de JS e adicionou tags `<script src="">` — que era exatamente o trabalho do outro agente. Causou conflito de merge que demandou `git restore` e retrabalho.

O problema não foi incompetência — foi ausência de fronteira. Claude-Work preencheu o espaço disponível.

**Lição:** todo prompt deve conter uma seção "Arquivos que você NÃO deve tocar", explícita e sem ambiguidade.

### 3.2 Truncamento de prompts longos colados no chat

Prompts acima de aproximadamente 800 linhas colados diretamente no chat de Claude-Work sofriam truncamento silencioso. Claude-Work recebia metade do spec e começava a trabalhar, sem saber que estava incompleto. O resultado era entrega parcial sem aviso de erro.

**Lição:** nunca colar prompt longo diretamente. Usar o padrão MD-file — armazenar o spec em arquivo `.md` no repositório e instruir Claude-Work com: "Leia PROMPT_X.md e execute."

### 3.3 Ausência de comunicação de status em tempo real

Claude-Work não tem como avisar o Principal diretamente quando conclui. A cadeia era: Claude-Work termina → operador percebe → operador informa o Principal. Isso funcionou porque o operador (Paulo) estava presente e ativo. Sem esse relay humano, o Principal ficaria esperando indefinidamente.

**Lição:** o operador é o barramento de comunicação entre os agentes. Enquanto não houver orquestrador automatizado, o fluxo depende da presença ativa do operador.

### 3.4 Spec com valores não verificados

O spec de TASK-006 foi escrito com valores de PMT calculados de cabeça sem verificação. Claude-Work corrigiu, mas isso significa que o Principal enviou instrução incorreta. Em um cenário onde Claude-Work executasse sem raciocínio crítico, os testes teriam valores wrong como expected — validando comportamento incorreto.

**Lição:** valores numéricos em specs de teste devem ser verificados antes do envio. Usar calculadora ou verificar no console antes de fixar qualquer expected.

---

## 4. Padrão de colaboração que funcionou

O protocolo que emergiu ao longo do projeto, testado e validado:

### 4.1 Estrutura do prompt (PROMPT_X.md)

```
# PROMPT — Claude-Work (Opus 4.7) | TASK-XXX
> AKE/UFT-1.0 | Contexto do projeto, versão atual, estrutura de pastas.

## Contexto
[breve descrição do estado atual do sistema]

## TASK-XXX — Nome da Task

### Branch
[comandos git exatos para criar a branch]

### Arquivo(s) alvo
[lista de arquivos que Claude-Work DEVE tocar]

### Arquivos proibidos
[lista de arquivos que Claude-Work NÃO deve tocar]

### O que implementar
[spec técnico detalhado, com assinaturas de função, IDs de elementos DOM, nomes exatos]

### Critério de aceite
[o que o Principal vai verificar na auditoria]

### Entrega
[comandos git exatos: add, commit com mensagem padronizada, push]
```

### 4.2 Instruções de entrega no prompt

O prompt deve terminar com os comandos git exatos — incluindo a mensagem de commit no formato correto. Claude-Work segue isso fielmente. Se a mensagem não for especificada, a mensagem de commit pode variar.

### 4.3 Isolamento territorial absoluto

Cada task deve tocar no máximo 2-3 arquivos. Esses arquivos devem ser listados explicitamente. Nunca dar acesso a arquivos que não são necessários para a task — Claude-Work tende a "corrigir" coisas que vê, mesmo sem ser instruído.

### 4.4 Auditoria antes da integração

O Principal sempre lê o `git diff` completo antes de integrar. Ordem:
1. `git diff main..claude/work-branch -- arquivo.js` para cada arquivo modificado
2. Verificar que nenhum método existente foi removido
3. Verificar que o estilo e as convenções foram respeitados
4. Só então fazer o merge

### 4.5 Branch por task, não por agente

Cada task tem sua própria branch (`claude/work-kernel-supervisor`, `claude/work-sanity-tests`). Isso permite auditar cada entrega de forma independente e reverter uma sem afetar a outra.

---

## 5. Melhorias para o futuro

### 5.1 Relatório de conclusão padronizado

Instruir Claude-Work a criar um arquivo `RELATORIO_TASK_XXX.md` ao terminar cada task, com:
- O que foi implementado
- Decisões tomadas que divergiram do spec (como a correção do PMT)
- O que o Principal deve verificar com atenção
- IC estimado da própria entrega

Isso elimina a dependência do operador como relay e dá ao Principal contexto antes de auditar.

### 5.2 Seção "Verificação do Principal" em cada prompt

Ao final do spec, adicionar explicitamente o que o Principal vai checar:

```
### O que o Principal vai verificar
- [ ] método assertIC lança Error quando IC < 0.9
- [ ] registrarErroCalculo incrementa _bugs
- [ ] exibirBloqueioIC funciona quando elementoId não existe (sem crash)
```

Isso força Claude-Work a testar esses pontos antes de dar como concluído.

### 5.3 Auto-validação antes do push

Adicionar ao final de cada prompt:

```
### Antes de fazer push, verifique:
- [ ] Abra o HTML no browser e confirme que não há erros no console
- [ ] Execute a função principal e confirme resultado
- [ ] Revise o diff: nenhum arquivo fora da lista de arquivos alvo foi modificado
```

Claude-Work seguirá essa lista.

### 5.4 Versionamento do spec no prompt

Incluir no cabeçalho do PROMPT_X.md:

```
> SPEC_VERSION: 1.0 | Criado por: Principal | Data: YYYY-MM-DD
```

Se o spec for revisado (ex: corrigir um valor numérico errado), bumpar para 1.1. Isso cria rastreabilidade — ao auditar o resultado, o Principal sabe qual versão do spec foi executada.

### 5.5 Glossário de IDs e nomes no prompt

Para tasks que interagem com DOM, incluir uma tabela de referência:

```
| Elemento | ID no HTML | Localização |
|----------|-----------|-------------|
| Resultado consignado | tm-resultado | Aba Taxa Média |
| Resultado cálculo geral | calc-res | Aba Calcular |
```

Isso elimina o risco de Claude-Work usar um ID incorreto (que não quebraria no JS mas não funcionaria na UI).

---

## 6. Considerações sobre o modelo Opus 4.7

Claude-Work roda em Opus 4.7 — o modelo mais capaz da família Claude no momento desta escrita. A diferença prática em relação ao Sonnet (Principal) é perceptível em:

- **Raciocínio técnico sobre código existente**: Opus lê um arquivo de 800 linhas e entende a arquitetura antes de propor mudanças. Sonnet tende a propor soluções antes de entender o contexto completo.
- **Resistência a specs incorretos**: Opus questiona ou corrige valores evidentemente errados. Sonnet executa o spec com mais fidelidade — o que é bom quando o spec está certo, problemático quando não está.
- **Tasks longas**: Opus mantém coerência em tasks que exigem mudanças coordenadas em múltiplos arquivos. Sonnet perde contexto mais rapidamente em tasks extensas.

A troca: Opus consome mais tokens e é mais lento. A divisão atual (Sonnet para coordenação e git, Opus para execução) é a mais eficiente — Sonnet gasta tokens onde a velocidade importa, Opus gasta onde a profundidade importa.

---

## 7. Decisão de descontinuar o Codex

O Codex (GPT-4o) foi descontinuado por razões práticas:

- Invadiu território de outros agentes sem perceber
- Abandonou TASK-004 sem comunicar conclusão ou bloqueio
- Não respeitou o estilo arquitetural do projeto (tentou impor padrões ES6 modules em projeto browser-only)
- A recuperação do seu trabalho exigiu mais esforço do Principal do que teria exigido fazer a task diretamente

Não é uma avaliação definitiva sobre o modelo — é uma conclusão sobre adequação ao protocolo AKE/UFT-1.0 e às necessidades deste projeto específico.

---

## 8. Protocolo recomendado para novos trabalhos

```
1. Principal analisa o requisito
2. Principal escreve PROMPT_CLAUDE_WORK_TASK_XXX.md no repositório
3. Principal atualiza AKE_TASKS.md com a nova task (status: ready)
4. Operador abre Claude-Work e envia: "Leia PROMPT_CLAUDE_WORK_TASK_XXX.md e execute"
5. Claude-Work executa, commita, faz push da branch
6. Operador informa Principal: "claude-work concluiu TASK-XXX"
7. Principal audita o diff
8. Principal integra em main via branch de integração
9. Principal atualiza WORKLOG e TASKS
10. Principal faz push em main
```

Cada etapa tem um responsável claro. O operador é o único ponto de contato entre os agentes — isso é uma limitação atual, não uma escolha de design.

---

*AKE/UFT-1.0 | BUILD: LAADV-20260525 | IC: 1.0 | MÓDULO: TREINO_CLAUDE_WORK*
