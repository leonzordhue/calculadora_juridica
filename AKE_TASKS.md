# AKE_TASKS — Fila de Trabalho LAADV
> AKE/UFT-1.0 | BUILD: LAADV | IC: 1.0 | MÓDULO: TASKS
> Atualizado pelo Principal a cada mudança de status.
> Workers: leia este arquivo ao iniciar. Pegue a primeira task `status: ready` com seu agente.

---

## Resumo do Estado Atual

| Task | Título | Agente | Status | Prioridade |
|------|--------|--------|--------|------------|
| TASK-001 | Modularização /core /io /render | codex | done | ALTA |
| TASK-002 | localStorage — Perfil do Advogado | claude-work | done | ALTA |
| TASK-003 | Template Petição Inicial RMC/RCC | claude-work | done | MEDIA |
| TASK-004 | Template Impugnação à Execução | principal | done | MEDIA |
| TASK-005 | AKEKernel Supervisor Real (IC blocker) | claude-work | done | MEDIA |
| TASK-006 | Sanity Tests (numExtenso/calcPMT/acumular) | claude-work | done | MEDIA |
| TASK-007 | LIBRARY._meta — Versionamento de Fontes | principal | done | BAIXA |
| TASK-008 | Modo Noturno (dark mode toggle) | claude-work | done | MEDIA |
| TASK-009 | Terceiro Escritório LAADV/AM | claude-work | done | MEDIA |
| TASK-010 | Parsers Itaú+BB+Caixa + KEYWORDS expandido | claude-work | done | ALTA |
| TASK-011 | Rubrica Manual + Entrada Mês a Mês | claude-work | done | ALTA |

> TASK-011 depende de TASK-010 estar integrada em main (usa UIState.lastBatchResults).
> TASK-008, 009, 010 podem ser executadas em qualquer ordem — arquivos não conflitam entre si.
> Ordem recomendada de integração: 008 → 009 → 010 → 011.

---

---

## TASK-001 — Modularização: /core /io /render

```
status: ready
agent: codex
branch: codex/modular-core
prioridade: ALTA
arquivos_leitura:
  - LAADV_Calculadora_Juridica_v1.html
arquivos_saida:
  - core/library.js
  - core/financial-alu.js
  - core/legal-cpu.js
  - core/ake-kernel.js
  - core/petition-engine.js
  - io/bradesco-parser.js
  - io/inss-parser.js
  - render/report-builder.js
  - LAADV_Calculadora_Juridica_v1.html (refatorado para importar os módulos)
```

### Objetivo
Extrair o código JavaScript do HTML monolítico para módulos separados, mantendo o comportamento idêntico ao v1.4.0. O HTML final deve carregar os módulos via `<script src="...">` em ordem correta de dependências.

### Contexto
O projeto está em `LAADV_Calculadora_Juridica_v1.html` — arquivo único de ~3500+ linhas com todo CSS, HTML e JS inline. Isso impede trabalho paralelo entre agentes. A modularização cria isolamento: cada agente pode tocar seu módulo sem conflito.

**Mapa de extração:**
| Módulo | Conteúdo a extrair |
|--------|-------------------|
| `core/library.js` | `const LIBRARY = Object.freeze({...})` — IPCA/INPC/IGP-M/SELIC/Taxa Média + `const ESCRITORIOS = Object.freeze({...})` |
| `core/financial-alu.js` | `calcPMT()`, `acumularIndice()`, `fatorAcumulado()`, `formatarMoeda()`, `calcularJurosCompostos()` e todas as funções matemáticas puras |
| `core/legal-cpu.js` | `calcularConsignado()`, `calcularBatch()`, `LegalCPU.*` — orquestração de cálculo |
| `core/ake-kernel.js` | `AKEKernel.*`, `UIState`, `buildLog` |
| `core/petition-engine.js` | `PetitionEngine.*`, `numExtenso()`, `dataExtenso()` |
| `io/bradesco-parser.js` | `BradescoParser.*`, lógica de PDF upload Bradesco |
| `io/inss-parser.js` | `INSSParser.*`, lógica de PDF upload INSS |
| `render/report-builder.js` | `gerarRelatorio()`, `gerarFundamentoPDF()`, `exportarPeticaoPDF()`, `exportarPeticaoRTF()`, `ReportBuilder.*` |

