# PROMPT — Claude-Work (Opus 4.7) | TASK-010 — Novos Parsers + Keywords
> AKE/UFT-1.0 | PRINCIPAL → CLAUDE-WORK | Execute esta task completa.
> Projeto: LAADV Plataforma Axiomática de Cálculo Jurídico-Financeiro · v1.8.0+

---

## Contexto do Projeto

Repositório: https://github.com/leonzordhue/calculadora_juridica.git
Plataforma: HTML puro, GitHub Pages — sem bundler. Todos os exports via `window.*`.

A plataforma atualmente lê extratos de dois bancos: **Bradesco** e **INSS**. A função `detectarTipo(file)` em `io/inss-parser.js` retorna `'INSS'` ou `'BRADESCO'`. O router em `LAADV_Calculadora_Juridica_v1.html` (linha ~1152) usa:
```js
const parser = tipoPDF==='INSS' ? new INSSParser() : new BradescoParser();
```

Esta task cria suporte a mais 3 bancos.

---

## TASK-010 — Parsers: Itaú + Banco do Brasil + Caixa + KEYWORDS expandido

### Branch
```
git checkout main
git pull origin main
git checkout -b claude/work-novos-parsers
```

### Arquivos que você DEVE tocar
- `io/itau-parser.js` — criar (novo)
- `io/bb-parser.js` — criar (novo)
- `io/caixa-parser.js` — criar (novo)
- `io/inss-parser.js` — atualizar `detectarTipo()`
- `core/library.js` — expandir `KEYWORDS` e `INSS_CODES`
- `LAADV_Calculadora_Juridica_v1.html` — adicionar `<script>` tags + expandir router

### Arquivos que você NÃO deve tocar
- `core/ake-kernel.js`, `core/financial-alu.js`, `core/legal-cpu.js`
- `core/petition-engine.js`, `render/report-builder.js`
- `io/bradesco-parser.js`

---

## Parte 1 — Formatos dos novos bancos (análise dos PDFs)

### 1.1 Itaú (extrato conta corrente)

Formato texto extraído (PDF.js + pdfplumber):
```
MARCO ANTONIO DE OLIVEIRA TROCADO  949.630.457-53  agência: 6824  conta: 072854-4
extrato conta / lançamentos
período de visualização: 18/12/2025 até 18/03/2026  emitido em: 18/03/2026 17:06:09
data  lançamentos  valor (R$)  saldo (R$)
18/03/2026  RSCSS CONFEITARIA 1803  -6,36
18/03/2026  SALDO DO DIA  225,69
12/03/2026  CREDITO CONSIGNADO  4.000,02
04/03/2026  PGTO INSS 01684733780  2.772,51
04/03/2026  SEGURO CARTAO  -9,90
04/03/2026  ADIANT.DEPOSITANTE 23/02  -59,90
03/03/2026  IOF  -0,04
02/03/2026  JUROS SALDO DEVEDOR C/C  -0,09
```

**Regras de parse Itaú:**
- Marcador de detecção: texto contém `"extrato conta / lan"` (ou `"EXTRATO CONTA"`) E (`"agência:"` ou `"agencia:"`)
- Linha de transação: `DD/MM/YYYY DESCRIÇÃO VALOR` onde VALOR pode ser negativo (débito) ou positivo (crédito)
- Ignorar linhas: `"SALDO DO DIA"`, `"saldo (R$)"`, `"lançamentos"`, linhas de cabeçalho
- Tipo: se valor < 0 → `'D'` (débito); se valor > 0 → `'C'` (crédito)
- Data: formato `DD/MM/YYYY` → normalizar para `YYYY-MM-DD`

**Estratégia de implementação:** use extração de texto por linha (concatenar todos os `str` da mesma linha Y com tolerância `yGap=8`), depois aplique regex na linha concatenada:

```js
// Regex para linha de transação Itaú
const RE_TXN = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)$/;
```

### 1.2 Banco do Brasil (extrato conta corrente)

Formato texto:
```
Extrato de Conta Corrente
Cliente JORGE CARNEIRO ALVES
Período: 01 a 30/11/2023  Agência: 3286-7  Conta: 77123-6
Lançamentos
Dia  Lote  Documento  Histórico  Valor
31/10/2023  Saldo Anterior  179,26 (-)
01/11/2023  13404  220000  Clube de beneficios 10/2023  32,00 (-)
01/11/2023  13601  511058916  Cobranças de Juros  11,71 (-)
07/11/2023  14134  487599  Salário ord empregador  1.316,19 (+)
10/11/2023  13158  149997310  Pagto cartão crédito  1.301,40 (-)
Saldo do dia  1.274,12 (+)
```

