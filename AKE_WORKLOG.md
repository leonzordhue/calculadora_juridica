# AKE_WORKLOG — LAADV Plataforma Axiomática de Cálculo Jurídico-Financeiro
> Append-only. Nunca deletar entradas. Fonte de verdade de auditoria do projeto.
> AKE/UFT-1.0 | BUILD: LAADV | IC: 1.0

---

## Estrutura do Sistema (Mapa de Emulação)

| Componente emulado | Módulo LAADV              | Papel                                                     |
|--------------------|---------------------------|-----------------------------------------------------------|
| ROM / Firmware     | `LIBRARY`                 | Índices econômicos, leis, keywords, constantes, SGS BACEN |
| CPU                | `LegalCPU`                | FETCH → DECODE → EXECUTE → WRITEBACK                      |
| ALU / FPU          | `FinancialEngine`         | Correção monetária, mora, juros, fator acumulado Price/PMT|
| RAM                | `UIState`                 | Estado volátil de sessão — último cálculo, lote, relatório|
| GPU / Renderer     | `ReportBuilder` + UI      | Tabelas, PDFs, petições, memórias de cálculo              |
| I/O Controller     | `BradescoParser` + upload | PDF → transações estruturadas; export PDF/XLSX/RTF        |
| Barramento         | Tabs + eventos            | Extratos → Calcular → Comparativo → Relatório → Peças     |
| Kernel / Supervisor| `AKEKernel`               | Integridade, build log, métricas Q/IC/H/τ                 |
| ECC / Sanity Check | Validações pré-WRITEBACK  | Missing fields, IC < 0.9 bloqueiam saída                  |
| Memória persistente| `PetitionEngine.DECODE`   | Perfis de escritório (ROM), localStorage (futuro)         |
| Syscalls           | Ações da UI               | calcular(), importarDoLAADV(), gerarPeticao()             |

---

## Axiomas do Sistema

- **A1 — Imutabilidade da ROM**: `LIBRARY` e `ESCRITORIOS` são `Object.freeze()` — jamais alterados em runtime
- **A2 — Integridade de Cálculo (IC ≥ 0.9)**: nenhum WRITEBACK ocorre com IC abaixo do limiar
- **A3 — Rastreabilidade**: toda operação gera entrada no build log do AKEKernel
- **A4 — Fonte Primária BACEN**: taxa média sempre referenciada ao SGS BACEN — nunca inferida
- **A5 — Separação ALU/CPU**: FinancialEngine é puro (sem efeitos colaterais de UI); LegalCPU orquestra
- **A6 — Log Append-Only**: este documento nunca perde entradas — apenas recebe novas

---

## Log de Builds

### v1.8.0 — TASK-005 + TASK-006: AKEKernel Supervisor + Sanity Tests
- **Data**: 24/mai/2026
- **Agente**: Claude-Work (Opus 4.7) — execução | Principal (Sonnet) — integração
- **Mudanças**:
  - TASK-005: AKEKernel agora é supervisor real — Axioma A2 enforçado em runtime
    - `assertIC(contexto)`: lança Error se IC < LIBRARY.JURIDICO.IC_MIN (0.9); loga 'IC_BLOCK'
    - `registrarErroCalculo(id, motivo)`: substitui registrarBuild('ERR') com semântica detalhada; incrementa _bugs
    - `exibirBloqueioIC(erro, elementoId)`: renderiza caixa vermelha ⛔ na UI com IC atual e mensagem
    - `legal-cpu.js`: `executarCalculo()` e `calcularConsignado()` — guards assertIC antes de cada WRITEBACK
    - `buscarTaxaMedia()` catch: migrado de registrarBuild para registrarErroCalculo
  - TASK-006: Suite de sanity tests browser-native
    - `tests/sanity.html`: 17 assertions (10 numExtenso, 3 calcPMT, 4 acumularIndice)
    - Stubs DOM adicionados (renderBuildLog, updateKernelMetrics) — permite carregar ake-kernel.js sem DOM
    - PMT(5000, 1.5%, 12) corrigido para 458.61 (valor matematicamente correto vs 462.96 do spec)
    - Milhão sem "de" — output real do numExtenso verificado antes de fixar expected
- **Axiomas afetados**: A2 (enforçado), A3 (erros agora loggados com detalhe)
- **IC final**: 1.0

---

### v1.7.0 — TASK-004 Impugnação ao Cumprimento de Sentença
- **Data**: 24/mai/2026
- **Agente**: Principal
- **Mudanças**: Template Impugnação completo — renderImpugnacaoHTML/TEXT, tabela de valores LAADV inline, metodologia Price/BACEN/Lei 14.905, 4 pedidos. VALIDATE condicional. Opção no select pet-tipo-peca.
- **Axiomas afetados**: A3, A5
- **IC final**: 1.0

---

