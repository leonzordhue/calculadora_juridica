# LAADV — Calculadora Jurídica v1.9.4

> **AKE/UFT-1.0** · Luís Albert Advocacia

Plataforma jurídico-financeira HTML para identificação de cobranças bancárias indevidas, geração de memórias de cálculo, laudos e peças processuais para ações judiciais.

---

## Acesso Online (GitHub Pages)

**https://leonzordhue.github.io/calculadora_juridica/**

---

## Funcionalidades

- Upload e análise de extratos PDF (Bradesco, Itaú, BB, Caixa, INSS)
- Classificação automática de transações por 27 rubricas jurídicas
- Cálculo de indébito consignado com taxa média BACEN (SGS)
- Correção monetária: IPCA, INPC, IGP-M, SELIC, IPCA-E
- Cálculo em lote (batch) com totalizador RMC/RCC
- Gerador de peças processuais: Cumprimento de Sentença, Petição Inicial, Impugnação
- Export PDF (jsPDF) e RTF nativos
- Memória de cálculo em PDF com sistema de apuração formal
- Relatório de cálculo individual com comparativo Price/BACEN
- Dark mode com persistência
- Três escritórios configurados: LAADV (RJ), NG (AM), LAADV/AM
- Backend de auditoria: registro automático no Google Drive e Google Sheets

---

## Arquitetura (Harvard Emulation — AKE/UFT-1.0)

| Módulo | Arquivo | Papel |
|--------|---------|-------|
| ROM / Firmware | `core/library.js` | LIBRARY: índices, rubricas, constantes (Object.freeze) |
| ALU / FPU | `core/financial-alu.js` | FinancialEngine: cálculos puros sem efeitos de UI |
| CPU | `core/legal-cpu.js` | LegalCPU: pipeline FETCH→DECODE→EXECUTE→WRITEBACK |
| Kernel | `core/ake-kernel.js` | AKEKernel: supervisor IC, build log, métricas |
| GPU / Renderer | `core/petition-engine.js` + `render/report-builder.js` | Petições, PDFs, RTF |
| I/O | `io/bradesco-parser.js` + demais parsers | Parsers de extrato PDF por banco |
| Backend | `backend/laadv_backend.gs` | Google Apps Script: Drive + Sheets audit log |

---

## Axiomas do Sistema

- **A1** — `LIBRARY` e `ESCRITORIOS` são `Object.freeze()` — imutáveis em runtime
- **A2** — IC >= 0.9 obrigatório — `assertIC()` bloqueia WRITEBACK abaixo do limiar
- **A3** — Toda operação gera entrada no `AKEKernel` build log
- **A4** — Taxa média sempre referenciada ao SGS BACEN — nunca inferida
- **A5** — `FinancialEngine` é puro (sem efeitos colaterais de UI)
- **A6** — `AKE_WORKLOG.md` é append-only — nunca perde entradas

---

## Testes

Abrir `tests/sanity.html` no browser para executar a suite de sanidade (29 assertions).

---

## Protocolo Multi-Agente

| Agente | Papel |
|--------|-------|
| **Principal** (Sonnet) | Coordenação, integração, git, deploy |
| **Claude-Work** (Opus 4.7) | Execução de tasks — toca apenas `LAADV_Calculadora_Juridica_v1.html` |
| **Codex** | Módulos `core/`, `io/`, `render/` |

---

*AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0*