**Regras de parse BB:**
- Marcador de detecção: texto contém `"Extrato de Conta Corrente"` E `"Histórico"` E `"Lote"`
- Linha de transação: `DD/MM/YYYY LOTE DOC DESCRICAO VALOR (+)` ou `VALOR (-)`
- `(+)` = crédito `'C'`, `(-)` = débito `'D'`
- Ignorar: `"Saldo do dia"`, `"Saldo Anterior"`, `"Lançamentos"`, linhas de cabeçalho
- Descrição pode estar em outra linha agrupada — use o mesmo mecanismo de agrupamento por Y

**Regex para linha BB:**
```js
// Linha com data + descrição + valor + sinal
const RE_BB = /^(\d{2}\/\d{2}\/\d{4})\s+\d+\s+\d+\s+(.+?)\s+([\d.,]+)\s+\(([+-])\)$/;
// Fallback sem lote/doc:
const RE_BB2 = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d.,]+)\s+\(([+-])\)$/;
```

### 1.3 Caixa Econômica Federal

Formato texto:
```
Internet Banking CAIXA
Extrato por período
Cliente: HANDERSON LEAL COSTA
Conta: 4572 | 1288 | 000854890449-4
Data: 22/06/2021 - 15:37  Mês: Janeiro/2021
Data Mov.  Nr. Doc.  Histórico  Valor  Saldo
01/01/2021  000000  REM BASICA  0,00 C  3.984,57 C
04/01/2021  310744  CRED PIX  445,00 C  4.429,84 C
04/01/2021  311033  ENVIO TEV  3.000,00 D  1.429,84 C
04/01/2021  311837  SAQUE B24H  500,00 D  645,85 C
```

**Regras de parse Caixa:**
- Marcador de detecção: texto contém `"CAIXA"` E (`"Internet Banking"` OU `"Extrato por per"`)
- Linha de transação: `DD/MM/YYYY NDOC HISTORICO VALOR C/D SALDO C/D`
- `C` = crédito, `D` = débito (sufixo imediatamente após o valor)
- Ignorar: linhas de cabeçalho, linhas com valor `0,00`

**Regex para linha Caixa:**
```js
const RE_CEF = /^(\d{2}\/\d{2}\/\d{4})\s+\d+\s+(.+?)\s+([\d.,]+)\s+([CD])\s+[\d.,]+\s+[CD]$/;
```

---

## Parte 2 — Estrutura dos novos parsers

Cada parser segue o mesmo padrão do `BradescoParser` e `INSSParser`:

```js
// AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MODULO: io/itau-parser.js
'use strict';

class ItauParser {
  constructor() {
    this.CFG = { yGap: 8, valMin: 0.01, valMax: 200000 };
  }

  async parse(file, onProgress) {
    if (typeof pdfjsLib==='undefined') throw new Error('PDF.js não carregado.');
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: buf}).promise;
    const itens = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      if (onProgress) onProgress(p, pdf.numPages);
      const pg = await pdf.getPage(p);
      const ct = await pg.getTextContent();
      const linhas = this._agruparLinhas(ct.items);
      for (const l of linhas) itens.push(...this._parseLinha(l));
    }
    return this._classificar(this._dedup(itens));
  }

  _agruparLinhas(items) {
    // Agrupa items por proximidade Y → retorna array de strings (texto concatenado por linha)
    const sorted = [...items].sort((a,b)=>{
      const dy = Math.abs(b.transform[5]-a.transform[5]);
      return dy>this.CFG.yGap ? b.transform[5]-a.transform[5] : a.transform[4]-b.transform[4];
    });
    const linhas=[]; let cur=null;
    for(const it of sorted){
      const y=it.transform[5];
      if(!cur||Math.abs(y-cur.y)>this.CFG.yGap){cur={y,txt:''};linhas.push(cur);}
      cur.txt += (cur.txt?' ':'')+it.str.trim();
    }
    return linhas.map(l=>l.txt).filter(t=>t.length>0);
  }

  _parseLinha(linha) {
    // Implementar regex de acordo com formato Itaú
    // Retornar [] se não for linha de transação
    // Retornar [{data, desc, tipo, valor}]
  }

  _pv(txt) {
    if(!txt) return null;
    const v = parseFloat(txt.replace(/[R$\s]/g,'').replace(/\./g,'').replace(',','.'));
    return isNaN(v) ? null : Math.abs(v);
  }

  _nd(d) {
    const p=d.split('/');
    if(p.length<2) return d;
    let y=p[2]||new Date().getFullYear().toString();
    if(y.length===2) y='20'+y;
    return `${y}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  }

  _dedup(itens) {
    const s=new Set();
    return itens.filter(it=>{
      const k=`${it.data}|${it.desc}|${it.tipo}|${it.valor}`;
      if(s.has(k)) return false; s.add(k); return true;
    });
  }

  _classificar(itens) {
    return itens.map(it=>{
      let cat='OUTROS', conf=0.5;
      const up=it.desc.toUpperCase();
      for(const[c,kws] of Object.entries(LIBRARY.KEYWORDS)){
        for(const kw of kws){
          if(up.includes(kw)){ cat=c; conf=0.7+Math.min(kw.length,12)/40; break; }
        }
        if(cat!=='OUTROS') break;
      }
      if(it.tipo==='D'&&['RMC','RCC','SEGURO','TARIFA'].includes(cat)) conf=Math.min(conf+0.15,0.99);
      return {...it, categoria:cat, confidence:+conf.toFixed(2)};
    });
  }
}