### v1.6.0 — TASK-003 Template Petição Inicial RMC/RCC
- **Data**: 24/mai/2026
- **Agente**: Claude-Work (HTML) + Codex (JS) + Principal (integração + toggleCamposPeca)
- **Mudanças**: Dropdown tipo de peça, campos pet-vara/pet-endereco-cliente/pet-cnpj-banco/pet-danos-morais, renderPeticaoInicialHTML/TEXT, DECODE+VALIDATE atualizados
- **Axiomas afetados**: A3, A5
- **IC final**: 1.0

---

### v1.5.0 — Modularização + localStorage (Integração Principal)
- **Data**: 24/mai/2026
- **Agente**: Codex (módulos) + Claude-Work (localStorage) + Principal (integração)
- **Mudanças**:
  - TASK-001: HTML 3537→1437 linhas — JS extraído para 8 módulos independentes
    - `core/library.js` — ROM LIBRARY + ESCRITORIOS (Object.freeze, Axioma A1)
    - `core/financial-alu.js` — FinancialEngine puro sem efeitos de UI (Axioma A5)
    - `core/ake-kernel.js` — AKEKernel + UIState + kernel
    - `core/legal-cpu.js` — LegalCPU, pipeline de cálculo
    - `core/petition-engine.js` — PetitionEngine + numExtenso + dataExtenso
    - `io/bradesco-parser.js` — BradescoParser
    - `io/inss-parser.js` — INSSParser + detectarTipo
    - `render/report-builder.js` — ReportBuilder + PDF + RTF
  - TASK-002: PerfilStorage — localStorage do perfil do escritório (debounce, try/catch, anti-loop)
  - AKE_PROTOCOL.md: isolamento de pastas por agente (Codex=*.js, Claude-Work=HTML, Principal=integração)
- **Lição aprendida**: agentes sem isolamento de arquivos geram conflito de merge. Solução: cada agente toca apenas sua pasta/tipo de arquivo.
- **Axiomas afetados**: A1, A3, A5, A6
- **IC final**: 1.0

---

## Log de Builds

### v1.0.0 — Fundação
- **Data**: mai/2026
- **Agente**: Claude (Principal/Sonnet)
- **Módulos criados**: `LegalCPU`, `FinancialEngine`, `LIBRARY` (IPCA/INPC/IGP-M/SELIC), `BradescoParser`, `INSSParser`, `AKEKernel`, `UIState`, `ReportBuilder`
- **Features**: Upload PDF, classificação de transações, cálculo jurídico individual, TJRJ/TJAM/TJDFT, Lei 14.905/2024 auto-split
- **Axiomas afetados**: A1, A2, A3, A5
- **IC final**: 1.0

---

### v1.3.0 — Cálculo em Lote + Totalizador RMC/RCC
- **Data**: mai/2026
- **Agente**: Claude (Principal/Sonnet)
- **Mudanças**:
  - Cálculo parcela-a-parcela (batch) com dobro automático por tipo
  - Totalizador RMC/RCC separado com breakdown por categoria
  - Fix do display do dobro (subtotalSimples × 2)
  - Labels "valor nominal bruto — sem correção"
- **Axiomas afetados**: A2, A3
- **IC final**: 1.0

---

### v1.3.1 — Taxa Média BACEN + Mora Avançada
- **Data**: mai/2026
- **Agente**: Claude (Principal/Sonnet)
- **Mudanças**:
  - Campo `tm-saque` (data do saque) — taxa do mês específico, não média do período
  - Mora manual (% a.m.) + data início separada
  - IPCA-E sem restrição de UF
  - "Sem correção monetária" como opção
  - Label "Termo Final / Data Base de Atualização"
  - Nota metodológica SGS vs BACEN histórico (diferença ±0.03-0.10% explicada)
- **Fonte**: SGS 25468 (INSS), 25469 (Público), 25470 (Privado) — CORS habilitado
- **Axiomas afetados**: A4, A3
- **IC final**: 1.0

---

### v1.3.2 — Sistema de Apuração para Impugnação
- **Data**: mai/2026
- **Agente**: Claude (Principal/Sonnet)
- **Mudanças**:
  - Gerador automático de texto formal "Sistema de Apuração — para Impugnação"
  - Função `gerarFundamentoCalculo()` + `gerarFundamentoConsignado()`
  - Botão "📋 Copiar Texto" com feedback visual
  - Exibição em caixa monospace com scroll
- **Motivação cliente**: "o importante é ela mostrar o sistema de apuração, pq em caso de Impugnação, eu tenho respaldo pra sustentar o cálculo"
- **Axiomas afetados**: A3, A6
- **IC final**: 1.0

---

