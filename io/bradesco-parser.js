// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MODULO: io/bradesco-parser.js
'use strict';

//  BradescoParser — Analisador de Extratos PDF · PDF.js 3.11.174
// ══════════════════════════════════════════════════════════════════════
class BradescoParser {
  constructor() {
    this.CFG={xData:[10,110],xDesc:[110,380],xCred:[380,450],xDeb:[450,540],yGap:12,valMin:0.01,valMax:200000};
  }
  async parse(file,onProgress) {
    if (typeof pdfjsLib==='undefined') throw new Error('PDF.js não carregado. Verifique a internet.');
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf=await file.arrayBuffer();
    const pdf=await pdfjsLib.getDocument({data:buf}).promise;
    const itens=[];
    for (let p=1;p<=pdf.numPages;p++) {
      if(onProgress)onProgress(p,pdf.numPages);
      const pg=await pdf.getPage(p);
      const ct=await pg.getTextContent();
      const rows=this._groupRows(ct.items);
      for(const r of rows)itens.push(...this._parseRow(r));
    }
    return this._classify(this._dedup(itens));
  }
  _groupRows(items) {
    const sorted=[...items].sort((a,b)=>{
      const dy=Math.abs(b.transform[5]-a.transform[5]);
      return dy>this.CFG.yGap?b.transform[5]-a.transform[5]:a.transform[4]-b.transform[4];
    });
    const rows=[]; let cur=null;
    for(const it of sorted){
      const y=it.transform[5],x=it.transform[4];
      if(!cur||Math.abs(y-cur.y)>this.CFG.yGap){cur={y,items:[]};rows.push(cur);}
      cur.items.push({x,txt:it.str.trim()});
    }
    return rows;
  }
  _parseRow(row) {
    const c=this.CFG; let data='',desc='',cred=null,deb=null;
    for(const it of row.items){
      if(!it.txt)continue;
      if(it.x>=c.xData[0]&&it.x<c.xData[1]){if(/\d{2}\/\d{2}/.test(it.txt))data=it.txt;}
      else if(it.x>=c.xDesc[0]&&it.x<c.xDesc[1]){desc+=(desc?' ':'')+it.txt;}
      else if(it.x>=c.xCred[0]&&it.x<c.xCred[1]){cred=this._pv(it.txt);}
      else if(it.x>=c.xDeb[0]&&it.x<c.xDeb[1]){deb=this._pv(it.txt);}
    }
    if(!data||!desc||(cred===null&&deb===null))return[];
    const tipo=deb!==null?'D':'C', valor=deb??cred;
    if(valor<c.valMin||valor>c.valMax)return[];
    return [{data:this._nd(data),desc:desc.trim(),tipo,valor}];
  }
  _pv(txt){ const v=parseFloat(txt.replace(/[R$\s]/g,'').replace(/\./g,'').replace(',','.')); return isNaN(v)?null:Math.abs(v); }
  _nd(d){ const p=d.split('/'); if(p.length<2)return d; let y=p[2]||new Date().getFullYear().toString(); if(y.length===2)y='20'+y; return `${y}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`; }
  _dedup(itens){ const s=new Set(); return itens.filter(it=>{ const k=`${it.data}|${it.desc}|${it.tipo}|${it.valor}`; if(s.has(k))return false; s.add(k);return true; }); }
  _classify(itens) {
    return itens.map(it=>{
      let cat='OUTROS',conf=0.5;
      const up=typeof normalizarTexto!=='undefined'?normalizarTexto(it.desc):it.desc.toUpperCase();
      for(const[c,kws]of Object.entries(LIBRARY.KEYWORDS)){
        for(const kw of kws){ if(up.includes(kw)){cat=c;conf=0.7+Math.min(kw.length,12)/40;break;} }
        if(cat!=='OUTROS')break;
      }
      if(it.tipo==='D'&&['RMC','RCC','SEGURO','TARIFA'].includes(cat))conf=Math.min(conf+0.15,0.99);
      return{...it,categoria:cat,confidence:+conf.toFixed(2)};
    });
  }
}


// ══════════════════════════════════════════════════════════════════════

// -- exports para outros modulos --
window.BradescoParser = BradescoParser;
