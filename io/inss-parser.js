// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MODULO: io/inss-parser.js
'use strict';

//  INSSParser — Analisador de Histórico de Créditos INSS · PDF.js 3.11.174
//  Layout: Código[70-105] | Descrição[140-430] | Valor[450-535]
//  Competência MM/YYYY[35-145] nas linhas de resumo de pagamento
//  Classificação prioritária por código rubrica (INSS_CODES), alta confiança
// ══════════════════════════════════════════════════════════════════════
class INSSParser {
  constructor() {
    this.CFG={
      xCode:[70, 105],   // código rubrica 3 dígitos (ex: '217', '268', '216')
      xDesc:[140, 430],  // descrição da rubrica
      xVal: [450, 535],  // valor R$
      xComp:[35,  145],  // competência MM/YYYY (linha resumo de pagamento)
      yGap: 8,           // limiar de agrupamento de itens na mesma linha
      valMin:0.01, valMax:200000
    };
  }

  async parse(file, onProgress) {
    if (typeof pdfjsLib==='undefined') throw new Error('PDF.js não carregado. Verifique a internet.');
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf=await file.arrayBuffer();
    const pdf=await pdfjsLib.getDocument({data:buf}).promise;
    const itens=[];
    let competenciaAtual='';
    for (let p=1; p<=pdf.numPages; p++) {
      if(onProgress) onProgress(p, pdf.numPages);
      const pg=await pdf.getPage(p);
      const ct=await pg.getTextContent();
      const rows=this._groupRows(ct.items);
      for(const r of rows) {
        const parsed=this._parseRow(r, competenciaAtual);
        if(parsed.comp) competenciaAtual=parsed.comp;
        if(parsed.item) itens.push(parsed.item);
      }
    }
    return this._classify(this._dedup(itens));
  }

  _groupRows(items) {
    // Ordena por Y decrescente (topo da página primeiro) e depois X crescente
    const sorted=[...items].sort((a,b)=>{
      const dy=Math.abs(b.transform[5]-a.transform[5]);
      return dy>this.CFG.yGap ? b.transform[5]-a.transform[5] : a.transform[4]-b.transform[4];
    });
    const rows=[]; let cur=null;
    for(const it of sorted) {
      const y=it.transform[5], x=it.transform[4];
      if(!cur||Math.abs(y-cur.y)>this.CFG.yGap){cur={y,items:[]};rows.push(cur);}
      cur.items.push({x, txt:it.str.trim()});
    }
    return rows;
  }

  _parseRow(row, competenciaAtual) {
    const c=this.CFG;
    let code='', desc='', valTxt='', compTxt='';
    for(const it of row.items) {
      if(!it.txt) continue;
      const x=it.x;
      // Código rubrica: 3 dígitos exatos na coluna de código
      if(x>=c.xCode[0]&&x<=c.xCode[1] && /^\d{3}$/.test(it.txt)) {
        code=it.txt;
      }
      // Descrição
      if(x>=c.xDesc[0]&&x<=c.xDesc[1]) {
        desc+=(desc?' ':'')+it.txt;
      }
      // Valor monetário
      if(x>=c.xVal[0]&&x<=c.xVal[1]) {
        if(it.txt.includes('R$')||(/[\d,]/.test(it.txt)&&it.txt.length>2)) valTxt=it.txt;
      }
      // Competência MM/YYYY — linha de resumo de pagamento
      if(x>=c.xComp[0]&&x<=c.xComp[1] && /^\d{2}\/\d{4}$/.test(it.txt)) {
        compTxt=it.txt;
      }
    }
    // Linha de competência (sem código rubrica)
    if(compTxt && !code) return {comp:compTxt, item:null};
    // Linha de rubrica com código + descrição
    if(code && desc) {
      const valor=this._pv(valTxt);
      if(valor===null||valor<c.valMin||valor>c.valMax) return {comp:null, item:null};
      const dataStr=competenciaAtual ? this._compToDate(competenciaAtual) : new Date().toISOString().slice(0,10);
      return {comp:null, item:{data:dataStr, desc:desc.trim(), tipo:'D', valor, _code:code, competencia:competenciaAtual}};
    }
    return {comp:null, item:null};
  }

  _compToDate(comp) {
    // MM/YYYY → YYYY-MM-01
    const p=comp.split('/');
    if(p.length!==2) return comp;
    return `${p[1]}-${p[0].padStart(2,'0')}-01`;
  }

  _pv(txt) {
    if(!txt) return null;
    const v=parseFloat(txt.replace(/[R$\s]/g,'').replace(/\./g,'').replace(',','.'));
    return isNaN(v) ? null : Math.abs(v);
  }

  _dedup(itens) {
    const s=new Set();
    return itens.filter(it=>{
      const k=`${it.data}|${it._code}|${it.desc}|${it.valor}`;
      if(s.has(k))return false; s.add(k); return true;
    });
  }

  _classify(itens) {
    return itens.map(it=>{
      let cat='OUTROS', conf=0.5;
      // Prioridade 1: código rubrica INSS → alta confiança (0.95)
      if(it._code && LIBRARY.INSS_CODES[it._code]) {
        cat=LIBRARY.INSS_CODES[it._code];
        conf=0.95;
      } else {
        if(it._code && !LIBRARY.INSS_CODES[it._code] && typeof kernel!=='undefined') {
          kernel.registrarBuild('IDX_WARN',`Rubrica INSS desconhecida: código ${it._code} — classificado via keywords`);
        }
        // Prioridade 2: keywords (fallback)
        const up=typeof normalizarTexto!=='undefined'?normalizarTexto(it.desc):it.desc.toUpperCase();
        for(const[c,kws] of Object.entries(LIBRARY.KEYWORDS)){
          for(const kw of kws){ if(up.includes(kw)){cat=c;conf=0.75;break;} }
          if(cat!=='OUTROS')break;
        }
      }
      return {...it, categoria:cat, confidence:+conf.toFixed(2)};
    });
  }
}


// ══════════════════════════════════════════════════════════════════════
//  detectarTipo — Identifica tipo de documento PDF: 'INSS' ou 'BRADESCO'
//  Lê a primeira página e busca marcadores textuais do INSS
// ══════════════════════════════════════════════════════════════════════
async function detectarTipo(file) {
  if (typeof pdfjsLib === 'undefined') return 'BRADESCO';
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const pg = await pdf.getPage(1);
    const ct = await pg.getTextContent();
    const texto = ct.items.map(i => i.str).join(' ').toUpperCase();

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
    if ((texto.includes('BANCO DO BRASIL') ||
         (texto.includes('EXTRATO DE CONTA CORRENTE') &&
          (texto.includes('HISTÓRICO') || texto.includes('HISTORICO')) &&
          texto.includes('LOTE')))) {
      return 'BB';
    }
    // Caixa Econômica Federal — exige marcador específico para evitar falso positivo
    if ((texto.includes('CAIXA ECONOMICA') || texto.includes('CAIXA FEDERAL') || texto.includes('CAIXA ECONÔMICA')) &&
        (texto.includes('INTERNET BANKING') || texto.includes('EXTRATO POR PER'))) {
      return 'CAIXA';
    }
    // Bradesco (padrão)
    return 'BRADESCO';
  } catch(e) {
    return 'BRADESCO';
  }
}


// ══════════════════════════════════════════════════════════════════════

// -- exports para outros modulos --
window.INSSParser = INSSParser;
window.detectarTipo = detectarTipo;