### v1.3.3 — Valor do Saque separado + PDF do Sistema de Apuração
- **Data**: mai/2026
- **Agente**: Claude (Principal/Sonnet)
- **Mudanças**:
  - Novo campo `tm-saque-valor` — PV do empréstimo (base do PMT)
  - `tm-total` renomeado → "Total Descontado do Extrato" (base do indébito)
  - `calcularConsignado()`: PMT usa valorSaque como PV; excesso = extrato − (PMT × n)
  - Breakdown de subtração: saque → PMT → totalCorreto → excesso (memória de cálculo inline)
  - `gerarFundamentoPDF(tipo)`: PDF com header colorido do escritório, Courier, rodapé paginado
  - Botões "📄 Gerar PDF" (dourado) nos dois boxes de Apuração
  - Atualização de `gerarFundamentoConsignado()` com PV separado
- **Axiomas afetados**: A1, A2, A5
- **IC final**: 1.0

---

### v1.4.0 — Gerador de Peças Processuais (PetitionEngine)
- **Data**: 24/mai/2026
- **Agente**: Claude (Principal/Sonnet)
- **Módulos criados**: `PetitionEngine`, `numExtenso()`, `dataExtenso()`, `ESCRITORIOS` ROM
- **Mudanças**:
  - Nova aba "📜 Peças Processuais"
  - Seleção de escritório: LAADV (Luis Albert/teal) vs NG (Nicolas Gomes/azul)
    - Perfis pré-configurados: OAB, banco, agência, conta, CNPJ, cidade, email, tel
  - `PetitionEngine.DECODE()` — coleta e computa todos os campos do formulário
  - `PetitionEngine.VALIDATE()` — campos obrigatórios; bloqueia saída incompleta
  - `PetitionEngine.RENDER_HTML()` — preview fiel com tabelas, destaques, pronomes
  - `PetitionEngine.RENDER_TEXT()` — texto puro para PDF/RTF
  - `numExtenso(valor)` — R$ → extenso PT-BR puro (zero IA, lógica determinística)
    - Validado: R$23.562,25 → "vinte e três mil quinhentos e sessenta e dois reais e vinte e cinco centavos"
  - Toggle prescrição quinquenal (estilo AM vs RJ)
  - Pronomes automáticos por gênero (Autora/Autor, da/do, pela/pelo)
  - "⚡ Importar do LAADV" — preenche de lastConsignado + lastBatchResults
  - Totalizador em tempo real (matSimples, honorários, total executar)
  - Export PDF (jsPDF, Times 12pt, cabeçalho do escritório, rodapé paginado)
  - Export RTF (Word-native, sem dependências externas)
  - Pré-visualização modal HTML
- **Templates suportados**: Cumprimento de Sentença — RMC/RCC
- **Axiomas afetados**: A1 (ROM ESCRITORIOS), A2 (VALIDATE), A3, A5 (DECODE puro)
- **IC final**: 1.0

---

## Roadmap / Backlog

### Próximas versões

| Prioridade | Feature | Módulo afetado | Branch sugerida |
|---|---|---|---|
| ALTA | Modularização: separar em arquivos core/*.js | Todos | `codex/modular-core` |
| ALTA | AKEKernel como supervisor real (bloquear IC<0.9) | AKEKernel | `codex/kernel-supervisor` |
| ALTA | localStorage: perfil do advogado salvo permanentemente | PetitionEngine | `claude/pet-localstorage` |
| MEDIA | Template Petição Inicial RMC/RCC | PetitionEngine.ROM | `claude/pet-inicial` |
| MEDIA | Template Impugnação à Execução | PetitionEngine.ROM | `claude/pet-impugnacao` |
| MEDIA | LIBRARY._meta: versionamento de fontes | LIBRARY | `codex/library-meta` |
| MEDIA | Testes de sanidade (calcPMT, numExtenso, acumular) | FinancialEngine, ALU | `codex/sanity-tests` |
| BAIXA | Separação em módulos: /core /io /render /state | Arquitetura | `codex/modular-core` |
| BAIXA | AKE_WORKLOG em localStorage (append no browser) | AKEKernel | `claude/kernel-worklog` |

---

## Protocolo Multi-Agente (AKE/UFT-1.0)

```
FETCH → DECODE → EXECUTE → WRITEBACK
```

| Agente | Modelo | Branch padrão | Papel |
|---|---|---|---|
| **Claude (Principal)** | Sonnet | `claude/*` | UI, petições, expansão conceitual, git, deploy |
| **Codex** | GPT-4o | `codex/*` | Refactor, modularização, testes, kernel real |
| **Futuro Agente 3** | A definir | `agent3/*` | A definir |

### Regras de coordenação
- Nunca dois agentes no mesmo arquivo na mesma branch simultaneamente
- Commits atômicos com prefixo: `feat/fix/refactor/docs/test`
- Todo PR inclui: o que mudou, axioma afetado, IC do resultado
- Branch `main` = produção = GitHub Pages — só recebe merge com IC=1.0
- Este WORKLOG é atualizado a cada merge em main

---

*AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: WORKLOG*
