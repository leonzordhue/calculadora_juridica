# LAADV — Plataforma Axiomática de Cálculo Jurídico-Financeiro

> **AKE/UFT-1.0** · v1.0 · Luís Albert Advocacia

Sistema operacional jurídico-financeiro HTML para identificação de cobranças bancárias indevidas, geração de laudos periciais e memórias de cálculo para ações judiciais.

---

## 🔗 Acesso Online (GitHub Pages)

**[▶ Abrir Plataforma](https://leonzordhue.github.io/calculadora_juridica/)**

---

## 📋 Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **📂 Extratos** | Parser PDF Bradesco com coordenadas X/Y, classificação axiomática, confidence scoring |
| **⚙ Calcular** | Pipeline LegalCPU: FETCH→DECODE→EXECUTE→WRITEBACK com trace completo |
| **⚖ Comparativo** | Adversário vs. LAADV — identificação de excesso cobrado, histórico |
| **📄 Relatório** | Memória de cálculo completa, export PDF e XLSX |
| **⚛ Kernel** | Métricas AKE (Q, IC, H, τ), inspetor de índices, build log append-only |

---

## 🧮 Motor de Cálculo

- **Lei 14.905/2024** — split automático em 30/08/2024:
  - Pré-split: INPC + 1% a.m. (Art. 406 CC)
  - Pós-split: IPCA + SELIC
- **Repetição em dobro** — Art. 42, §único, CDC (RMC/RCC)
- **Pró-rata diária** para meses parciais
- **Índices embarcados** (2018–2025): IPCA, INPC, IGP-M, SELIC

---

## 🏛 Arquitetura

```
Harvard Architecture (AKE/UFT-1.0)
├── LIBRARY (Object.freeze) — ROM: índices econômicos, keywords, constantes jurídicas
├── AKEKernel              — Q(n) = IC×[Ac/At]×e^(−H)×[1−B/At]
├── LegalCPU               — FETCH→DECODE→EXECUTE→WRITEBACK
├── FinancialEngine         — ALU: funções puras de cálculo financeiro
├── BradescoParser          — PDF.js 3.11.174 com classificação axiomática
└── ReportBuilder           — jsPDF + SheetJS
```

---

## ⚙ Stack Técnica

- HTML5 + CSS3 + Vanilla JS (arquivo único, sem build, sem backend)
- [PDF.js 3.11.174](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js)
- [SheetJS 0.20.2](https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.20.2/xlsx.full.min.js)
- [jsPDF 2.5.1](https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js) + AutoTable 3.8.2

---

## 📌 Cobranças Identificáveis

- **RMC/RCC** — Reserva de Margem para Cartão / Consignado
- **BX ANT.FINAN** — Refinanciamento / Baixa Antecipada
- **Tarifas indevidas** — cestas, pacotes, saques, emissão de extrato
- **Juros/Mora/IOF** — encargos abusivos
- **Seguros forçados** — prestamista, vida, capitalização (venda casada)
- **Parcelas de empréstimos** — crédito pessoal indevido

---

## 👤 Autoria

**Paulo Esteves Fernandes Neto** — DMOB/SEINFRA  
Metodologia: AKE/UFT-1.0 (Axiomatic Kernel Engine / Unified Field Theory)

---

*LAADV Plataforma Axiomática v1.0 · 2026*