### Critério de Aceite
- [ ] Todos os 8 módulos criados com Build ID no topo
- [ ] HTML v1.4.0 refatorado: `<script src="core/library.js">` etc em ordem correta
- [ ] `Object.freeze` mantido em LIBRARY e ESCRITORIOS (Axioma A1)
- [ ] Nenhuma função perde acesso a dependências (sem erros de `undefined`)
- [ ] Teste manual: calcular consignado + gerar petição PDF — resultado idêntico ao v1.4.0
- [ ] `window.*` exports necessários para que módulos se comuniquem (sem bundler)

### Status de Execução
- [ ] Análise de dependências concluída
- [ ] Módulos extraídos e salvos
- [ ] HTML refatorado
- [ ] Testado sem erros no console
- [ ] PR aberto contra `main`

---

---

## TASK-002 — localStorage: Perfil do Advogado

```
status: ready
agent: claude-work
branch: claude/work-localstorage-perfil
prioridade: ALTA
arquivos_leitura:
  - LAADV_Calculadora_Juridica_v1.html
arquivos_saida:
  - LAADV_Calculadora_Juridica_v1.html (feature adicionada)
```

### Objetivo
Salvar automaticamente em `localStorage` o perfil do escritório selecionado e os dados do cliente/processo preenchidos na aba "Peças Processuais", para que ao recarregar a página os campos já venham preenchidos.

### Contexto
Atualmente toda vez que a advogada abre a calculadora precisa re-selecionar o escritório (LAADV ou NG) e re-preencher os dados do cliente. Isso é repetitivo. O localStorage resolve sem backend.

**Dados a persistir:**
- `pet-escritorio` — seleção do escritório (LAADV/NG)
- `pet-adv-nome`, `pet-adv-oab` — dados do advogado (caso overrideados)
- `pet-estado`, `pet-tribunal` — UF e tribunal padrão do escritório
- `pet-cidade-comarca` — comarca padrão

**Dados que NÃO devem persistir** (variam por processo):
- `pet-cliente-nome`, `pet-cliente-cpf` — dados do cliente
- `pet-banco-reu`, `pet-processo-numero` — dados do processo
- Todos os valores monetários e datas

**Comportamento esperado:**
1. Ao carregar a página: ler localStorage, preencher campos de perfil
2. Ao mudar qualquer campo de perfil: salvar no localStorage imediatamente (debounce 500ms)
3. Botão "Limpar Perfil Salvo" no rodapé da aba Peças — reseta localStorage e recarrega

### Critério de Aceite
- [ ] Perfil persiste após F5 e fechamento da aba
- [ ] Dados de cliente/processo NÃO persistem (privacidade)
- [ ] Seleção de escritório (LAADV/NG) persiste e re-aplica preenchimento automático
- [ ] Botão de reset funciona
- [ ] Sem erros no console (try/catch em todas operações localStorage — pode estar desabilitado)
- [ ] PR aberto contra `main`

### Status de Execução
- [ ] Implementado
- [ ] Testado (persistência verificada)
- [ ] Testado fallback sem localStorage
- [ ] PR aberto contra `main`

---

---

## TASK-003 — Template: Petição Inicial RMC/RCC

```
status: ready
agent: claude-work
branch: claude/work-pet-inicial
prioridade: MEDIA
arquivos_leitura:
  - LAADV_Calculadora_Juridica_v1.html
  - [PDFs de modelo fornecidos pelo operador]
arquivos_saida:
  - LAADV_Calculadora_Juridica_v1.html (novo template no PetitionEngine)
```

### Objetivo
Adicionar o template "Petição Inicial — RMC/RCC" ao `PetitionEngine`. O tipo de peça deve ser selecionável no formulário (dropdown: "Cumprimento de Sentença" — já existe | "Petição Inicial").

### Contexto
O `PetitionEngine` atual suporta apenas "Cumprimento de Sentença — RMC/RCC". A advogada também precisa de Petição Inicial para casos novos. O DECODE/VALIDATE/RENDER já existem — apenas adicionar um novo branch de RENDER por tipo de peça.

**Estrutura da Petição Inicial:**
1. Cabeçalho: EXMO(A). SR(A). JUIZ(A) DE DIREITO DA [vara] VARA CÍVEL DA COMARCA DE [cidade]
2. Qualificação: AUTORA (nome, CPF, endereço) + RÉU (banco, CNPJ)
3. DOS FATOS — narrativa do contrato e cobranças abusivas
4. DO DIREITO — CDC, Lei 10.820/03, Lei 14.905/24
5. DOS PEDIDOS — repetição do indébito (dobro), danos morais (a definir)
6. DO VALOR DA CAUSA — matSimples + danos morais estimados
7. Requerimentos finais + local/data/assinatura