window.ItauParser = ItauParser;
```

Crie `BBParser` e `CaixaParser` com a mesma estrutura, adaptando `_parseLinha()` para cada formato.

---

## Parte 3 — Atualizar `detectarTipo()` em `io/inss-parser.js`

Substitua a função `detectarTipo` existente por:

```js
async function detectarTipo(file) {
  if (typeof pdfjsLib==='undefined') return 'BRADESCO';
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: buf}).promise;
    const pg = await pdf.getPage(1);
    const ct = await pg.getTextContent();
    const texto = ct.items.map(i=>i.str).join(' ').toUpperCase();

    // INSS — prioridade máxima
    if (texto.includes('INSTITUTO NACIONAL DO SEGURO SOCIAL') ||
        texto.includes('HISTORICO DE CREDITOS') ||
        texto.includes('HISTÓRICO DE CRÉDITOS') ||
        (texto.includes('COMPETENCIA') && texto.includes('NIT')) ||
        texto.includes('NIT:')) {
      return 'INSS';
    }
    // Itaú
    if ((texto.includes('EXTRATO CONTA') || texto.includes('EXTRATO CONTA / LAN')) &&
        (texto.includes('AGÊNCIA:') || texto.includes('AGENCIA:') || texto.includes('AGÊNCIA:'))) {
      return 'ITAU';
    }
    // Banco do Brasil
    if (texto.includes('EXTRATO DE CONTA CORRENTE') &&
        (texto.includes('HISTÓRICO') || texto.includes('HISTORICO')) &&
        texto.includes('LOTE')) {
      return 'BB';
    }
    // Caixa Econômica Federal
    if (texto.includes('CAIXA') &&
        (texto.includes('INTERNET BANKING') || texto.includes('EXTRATO POR PER'))) {
      return 'CAIXA';
    }
    // Bradesco (padrão)
    return 'BRADESCO';
  } catch(e) {
    return 'BRADESCO';
  }
}
```

---

## Parte 4 — Atualizar router no HTML

Localize a linha no `LAADV_Calculadora_Juridica_v1.html`:
```js
const parser = tipoPDF==='INSS' ? new INSSParser() : new BradescoParser();
```

Substitua por:
```js
let parser;
if (tipoPDF==='INSS')         parser = new INSSParser();
else if (tipoPDF==='ITAU')    parser = new ItauParser();
else if (tipoPDF==='BB')      parser = new BBParser();
else if (tipoPDF==='CAIXA')   parser = new CaixaParser();
else                          parser = new BradescoParser();
```

Adicione os `<script>` das novas parsers na ordem correta — após `inss-parser.js`:
```html
<script src="io/itau-parser.js"></script>
<script src="io/bb-parser.js"></script>
<script src="io/caixa-parser.js"></script>
```

Atualize também o log de boot:
```js
kernel.registrarBuild('PARSER','BradescoParser + INSSParser + ItauParser + BBParser + CaixaParser · detectarTipo() automático');
```

---

## Parte 5 — Expandir `LIBRARY.KEYWORDS` em `core/library.js`

Localize `KEYWORDS: Object.freeze({` e adicione/expanda as categorias:

```js
// Adicionar na categoria TARIFA:
TARIFA: ['TARIFA','ANUIDADE','CESTA','PACOTE SERV','EMIS EXTRATO','SAQUE TERM','SAQUE 24H','TAR MANUT',
         'CESTA BASICA DE SERVICO','CESTA BASICA SERVICOS','CLUBE DE BENEFICIOS','CLUBE BENEFICIO'],

// Adicionar nova categoria CARTAO_CREDITO:
CARTAO_CREDITO: ['GASTOS CARTAO DE CREDITO','PAGTO CARTAO','PAGAMENTO CARTAO','DEB CARTAO',
                 'FATURA CARTAO','OUROCARD','CARTAO VISA','CARTAO ELO','FAT CARTAO'],

// Adicionar na categoria JUROS:
JUROS: ['JUROS','MORA','IOF','ENC FINANC','ENCARGOS','JUROS CART',
        'JUROS SALDO DEVEDOR','COBRANCA DE JUROS','COBRANÇA DE JUROS','COBR JUROS'],

// Adicionar na categoria PARCELA:
PARCELA: ['PARCELA','CREDITO PESSOAL','EMPRÉST','EMPR PESSOAL','CRED PESSOAL','CONSIG EMP',
          'CREDITO CONSIGNADO','PGTO INSS','ADIANT.DEPOSITANTE'],
```

**Importante:** respeitar o `Object.freeze` — a expansão vai dentro do literal de objeto antes do freeze.

---

## Parte 6 — Expandir `LIBRARY.INSS_CODES` em `core/library.js`

Adicione os códigos faltantes:

```js
INSS_CODES: Object.freeze({
  '101': 'OUTROS',   // Valor Total MR do Período (bruto/referência)
  '137': 'OUTROS',   // Adiantamento p/arredondamento do crédito
  '201': 'OUTROS',   // IRRF
  '207': 'OUTROS',   // IR 13° Salário
  '216': 'PARCELA',  // Consignação Empréstimo Bancário
  '217': 'RMC',      // Empréstimo sobre a RMC
  '218': 'OUTROS',   // Varia
  '221': 'SEGURO',   // Seguro Prestamista
  '222': 'SEGURO',   // Seguro de Vida
  '268': 'RCC',      // Consignação Cartão (RCC)
  '303': 'OUTROS',   // Abatimento beneficiário maior 65 anos
  '316': 'OUTROS',   // Saldo devedor arredondamento
  '322': 'RMC',      // Reserva de Margem Consignável (RMC) — rubrica de margem
})
```

---

### Critério de aceite

- [ ] Upload de extrato Itaú → tipo detectado 'ITAU' → transações extraídas com data/desc/valor corretos
- [ ] Upload de extrato BB → tipo detectado 'BB' → transações extraídas
- [ ] Upload de extrato Caixa → tipo detectado 'CAIXA' → transações extraídas
- [ ] Upload de INSS → continua detectando 'INSS' (regressão)
- [ ] Upload de Bradesco → continua detectando 'BRADESCO' (regressão)
- [ ] "GASTOS CARTAO DE CREDITO" categoriza como `CARTAO_CREDITO`
- [ ] "CESTA BASICA DE SERVICO" categoriza como `TARIFA`
- [ ] "CREDITO CONSIGNADO" categoriza como `PARCELA`
- [ ] INSS_CODES expandido — código 101, 137, 303, 316, 322 mapeados
- [ ] window.ItauParser, window.BBParser, window.CaixaParser exportados
- [ ] Sem erros no console

### Nota sobre testes

Como a plataforma é browser-only, o teste deve ser feito abrindo o HTML localmente (`file://`) e fazendo upload de cada tipo de PDF. Confirme no console que o tipo correto é detectado e que as transações têm data/desc/valor coerentes com o original.

---

### Entrega

```
git add io/itau-parser.js io/bb-parser.js io/caixa-parser.js io/inss-parser.js core/library.js LAADV_Calculadora_Juridica_v1.html
git commit -m "feat(TASK-010): parsers Itaú+BB+Caixa, detectarTipo expandido, KEYWORDS+INSS_CODES atualizados"
git push origin claude/work-novos-parsers
```

---

*AKE/UFT-1.0 | BUILD: LAADV-20260526 | IC: 1.0 | MÓDULO: PROMPT_TASK_010*