**Novos campos necessários no formulário:**
- `pet-tipo-peca` — dropdown: Cumprimento de Sentença | Petição Inicial
- `pet-vara` — número da vara (ex: "3ª")
- `pet-endereco-cliente` — endereço completo do cliente
- `pet-cnpj-banco` — CNPJ do banco réu (os mais comuns podem ser pré-populados)
- `pet-danos-morais` — valor estimado de danos morais

### Critério de Aceite
- [ ] Dropdown `pet-tipo-peca` adicionado, muda o template renderizado
- [ ] Template Petição Inicial completo com todos os blocos
- [ ] Export PDF e RTF funcionam para o novo template
- [ ] Pré-visualização HTML correta
- [ ] Campos específicos da PI visíveis apenas quando PI selecionada (show/hide)
- [ ] PR aberto contra `main`

### Status de Execução
- [ ] Estrutura do template definida
- [ ] Novos campos adicionados ao formulário
- [ ] RENDER_HTML e RENDER_TEXT implementados para PI
- [ ] Testado PDF e RTF
- [ ] PR aberto contra `main`

---

---

## TASK-004 — Template: Impugnação à Execução

```
status: blocked
agent: claude-work
branch: claude/work-pet-impugnacao
prioridade: MEDIA
bloqueio: Depende de TASK-003 (estrutura de dropdown de tipos de peça)
arquivos_leitura:
  - LAADV_Calculadora_Juridica_v1.html
arquivos_saida:
  - LAADV_Calculadora_Juridica_v1.html (novo template)
```

### Objetivo
Adicionar "Impugnação ao Cumprimento de Sentença" como terceiro tipo de peça no `PetitionEngine`.

### Contexto
Após TASK-003 existir o dropdown, basta adicionar um terceiro branch de RENDER. A Impugnação é usada quando a parte contrária calcula o débito de forma errada — a plataforma já gera o "Sistema de Apuração" que serve de base para esta peça.

### Critério de Aceite
- [ ] Template Impugnação adicionado ao dropdown
- [ ] Referencia automaticamente o "Sistema de Apuração" gerado pelo FinancialEngine
- [ ] Export PDF e RTF
- [ ] PR aberto contra `main`

### Status de Execução
- [ ] Aguardando TASK-003

---

---

## TASK-005 — AKEKernel: Supervisor Real (IC Blocker)

```
status: done
agent: claude-work
branch: claude/work-kernel-supervisor
prioridade: MEDIA
integrado_em: claude/principal-integracao-v1.8 → main (v1.8.0)
arquivos_leitura:
  - core/ake-kernel.js
  - core/legal-cpu.js
arquivos_saida:
  - core/ake-kernel.js (assertIC, registrarErroCalculo, exibirBloqueioIC)
  - core/legal-cpu.js (assertIC guards em executarCalculo e calcularConsignado)
```

### Objetivo
Transformar o `AKEKernel` de módulo de métricas em supervisor real que **bloqueia** o WRITEBACK (entrega de resultado ao usuário) quando IC < 0.9.

### Contexto
Atualmente o IC é calculado mas não bloqueia nada — é cosmético. O Axioma A2 diz que nenhum WRITEBACK ocorre com IC < 0.9. Precisamos enforçar isso.

**IC é calculado em:** `AKEKernel.calcIC(resultado)` — retorna 0.0 a 1.0 baseado em:
- Campos obrigatórios presentes
- Índice encontrado no LIBRARY
- Taxa BACEN obtida com sucesso
- Cálculo sem divisão por zero
- Resultado dentro de range razoável (> 0, < 10x o valor do contrato)

**Bloqueio deve:**
1. Impedir que `ReportBuilder` renderize resultado parcial
2. Exibir na UI: caixa vermelha com "WRITEBACK BLOQUEADO — IC: X.XX < 0.90" + lista dos itens que reduziram o IC
3. Logar no buildLog do AKEKernel com severity FATAL

### Critério de Aceite
- [ ] `AKEKernel.calcIC()` revisado e robusto (cobre todos os casos de falha)
- [ ] WRITEBACK bloqueado quando IC < 0.9 (teste com campos faltando)
- [ ] UI exibe mensagem de bloqueio com detalhes
- [ ] IC ≥ 0.9 libera normalmente (regressão: todos os cálculos existentes ainda funcionam)
- [ ] PR aberto contra `main`

### Status de Execução
- [ ] Lógica de IC revisada
- [ ] Bloqueio implementado
- [ ] Testes de regressão
- [ ] PR aberto contra `main`

---

---

## TASK-006 — Sanity Tests: numExtenso / calcPMT / acumularIndice

```
status: done
agent: claude-work
branch: claude/work-sanity-tests
prioridade: MEDIA
integrado_em: claude/principal-integracao-v1.8 → main (v1.8.0)
arquivos_leitura:
  - core/petition-engine.js (numExtenso)
  - core/financial-alu.js (calcPMT, acumularIndice)
arquivos_saida:
  - tests/sanity.html (runner browser com 17 assertions)
```

### Objetivo
Criar suite de testes de sanidade para as 3 funções matemáticas críticas, executável diretamente no browser (sem Jest/Node — a plataforma é HTML puro).

### Contexto
Não temos testes automatizados. As funções críticas são:
- `numExtenso(valor)` — conversão numérica PT-BR (erros aqui invalidam petições)
- `calcPMT(pv, i, n)` — fórmula Price (erros aqui invalidam cálculo de excesso)
- `FinancialEngine.acumularIndice(indice, dataInicio, dataFim)` — correção monetária

**Formato sugerido:** arquivo `tests/sanity.html` que carrega o HTML principal em iframe ou extrai as funções e roda assertions simples com output visual (verde/vermelho).

**Casos de teste mínimos:**

`numExtenso`:
- 0 → "zero reais"
- 1000.01 → "um mil reais e um centavo"
- 23562.25 → "vinte e três mil quinhentos e sessenta e dois reais e vinte e cinco centavos"
- 1000000 → "um milhão de reais"

`calcPMT`:
- PMT(10000, 0.02, 24) → ~530.71 (tolerância ±0.01)
- PMT(5000, 0.015, 12) → ~472.50 (tolerância ±0.01)

`acumularIndice`:
- IPCA jan/2023 a dez/2023 → fator ≈ 1.0462 (tolerância ±0.005)

### Critério de Aceite
- [ ] `tests/sanity.html` criado e rodável no browser
- [ ] Todos os casos de teste implementados
- [ ] Output visual: PASS (verde) / FAIL (vermelho) com valor esperado vs obtido
- [ ] Todos os casos passam no v1.4.0
- [ ] PR aberto contra `main`

### Status de Execução
- [ ] Casos de teste definidos
- [ ] Runner implementado
- [ ] Todos os testes passando
- [ ] PR aberto contra `main`

---

---

## TASK-007 — LIBRARY._meta: Versionamento de Fontes

```
status: ready
agent: codex
branch: codex/library-meta
prioridade: BAIXA
arquivos_leitura:
  - LAADV_Calculadora_Juridica_v1.html
arquivos_saida:
  - LAADV_Calculadora_Juridica_v1.html (ou core/library.js após TASK-001)
```

### Objetivo
Adicionar `LIBRARY._meta` com metadados de fonte para cada índice econômico — quando foi atualizado, qual a série SGS, data de validade dos dados.

### Contexto
Atualmente o LIBRARY tem os índices mas não documenta a fonte. Em caso de impugnação, a advogada precisa citar a fonte. `LIBRARY._meta` resolve isso e alimenta o "Sistema de Apuração" gerado.

**Estrutura proposta:**
```javascript
LIBRARY._meta = Object.freeze({
  IPCA: {
    fonte: 'IBGE via BACEN SGS',
    serie_sgs: 433,
    ultima_atualizacao: '2026-04',
    cobertura: '1980-01 até 2026-04',
    url: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados'
  },
  INPC: { serie_sgs: 188, ... },
  IGPM: { serie_sgs: 189, ... },
  SELIC: { serie_sgs: 11, ... },
  TAXA_MEDIA_CONSIGNADO_INSS: { serie_sgs: 25468, ... },
  IPCA_E: { serie_sgs: 10764, ... }
});
```

### Critério de Aceite
- [ ] `LIBRARY._meta` criado como `Object.freeze` (Axioma A1)
- [ ] Metadados corretos para todos os 6+ índices do LIBRARY
- [ ] `gerarFundamentoCalculo()` e `gerarFundamentoConsignado()` referenciam `LIBRARY._meta` na nota metodológica
- [ ] PR aberto contra `main`

### Status de Execução
- [ ] _meta estrutura definida
- [ ] Dados preenchidos e verificados
- [ ] Integrado nas funções de apuração
- [ ] PR aberto contra `main`

---

---

## Histórico de Tasks Concluídas

*(Nenhuma ainda — primeira versão do sistema de tasks)*

---

*AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: AKE_TASKS*
